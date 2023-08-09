import { UserProfile, HolidazeVenue } from "@prisma-api-v2/client"
import { FastifyRequest, FastifyReply } from "fastify"
import { BadRequest, NotFound, Forbidden, InternalServerError, isHttpError } from "http-errors"
import {
  createVenueSchema,
  CreateVenueSchema,
  queryFlagsSchema,
  updateVenueSchema,
  UpdateVenueSchema,
  venueIdSchema,
  venuesQuerySchema
} from "./venues.schema"
import { getProfile } from "../profiles/profiles.service"
import { getVenues, getVenue, createVenue, deleteVenue, updateVenue } from "./venues.service"
import { mediaGuard } from "@/utils/mediaGuard"
import { ZodError } from "zod"

export interface HolidazeVenueIncludes {
  owner?: boolean
  bookings?: boolean
}

export async function getVenuesHandler(
  request: FastifyRequest<{
    Querystring: {
      limit?: number
      page?: number
      sort?: keyof HolidazeVenue
      sortOrder?: "asc" | "desc"
      _owner?: boolean
      _bookings?: boolean
    }
  }>
) {
  try {
    await venuesQuerySchema.parseAsync(request.query)
    const { sort, sortOrder, limit, page, _owner, _bookings } = request.query

    if (limit && limit > 100) {
      throw new BadRequest("Limit cannot be greater than 100")
    }

    const includes: HolidazeVenueIncludes = {
      owner: Boolean(_owner),
      bookings: Boolean(_bookings)
    }

    const venues = await getVenues(sort, sortOrder, limit, page, includes)

    return venues
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequest(error.message)
    }

    if (isHttpError(error)) {
      throw error
    }

    throw new InternalServerError("Something went wrong.")
  }
}

export async function getVenueHandler(
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: {
      _owner?: boolean
      _bookings?: boolean
    }
  }>
) {
  try {
    const { id } = await venueIdSchema.parseAsync(request.params)
    const { _owner, _bookings } = await queryFlagsSchema.parseAsync(request.query)

    const includes: HolidazeVenueIncludes = {
      owner: Boolean(_owner),
      bookings: Boolean(_bookings)
    }

    const venue = await getVenue(id, includes)

    if (!venue.data) {
      throw new NotFound("Venue not found")
    }

    return venue
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequest(error.message)
    }

    if (isHttpError(error)) {
      throw error
    }

    throw new InternalServerError("Something went wrong.")
  }
}

export async function createVenueHandler(
  request: FastifyRequest<{
    Body: CreateVenueSchema
    Querystring: {
      _owner?: boolean
      _bookings?: boolean
    }
  }>
) {
  try {
    const { name } = request.user as UserProfile
    const { media } = await createVenueSchema.parseAsync(request.body)
    const { _owner, _bookings } = await queryFlagsSchema.parseAsync(request.query)

    const includes: HolidazeVenueIncludes = {
      owner: Boolean(_owner),
      bookings: Boolean(_bookings)
    }

    const profile = await getProfile(name)

    if (!profile.data) {
      throw new NotFound("Profile not found")
    }

    if (!profile.data.venueManager) {
      throw new Forbidden("You are not a venue manager")
    }

    if (media) {
      for (const url of media) {
        await mediaGuard(url)
      }
    }

    const venue = await createVenue(name, request.body, includes)

    return venue
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequest(error.message)
    }

    if (isHttpError(error)) {
      throw error
    }

    throw new InternalServerError("Something went wrong.")
  }
}

export async function updateVenueHandler(
  request: FastifyRequest<{
    Params: { id: string }
    Body: UpdateVenueSchema
    Querystring: {
      _owner?: boolean
      _bookings?: boolean
    }
  }>
) {
  try {
    const { name } = request.user as UserProfile
    const { id } = await venueIdSchema.parseAsync(request.params)
    const { media } = await updateVenueSchema.parseAsync(request.body)
    const { _owner, _bookings } = await queryFlagsSchema.parseAsync(request.query)

    const includes: HolidazeVenueIncludes = {
      owner: Boolean(_owner),
      bookings: Boolean(_bookings)
    }

    const venue = await getVenue(id)

    if (!venue.data) {
      throw new NotFound("Venue not found")
    }

    if (venue.data.ownerName.toLowerCase() !== name.toLowerCase()) {
      throw new Forbidden("You are not the owner of this venue")
    }

    const profile = await getProfile(name)

    if (!profile?.data?.venueManager) {
      throw new Forbidden("You are not a venue manager")
    }

    if (media) {
      for (const url of media) {
        await mediaGuard(url)
      }
    }

    const updatedVenue = await updateVenue(id, request.body, includes)

    return updatedVenue
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequest(error.message)
    }

    if (isHttpError(error)) {
      throw error
    }

    throw new InternalServerError("Something went wrong.")
  }
}

export async function deleteVenueHandler(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  try {
    const { name } = request.user as UserProfile
    const { id } = await venueIdSchema.parseAsync(request.params)

    const venue = await getVenue(id)

    if (!venue.data) {
      throw new NotFound("Venue not found")
    }

    if (venue.data.ownerName.toLowerCase() !== name.toLowerCase()) {
      throw new Forbidden("You are not the owner of this venue")
    }

    const profile = await getProfile(name)

    if (!profile?.data?.venueManager) {
      throw new Forbidden("You are not a venue manager")
    }

    await deleteVenue(id)

    reply.code(204)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequest(error.message)
    }

    if (isHttpError(error)) {
      throw error
    }

    throw new InternalServerError("Something went wrong.")
  }
}