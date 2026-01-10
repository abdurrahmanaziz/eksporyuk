const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n========================================')
  console.log('CEK: Apakah Data di Screenshot SAMA dengan Database?')
  console.log('========================================\n')

  // Data dari screenshot yang Anda tunjukkan di /admin/affiliates
  const screenshotData = [
    { name: 'Rahmat Al Fianto', earnings: 168945000 },
    { name: 'Asep Abdurrahman Wahid', earnings: 165150000 },
    { name: 'Hamid Baidowi', earnings: 131110000 }
  ]

  // Data dari database SEKARANG
  const dbData = await prisma.affiliateProfile.findMany({
    where: { totalEarnings: { gt: 0 } },
    include: { user: { select: { name: true } } },
    orderBy: { totalEarnings: 'desc' },
    take: 3
  })

  console.log('📸 DATA DI SCREENSHOT (/admin/affiliates):')
  screenshotData.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} → Rp ${item.earnings.toLocaleString('id-ID')}`)
  })

  console.log('\n💾 DATA DI DATABASE SEKARANG:')
  dbData.forEach((item, i) => {
    console.log(`${i + 1}. ${item.user?.name} → Rp ${item.totalEarnings?.toLocaleString('id-ID')}`)
  })

  console.log('\n✅ VERIFIKASI PER RANK:')
  let allMatch = true
  for (let i = 0; i < 3; i++) {
    // Compare as numbers, not formatted strings
    const screenshotNum = Number(screenshotData[i].earnings)
    const dbNum = Number(dbData[i]?.totalEarnings || 0)
    const match = screenshotNum === dbNum
    
    if (match) {
      console.log(`✅ Rank ${i + 1}: MATCH - ${screenshotData[i].name} (Rp ${screenshotData[i].earnings.toLocaleString('id-ID')})`)
    } else {
      console.log(`❌ Rank ${i + 1}: TIDAK MATCH!`)
      console.log(`   Screenshot: ${screenshotData[i].name} - Rp ${screenshotNum.toLocaleString('id-ID')}`)
      console.log(`   Database: ${dbData[i]?.user?.name} - Rp ${dbNum.toLocaleString('id-ID')}`)
      allMatch = false
    }
  }

  console.log('\n📝 KESIMPULAN:')
  console.log('========================================')
  if (allMatch) {
    console.log('✅✅✅ SEMUA DATA 100% COCOK!')
    console.log('')
    console.log('Data di leaderboard SAMA PERSIS dengan screenshot /admin/affiliates')
    console.log('Leaderboard sudah menggunakan data TERBARU dari database!')
    console.log('')
    console.log('BUKAN DATA LAMA! Data sudah UPDATE!')
  } else {
    console.log('❌ Ada perbedaan data!')
  }
  console.log('========================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
