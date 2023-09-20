import { FastifyInstance } from "fastify"

import {
  displayBookingSchema,
  bookingsQuerySchema,
  queryFlagsSchema,
  bookingIdSchema,
  createBookingSchema,
  updateBookingSchema
} from "./bookings.schema"
import {
  getBookingsHandler,
  getBookingHandler,
  createBookingHandler,
  deleteBookingHandler,
  updateBookingHandler
} from "./bookings.controller"

async function bookingsRoutes(server: FastifyInstance) {
  server.get(
    "/",
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ["holidaze-bookings"],
        security: [{ bearerAuth: [] }],
        querystring: bookingsQuerySchema,
        response: {
          200: displayBookingSchema.array()
        }
      }
    },
    getBookingsHandler
  )

  server.get(
    "/:id",
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ["holidaze-bookings"],
        security: [{ bearerAuth: [] }],
        querystring: queryFlagsSchema,
        params: bookingIdSchema,
        response: {
          200: displayBookingSchema
        }
      }
    },
    getBookingHandler
  )

  server.post(
    "/",
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ["holidaze-bookings"],
        security: [{ bearerAuth: [] }],
        querystring: queryFlagsSchema,
        body: createBookingSchema.omit({ customerName: true }),
        response: {
          201: displayBookingSchema
        }
      }
    },
    createBookingHandler
  )

  server.put(
    "/:id",
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ["holidaze-bookings"],
        security: [{ bearerAuth: [] }],
        querystring: queryFlagsSchema,
        params: bookingIdSchema,
        body: updateBookingSchema,
        response: {
          200: displayBookingSchema
        }
      }
    },
    updateBookingHandler
  )

  server.delete(
    "/:id",
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ["holidaze-bookings"],
        security: [{ bearerAuth: [] }],
        params: bookingIdSchema
      }
    },
    deleteBookingHandler
  )
}

export default bookingsRoutes