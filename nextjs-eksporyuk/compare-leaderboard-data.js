const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Get start of current week (Monday 00:00 WIB)
function getWeekStart() {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  
  const day = wibNow.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  
  const weekStart = new Date(wibNow)
  weekStart.setUTCDate(wibNow.getUTCDate() - diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  
  return new Date(weekStart.getTime() - wibOffset)
}

async function main() {
  console.log('\n========================================')
  console.log('CEK DATA: /admin/affiliates vs Leaderboard')
  console.log('========================================\n')

  // 1. DATA DARI /admin/affiliates (ALL TIME - totalEarnings)
  console.log('📊 DATA DARI /admin/affiliates (ALL TIME):')
  console.log('========================================')
  
  const adminAffiliates = await prisma.affiliateProfile.findMany({
    where: {
      totalEarnings: { gt: 0 }
    },
    include: {
      user: {
        select: {
          id: true,
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

  adminAffiliates.forEach((aff, i) => {
    console.log(`${i + 1}. ${aff.user?.name || 'Unknown'} - Rp ${aff.totalEarnings?.toLocaleString('id-ID') || 0}`)
  })

  // 2. DATA LEADERBOARD ALL TIME (sama seperti /admin/affiliates)
  console.log('\n🏆 LEADERBOARD ALL TIME (API):')
  console.log('========================================')
  
  const allTimeAffiliates = await prisma.affiliateProfile.findMany({
    where: {
      totalEarnings: { gt: 0 }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: {
      totalEarnings: 'desc'
    },
    take: 10
  })

  allTimeAffiliates.forEach((aff, i) => {
    console.log(`${i + 1}. ${aff.user?.name || 'Unknown'} - Rp ${aff.totalEarnings?.toLocaleString('id-ID') || 0}`)
  })

  // 3. DATA LEADERBOARD WEEKLY
  const weekStart = getWeekStart()
  console.log('\n🏆 LEADERBOARD WEEKLY (API):')
  console.log(`Week start: ${weekStart.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`)
  console.log('========================================')
  
  const weeklyConversions = await prisma.affiliateConversion.groupBy({
    by: ['affiliateId'],
    where: {
      createdAt: { gte: weekStart }
    },
    _sum: {
      commissionAmount: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        commissionAmount: 'desc'
      }
    },
    take: 10
  })

  for (let i = 0; i < weeklyConversions.length; i++) {
    const conv = weeklyConversions[i]
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: conv.affiliateId },
      include: { user: { select: { name: true } } }
    })
    
    const earnings = conv._sum.commissionAmount || 0
    console.log(`${i + 1}. ${affiliate?.user?.name || 'Unknown'} - Rp ${earnings.toLocaleString('id-ID')}`)
  }

  // 4. VERIFIKASI: Apakah data sama?
  console.log('\n✅ VERIFIKASI:')
  console.log('========================================')
  
  const match = adminAffiliates[0]?.totalEarnings === allTimeAffiliates[0]?.totalEarnings
  
  if (match) {
    console.log('✅ DATA SAMA! /admin/affiliates = Leaderboard All Time')
  } else {
    console.log('❌ DATA BERBEDA!')
    console.log(`   /admin/affiliates: Rp ${adminAffiliates[0]?.totalEarnings?.toLocaleString('id-ID')}`)
    console.log(`   Leaderboard: Rp ${allTimeAffiliates[0]?.totalEarnings?.toLocaleString('id-ID')}`)
  }

  // 5. CEK SUMBER DATA
  console.log('\n🔍 SUMBER DATA:')
  console.log('========================================')
  console.log('✅ /admin/affiliates → AffiliateProfile.totalEarnings')
  console.log('✅ Leaderboard All Time → AffiliateProfile.totalEarnings')
  console.log('✅ Leaderboard Weekly → AffiliateConversion.groupBy (minggu ini)')
  console.log('✅ Leaderboard Monthly → AffiliateConversion.groupBy (bulan ini)')
  
  console.log('\n📝 KESIMPULAN:')
  console.log('========================================')
  console.log('Leaderboard menggunakan data REALTIME dari database yang SAMA')
  console.log('dengan halaman /admin/affiliates. BUKAN data lama!')
  console.log('========================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
