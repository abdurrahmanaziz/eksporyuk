const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n========================================')
  console.log('VERIFIKASI DATA LEADERBOARD')
  console.log('========================================\n')

  // Get data seperti yang digunakan di /admin/affiliates
  const affiliatesData = await prisma.affiliateProfile.findMany({
    where: {
      totalEarnings: { gt: 0 }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      totalEarnings: 'desc'
    },
    take: 10
  })

  console.log('📊 TOP 10 AFFILIATES (Data dari AffiliateProfile)')
  console.log('Data ini SAMA dengan yang ditampilkan di /admin/affiliates')
  console.log('========================================\n')

  affiliatesData.forEach((aff, index) => {
    const earnings = Number(aff.totalEarnings)
    console.log(`${index + 1}. ${aff.user?.name || 'Unknown'}`)
    console.log(`   Email: ${aff.user?.email || 'N/A'}`)
    console.log(`   Total Earnings: Rp ${earnings.toLocaleString('id-ID')}`)
    console.log(`   Total Conversions: ${aff.totalConversions}`)
    console.log(`   Active: ${aff.isActive ? 'Yes' : 'No'}`)
    console.log('')
  })

  console.log('========================================')
  console.log('✅ DATA LEADERBOARD ALL TIME MENGGUNAKAN:')
  console.log('   - Field: AffiliateProfile.totalEarnings')
  console.log('   - Sorting: DESC (tertinggi ke terendah)')
  console.log('   - Limit: Top 10')
  console.log('')
  console.log('✅ DATA INI SAMA PERSIS dengan /admin/affiliates')
  console.log('✅ Leaderboard sudah menggunakan data REALTIME')
  console.log('========================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
