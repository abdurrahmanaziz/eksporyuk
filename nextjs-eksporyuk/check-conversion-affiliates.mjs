import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking AffiliateConversion data...\n')

  // Count total AffiliateConversion records
  const total = await prisma.affiliateConversion.count()
  console.log(`📊 Total AffiliateConversion records: ${total}`)

  if (total > 0) {
    // Get unique affiliate IDs
    const uniqueAffiliates = await prisma.$queryRaw`
      SELECT 
        "affiliateId",
        COUNT(*) as conversions,
        SUM("commissionAmount") as earnings
      FROM "AffiliateConversion"
      GROUP BY "affiliateId"
      ORDER BY conversions DESC
      LIMIT 10
    `
    
    console.log(`\n📋 Top 10 Affiliates by conversions:`)
    console.log(uniqueAffiliates)

    // Count unique affiliates
    const uniqueCount = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "affiliateId") as count
      FROM "AffiliateConversion"
    `
    console.log(`\n🎯 Unique affiliate IDs: ${uniqueCount[0].count}`)

    // Check if these are User IDs
    const affiliateIds = uniqueAffiliates.map(a => a.affiliateId)
    const users = await prisma.user.findMany({
      where: { id: { in: affiliateIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`\n👥 Corresponding User records: ${users.length}`)
    users.slice(0, 5).forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`)
    })

    // Count users with AFFILIATE role
    const affiliateRoleCount = await prisma.user.count({
      where: { 
        role: 'AFFILIATE',
        id: { in: affiliateIds }
      }
    })
    console.log(`\n✅ Users with role='AFFILIATE' from these IDs: ${affiliateRoleCount}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
