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
  const weekStart = getWeekStart()
  const now = new Date()
  
  console.log('\n========================================')
  console.log('CEK DATA KONVERSI MINGGU INI')
  console.log('========================================')
  console.log('Tanggal sekarang (WIB):', now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))
  console.log('Awal minggu (Senin 00:00):', weekStart.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))
  console.log('========================================\n')

  // Cek total konversi minggu ini
  const weeklyCount = await prisma.affiliateConversion.count({
    where: {
      createdAt: { gte: weekStart }
    }
  })

  console.log(`Total konversi minggu ini: ${weeklyCount} transaksi\n`)

  if (weeklyCount === 0) {
    console.log('❌ TIDAK ADA DATA konversi minggu ini!')
    console.log('⚠️  Leaderboard mingguan akan KOSONG atau menampilkan data lama\n')
  } else {
    console.log('✅ Ada data konversi minggu ini\n')
    
    // Tampilkan top 10 affiliate minggu ini
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

    console.log('TOP 10 AFFILIATE MINGGU INI:')
    console.log('========================================')
    
    for (let i = 0; i < weeklyConversions.length; i++) {
      const conv = weeklyConversions[i]
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { id: conv.affiliateId },
        include: { user: { select: { name: true } } }
      })
      
      const earnings = conv._sum.commissionAmount || 0
      const count = conv._count.id
      
      console.log(`${i + 1}. ${affiliate?.user?.name || 'Unknown'} - Rp ${earnings.toLocaleString('id-ID')} (${count} konversi)`)
    }
  }

  // Cek konversi terbaru
  console.log('\n========================================')
  console.log('5 KONVERSI TERAKHIR (semua waktu):')
  console.log('========================================')
  
  const recentConversions = await prisma.affiliateConversion.findMany({
    include: {
      affiliate: {
        include: {
          user: { select: { name: true } }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  recentConversions.forEach((conv, i) => {
    console.log(`${i + 1}. ${conv.affiliate?.user?.name || 'Unknown'} - Rp ${conv.commissionAmount?.toLocaleString('id-ID') || 0} - ${conv.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`)
  })

  console.log('\n========================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
