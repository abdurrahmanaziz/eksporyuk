const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmail(email) {
  if (!email) {
    console.log('Usage: node check-email-exists.js <email>')
    console.log('Example: node check-email-exists.js test@gmail.com')
    return
  }
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      createdAt: true
    }
  })
  
  if (user) {
    console.log('✅ User EXISTS in database:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Has Password:', !!user.password)
    console.log('  Created:', user.createdAt)
  } else {
    console.log('❌ User does NOT exist for:', email)
  }
  
  await prisma.$disconnect()
}

checkEmail(process.argv[2])
