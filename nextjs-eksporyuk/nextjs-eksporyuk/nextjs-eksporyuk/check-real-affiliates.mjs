import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Affiliate data...\n')

  // Count AffiliateProfile
  const totalAffiliates = await prisma.affiliateProfile.count()
  console.log(`📊 Total AffiliateProfile records: ${totalAffiliates}`)

  if (totalAffiliates > 0) {
    // Get sample profiles
    const profiles = await prisma.affiliateProfile.findMany({
      take: 5,
      select: {
        id: true,
        userId: true,
        affiliateCode: true,
        applicationStatus: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('\n📋 Sample AffiliateProfile records:')
    profiles.forEach(p => {
      console.log(`  - ID: ${p.id}, UserId: ${p.userId}, Code: ${p.affiliateCode}, Status: ${p.applicationStatus}, Active: ${p.isActive}`)
    })

    // Check if those userIds exist in User table
    const userIds = profiles.map(p => p.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log('\n👥 Corresponding User records:')
    users.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`)
    })

    // Count users with AFFILIATE role
    const affiliateRoleCount = await prisma.user.count({
      where: { role: 'AFFILIATE' }
    })
    console.log(`\n🎯 Users with role='AFFILIATE': ${affiliateRoleCount}`)

    // Count approved affiliates
    const approvedCount = await prisma.affiliateProfile.count({
      where: { applicationStatus: 'APPROVED' }
    })
    console.log(`✅ Approved AffiliateProfiles: ${approvedCount}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
