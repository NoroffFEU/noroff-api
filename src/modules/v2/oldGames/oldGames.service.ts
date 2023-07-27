import { prisma, getRandomNumber } from "@/utils"

export async function getOldGames() {
  const [data, meta] = await prisma.oldGame.paginate().withPages()

  return { data, meta }
}

export async function getOldGame(id: number) {
  const [data, meta] = await prisma.oldGame
    .paginate({
      where: { id }
    })
    .withPages({
      limit: 1
    })

  return { data: data[0], meta }
}

export async function getRandomOldGame() {
  const resultLength = await prisma.oldGame.count()
  const id = getRandomNumber(1, resultLength)

  const [data, meta] = await prisma.oldGame
    .paginate({
      where: { id }
    })
    .withPages({
      limit: 1
    })

  return { data: data[0], meta }
}
