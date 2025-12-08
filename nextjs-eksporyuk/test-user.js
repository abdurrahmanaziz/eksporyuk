const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUser() {
  try {
    const userId = 'cmifs2pat0004umbcdj2qvfne'
    console.log(`Testing user ID: ${userId}`)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true
      }
    })
    
    if (user) {
      console.log('✅ User found:', JSON.stringify(user, null, 2))
    } else {
      console.log('❌ User NOT found in database')
      
      // List first 5 users
      const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, name: true, email: true }
      })
      console.log('\nFirst 5 users in database:')
      users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} (${u.email}) - ID: ${u.id}`)
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testUser()
