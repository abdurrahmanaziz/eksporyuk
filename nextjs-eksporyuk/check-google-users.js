const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGoogleUsers() {
  try {
    console.log('🔍 Checking for users without password (Google OAuth users)...\n')
    
    const googleUsers = await prisma.user.findMany({
      where: {
        password: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        emailVerified: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${googleUsers.length} users without password (likely Google OAuth):`)
    googleUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Username: ${user.username}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Avatar: ${user.avatar ? '✅ Has avatar' : '❌ No avatar'}`)
      console.log(`   Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`)
      console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`)
      console.log(`   Suspended: ${user.isSuspended ? '⚠️ YES' : '✅ No'}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
    })
    
    console.log('\n📊 Checking all users...\n')
    const allUsers = await prisma.user.count()
    const withPassword = await prisma.user.count({ where: { password: { not: null } } })
    const withoutPassword = await prisma.user.count({ where: { password: null } })
    
    console.log(`Total users: ${allUsers}`)
    console.log(`With password (credentials): ${withPassword}`)
    console.log(`Without password (OAuth): ${withoutPassword}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGoogleUsers()
