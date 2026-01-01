const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'azizbiasa@gmail.com' },
    select: {
      id: true,
      email: true,
      role: true,
      preferredDashboard: true
    }
  })
  
  console.log('User data:', user)
  
  await prisma.$disconnect()
}

check()
