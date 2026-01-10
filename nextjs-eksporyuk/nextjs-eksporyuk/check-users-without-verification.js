const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  console.log('🔍 CHECKING USERS WITHOUT EMAIL VERIFICATION\n')
  
  // Check users where emailVerified is false (not null, Prisma doesn't like null)
  const unverifiedUsers = await prisma.user.findMany({
    where: {
      emailVerified: false
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  console.log(`Found ${unverifiedUsers.length} users with unverified email\n`)
  
  if (unverifiedUsers.length > 0) {
    console.log('📋 Users needing verification:')
    unverifiedUsers.forEach((user, i) => {
      console.log(`\n${i+1}. ${user.name || 'No name'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Verified: ${user.emailVerified}`)
      console.log(`   Created: ${user.createdAt.toLocaleDateString('id-ID')}`)
    })
    
    console.log('\n\n💡 To auto-verify all existing users, run:')
    console.log('   node auto-verify-all-users.js')
  } else {
    console.log('✅ All users have verified emails!')
  }
  
  await prisma.$disconnect()
}

checkUsers()
