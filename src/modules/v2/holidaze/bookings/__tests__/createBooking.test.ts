import { server, getAuthCredentials } from "@/test-utils"
import { db } from "@/utils"

const VENUE_ID = "36a89378-83fa-4f3f-a777-ad15edbd1d40"
let BEARER_TOKEN = ""
let API_KEY = ""
let BOOKING_USER = ""

const createData = {
  dateFrom: new Date(),
  dateTo: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  guests: 2,
  venueId: VENUE_ID,
  customerName: BOOKING_USER
}

beforeEach(async () => {
  const { bearerToken, apiKey, name } = await getAuthCredentials()

  BEARER_TOKEN = bearerToken
  API_KEY = apiKey
  BOOKING_USER = name

  await db.holidazeVenue.create({
    data: {
      id: VENUE_ID,
      name: "Nice hotel",
      description: "A nice hotel",
      price: 100,
      maxGuests: 2,
      meta: { create: {} },
      location: { create: {} },
      owner: { connect: { name } }
    }
  })
})

afterEach(async () => {
  const users = db.userProfile.deleteMany()
  const bookings = db.holidazeBooking.deleteMany()
  const venueMeta = db.holidazeVenueMeta.deleteMany()
  const venueLocation = db.holidazeVenueLocation.deleteMany()
  const venues = db.holidazeVenue.deleteMany()

  await db.$transaction([users, bookings, venueMeta, venueLocation, venues])
  await db.$disconnect()
})

describe("[POST] /v2/holidaze/bookings", () => {
  it("should return 201 when successfully created a booking", async () => {
    const response = await server.inject({
      url: "/api/v2/holidaze/bookings",
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "X-Noroff-API-Key": API_KEY
      },
      payload: {
        ...createData
      }
    })
    const res = await response.json()

    expect(response.statusCode).toEqual(201)
    expect(res.data).toStrictEqual({
      id: expect.any(String),
      dateFrom: expect.any(String),
      dateTo: expect.any(String),
      guests: 2,
      created: expect.any(String),
      updated: expect.any(String)
    })
    expect(res.meta).toBeDefined()
    expect(res.meta).toStrictEqual({})
  })

  it("should throw zod errors if data is invalid", async () => {
    const response = await server.inject({
      url: "/api/v2/holidaze/bookings",
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "X-Noroff-API-Key": API_KEY
      },
      payload: {
        guests: ["guest 1", "guest 2"],
        dateTo: "not a valid date"
      }
    })
    const res = await response.json()

    expect(response.statusCode).toEqual(400)
    expect(res.data).not.toBeDefined()
    expect(res.meta).not.toBeDefined()
    expect(res.errors).toStrictEqual([
      {
        code: "invalid_type",
        message: "dateFrom is required",
        path: ["dateFrom"]
      },
      {
        code: "invalid_date",
        message: "Invalid date",
        path: ["dateTo"]
      },
      {
        code: "invalid_type",
        message: "Guests must be a number",
        path: ["guests"]
      },
      {
        code: "invalid_type",
        message: "venueId is required",
        path: ["venueId"]
      }
    ])
  })

  it("should throw 401 error when attempting to create without API key", async () => {
    const response = await server.inject({
      url: "/api/v2/holidaze/bookings",
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`
      },
      payload: {
        ...createData
      }
    })
    const res = await response.json()

    expect(response.statusCode).toBe(401)
    expect(res.data).not.toBeDefined()
    expect(res.meta).not.toBeDefined()
    expect(res.errors).toBeDefined()
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toStrictEqual({
      message: "No API key header was found"
    })
  })

  it("should throw 401 error when attempting to create without Bearer token", async () => {
    const response = await server.inject({
      url: "/api/v2/holidaze/bookings",
      method: "POST",
      headers: {
        "X-Noroff-API-Key": API_KEY
      },
      payload: {
        ...createData
      }
    })
    const res = await response.json()

    expect(response.statusCode).toBe(401)
    expect(res.data).not.toBeDefined()
    expect(res.meta).not.toBeDefined()
    expect(res.errors).toBeDefined()
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toStrictEqual({
      message: "No authorization header was found"
    })
  })
})