const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'admin-001' }
    })
    
    console.log('User admin-001:', user ? 'EXISTS' : 'NOT FOUND')
    if (user) {
      console.log('User details:', JSON.stringify(user, null, 2))
    }
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    console.log('\nAll users in database:', allUsers.length)
    allUsers.forEach(u => console.log(`- ${u.id}: ${u.email} (${u.name})`))
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
