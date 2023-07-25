import { test } from "tap"
import buildServer from "../../../server"

test("Books endpoints", async t => {
  const server = buildServer()

  t.teardown(() => {
    server.close()
  })

  t.test("GET /api/v2/books", async t => {
    const res = await server.inject({
      method: "GET",
      url: "/api/v2/books"
    })

    t.equal(res.statusCode, 200, "returns status code of 200")
    t.equal(res.headers["content-type"], "application/json; charset=utf-8", "returns application/json content-type")
  })
})
