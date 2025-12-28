import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Syncing User role to AFFILIATE for users with AffiliateConversion...\n')

  // Get all unique affiliate IDs from AffiliateConversion
  const uniqueAffiliates = await prisma.$queryRaw`
    SELECT DISTINCT "affiliateId"
    FROM "AffiliateConversion"
  `

  const affiliateIds = uniqueAffiliates.map(a => a.affiliateId)
  console.log(`📊 Found ${affiliateIds.length} unique affiliate IDs`)

  // Check current roles
  const users = await prisma.user.findMany({
    where: { id: { in: affiliateIds } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  console.log(`\n👥 Current user roles:`)
  const roleCount = {}
  users.forEach(u => {
    roleCount[u.role] = (roleCount[u.role] || 0) + 1
  })
  console.log(roleCount)

  // Update all to AFFILIATE role
  console.log(`\n🔧 Updating ${affiliateIds.length} users to AFFILIATE role...`)
  
  const result = await prisma.user.updateMany({
    where: { id: { in: affiliateIds } },
    data: { 
      role: 'AFFILIATE',
      affiliateMenuEnabled: true // Enable affiliate menu access
    }
  })

  console.log(`✅ Updated ${result.count} users to AFFILIATE role`)

  // Verify update
  const verifyCount = await prisma.user.count({
    where: { 
      id: { in: affiliateIds },
      role: 'AFFILIATE' 
    }
  })

  console.log(`\n✨ Verification: ${verifyCount} users now have AFFILIATE role`)

  // Show sample
  const samples = await prisma.user.findMany({
    where: { 
      id: { in: affiliateIds },
      role: 'AFFILIATE' 
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      affiliateMenuEnabled: true
    },
    take: 5
  })

  console.log(`\n📋 Sample updated users:`)
  samples.forEach(u => {
    console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}, Menu: ${u.affiliateMenuEnabled}`)
  })

  await prisma.$disconnect()
}

main().catch(console.error)
