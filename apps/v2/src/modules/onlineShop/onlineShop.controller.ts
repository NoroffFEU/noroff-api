import { FastifyRequest } from "fastify"
import { OnlineShopProduct } from "@prisma/v2-client"
import { NotFound, BadRequest } from "http-errors"
import { onlineShopParamsSchema } from "./onlineShop.schema"
import { sortAndPaginationSchema } from "@noroff/api-utils"

import { getOnlineShopProducts, getOnlineShopProduct } from "./onlineShop.service"

export async function getOnlineShopProductsHandler(
  request: FastifyRequest<{
    Querystring: {
      limit?: number
      page?: number
      sort?: keyof OnlineShopProduct
      sortOrder?: "asc" | "desc"
    }
  }>
) {
  try {
    await sortAndPaginationSchema.parseAsync(request.query)
    const { sort, sortOrder, limit, page } = request.query

    if (limit && limit > 100) {
      throw new BadRequest("Limit cannot be greater than 100")
    }

    const products = await getOnlineShopProducts(sort, sortOrder, limit, page)

    if (!products.data.length) {
      throw new NotFound("Couldn't find any products.")
    }

    return products
  } catch (error) {
    throw error
  }
}

export async function getOnlineShopProductHandler(
  request: FastifyRequest<{
    Params: { id: string }
  }>
) {
  try {
    const params = onlineShopParamsSchema.parse(request.params)
    const { id } = params

    const product = await getOnlineShopProduct(id)

    if (!product.data) {
      throw new NotFound("No product with such ID")
    }

    return product
  } catch (error) {
    throw error
  }
}
