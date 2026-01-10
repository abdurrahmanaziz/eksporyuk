import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Affiliate data...\n')
  
  // Check AffiliateProfile table
  const affiliateProfiles = await prisma.affiliateProfile.count()
  console.log(`📊 Total AffiliateProfile records: ${affiliateProfiles}`)
  
  // Get sample affiliate profiles with user info
  const sampleAffiliates = await prisma.affiliateProfile.findMany({
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  })
  
  console.log('\n📋 Sample Affiliates:')
  sampleAffiliates.forEach(a => {
    console.log(`- ${a.user.email} | Role: ${a.user.role} | Status: ${a.status}`)
  })
  
  // Count users with AFFILIATE role
  const usersWithAffiliateRole = await prisma.user.count({
    where: { role: 'AFFILIATE' }
  })
  console.log(`\n👥 Users with role='AFFILIATE': ${usersWithAffiliateRole}`)
  
  // Count users who have AffiliateProfile
  const usersWithAffiliateProfile = await prisma.user.count({
    where: {
      affiliateProfile: {
        isNot: null
      }
    }
  })
  console.log(`👥 Users with AffiliateProfile: ${usersWithAffiliateProfile}`)
  
  // Check what roles these affiliate users have
  console.log('\n📊 Role distribution of users with AffiliateProfile:')
  const affiliateUsers = await prisma.user.findMany({
    where: {
      affiliateProfile: {
        isNot: null
      }
    },
    select: {
      role: true
    }
  })
  
  const roleCount = {}
  affiliateUsers.forEach(u => {
    roleCount[u.role] = (roleCount[u.role] || 0) + 1
  })
  
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
