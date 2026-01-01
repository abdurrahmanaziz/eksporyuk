const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Update to mentor
  const updated = await prisma.user.update({
    where: { email: 'azizbiasa@gmail.com' },
    data: { preferredDashboard: 'mentor' },
    select: { id: true, preferredDashboard: true }
  })
  
  console.log('Updated:', updated)
  
  await prisma.$disconnect()
}

test()
