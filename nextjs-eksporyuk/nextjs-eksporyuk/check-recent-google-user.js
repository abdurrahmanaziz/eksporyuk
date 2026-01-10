const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRecentGoogleUsers() {
  try {
    // Check users created in last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    const recentGoogleUsers = await prisma.user.findMany({
      where: {
        password: null,
        createdAt: {
          gte: twoHoursAgo
        }
      },
      select: {
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`🔍 Google users created in last 2 hours: ${recentGoogleUsers.length}\n`)
    
    recentGoogleUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
      console.log(`   Updated: ${user.updatedAt ? user.updatedAt.toISOString() : 'NULL ❌'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentGoogleUsers()
