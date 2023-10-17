import { UserProfile } from "@prisma/v2-client"
import { FastifyReply, FastifyRequest } from "fastify"
import { verifyPassword, mediaGuard } from "@noroff/api-utils"
import {
  CreateProfileInput,
  LoginInput,
  createProfileBodySchema,
  loginBodySchema,
  CreateAPIKeyInput,
  createApiKeySchema
} from "./auth.schema"
import { createProfile, findProfileByEmail, findProfileByEmailOrName, createApiKey } from "./auth.service"
import { BadRequest, Unauthorized } from "http-errors"

export async function registerProfileHandler(
  request: FastifyRequest<{
    Body: CreateProfileInput
  }>,
  reply: FastifyReply
) {
  try {
    const body = await createProfileBodySchema.parseAsync(request.body)

    const checkProfile = await findProfileByEmailOrName(body.email, body.name)

    if (checkProfile.data) {
      throw new BadRequest("Profile already exists")
    }

    if (body.avatar?.url) {
      await mediaGuard(body.avatar.url)
    }
    if (body.banner?.url) {
      await mediaGuard(body.banner.url)
    }

    const profile = await createProfile(body)

    reply.code(201).send(profile)
  } catch (error) {
    throw error
  }
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: LoginInput
  }>
) {
  try {
    const body = await loginBodySchema.parseAsync(request.body)

    const profile = await findProfileByEmail(body.email)

    if (!profile.data) {
      throw new Unauthorized("Invalid email or password")
    }

    // Compare supplied password with stored password
    const correctPassword = verifyPassword({
      candidatePassword: body.password,
      salt: profile.data.salt,
      hash: profile.data.password
    })

    if (!correctPassword) {
      throw new Unauthorized("Invalid email or password")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, salt, ...rest } = profile.data

    return {
      data: {
        name: profile.data.name,
        email: profile.data.email,
        bio: profile.data.bio,
        avatar: profile.data.avatar,
        banner: profile.data.banner,
        accessToken: request.jwt.sign(rest)
      }
    }
  } catch (error) {
    throw error
  }
}

export async function createApiKeyHandler(
  request: FastifyRequest<{
    Body: CreateAPIKeyInput
  }>,
  reply: FastifyReply
) {
  try {
    await createApiKeySchema.parseAsync(request.body)
    const { name: userName } = request.user as UserProfile

    const apiKey = await createApiKey(userName, request.body?.name)

    reply.code(201).send(apiKey)
  } catch (error) {
    throw error
  }
}
