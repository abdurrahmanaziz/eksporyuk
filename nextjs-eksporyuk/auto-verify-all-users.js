/**
 * Auto-verify all existing users
 * Use this for migration - mark all existing users as verified
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function autoVerifyAllUsers() {
  console.log('🔄 AUTO-VERIFYING ALL EXISTING USERS\n')
  
  try {
    // Update all users with emailVerified = false to true
    const result = await prisma.user.updateMany({
      where: {
        emailVerified: false
      },
      data: {
        emailVerified: true
      }
    })
    
    console.log(`✅ Successfully verified ${result.count} user(s)`)
    
    // Show summary
    const totalUsers = await prisma.user.count()
    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true }
    })
    
    console.log('\n📊 Summary:')
    console.log(`   Total users: ${totalUsers}`)
    console.log(`   Verified: ${verifiedUsers}`)
    console.log(`   Unverified: ${totalUsers - verifiedUsers}`)
    
    if (totalUsers === verifiedUsers) {
      console.log('\n🎉 All users are now verified!')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

autoVerifyAllUsers()
