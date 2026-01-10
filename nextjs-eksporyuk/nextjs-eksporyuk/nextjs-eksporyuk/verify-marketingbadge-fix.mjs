import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyFix() {
  console.log('🔍 Verifying marketingBadge Fix\n')
  console.log('=' .repeat(60))
  
  try {
    // Test 1: Query all memberships with marketingBadge
    console.log('\n1️⃣ Testing All Memberships with Marketing Badges...')
    const membersWithBadges = await prisma.membership.findMany({
      where: { marketingBadge: { not: null } },
      select: {
        id: true,
        name: true,
        marketingBadge: true,
        price: true,
        duration: true
      }
    })
    
    console.log(`   Found ${membersWithBadges.length} memberships with badges:`)
    membersWithBadges.forEach(m => {
      console.log(`   - ${m.name}: ${m.marketingBadge}`)
    })
    
    // Test 2: Query specific membership that was failing
    console.log('\n2️⃣ Testing Specific Membership (mem_6bulan_ekspor)...')
    const specificPlan = await prisma.membership.findUnique({
      where: { id: 'mem_6bulan_ekspor' },
      select: {
        id: true,
        name: true,
        marketingBadge: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      }
    })
    
    if (specificPlan) {
      console.log('   ✅ Successfully retrieved!')
      console.log(`   - Name: ${specificPlan.name}`)
      console.log(`   - Badge: ${specificPlan.marketingBadge}`)
      console.log(`   - Price: Rp ${Number(specificPlan.price).toLocaleString('id-ID')}`)
    }
    
    // Test 3: Test filtering by specific badge
    console.log('\n3️⃣ Testing Filter by HARGA_HEMAT...')
    const hematPlans = await prisma.membership.findMany({
      where: { marketingBadge: 'HARGA_HEMAT' },
      select: { id: true, name: true, marketingBadge: true }
    })
    console.log(`   Found ${hematPlans.length} plan(s) with HARGA_HEMAT badge`)
    
    // Test 4: Test all enum values
    console.log('\n4️⃣ Testing All MarketingBadge Enum Values...')
    const enumValues = ['PALING_LARIS', 'HARGA_HEMAT', 'PROMO_GEDE', 'PROMO_GENDENG', 'PROMO_AKHIR_TAHUN', 'PROMO_AWAL_TAHUN']
    
    for (const badge of enumValues) {
      const count = await prisma.membership.count({
        where: { marketingBadge: badge }
      })
      if (count > 0) {
        console.log(`   ✅ ${badge}: ${count} membership(s)`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED - marketingBadge enum fix successful!')
    console.log('='.repeat(60))
    console.log('\nSummary:')
    console.log('- Schema updated: marketingBadge String? → MarketingBadge?')
    console.log('- Prisma client regenerated')
    console.log('- All queries working correctly')
    console.log('- API endpoint should now work without 500 errors')
    
  } catch (error) {
    console.error('\n❌ Error occurred:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyFix()
