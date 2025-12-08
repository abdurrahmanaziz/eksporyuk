const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true }
  })
  console.log('All Memberships:')
  console.log(JSON.stringify(memberships, null, 2))
  await prisma.$disconnect()
}

test()
