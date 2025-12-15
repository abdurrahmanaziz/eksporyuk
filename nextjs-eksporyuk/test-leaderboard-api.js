const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testLeaderboardData() {
  console.log('🧪 Testing Leaderboard Data...\n')
  
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // All-Time
    const allTime = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10
    })
    
    // Weekly
    const weekly = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: { createdAt: { gte: weekAgo } },
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10
    })
    
    // Monthly
    const monthly = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: { createdAt: { gte: monthAgo } },
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10
    })
    
    console.log('📊 ALL-TIME TOP 3:')
    for (let i = 0; i < 3 && i < allTime.length; i++) {
      const aff = await prisma.affiliateProfile.findFirst({
        where: { id: allTime[i].affiliateId },
        include: { user: true }
      })
      console.log(`  ${i+1}. ${aff?.user?.name || 'Unknown'} - Rp ${allTime[i]._sum.commissionAmount?.toLocaleString()} (${allTime[i]._count.id} conversions)`)
    }
    
    console.log('\n📅 WEEKLY TOP 3:')
    for (let i = 0; i < 3 && i < weekly.length; i++) {
      const aff = await prisma.affiliateProfile.findFirst({
        where: { id: weekly[i].affiliateId },
        include: { user: true }
      })
      console.log(`  ${i+1}. ${aff?.user?.name || 'Unknown'} - Rp ${weekly[i]._sum.commissionAmount?.toLocaleString()} (${weekly[i]._count.id} conversions)`)
    }
    
    console.log('\n📆 MONTHLY TOP 3:')
    for (let i = 0; i < 3 && i < monthly.length; i++) {
      const aff = await prisma.affiliateProfile.findFirst({
        where: { id: monthly[i].affiliateId },
        include: { user: true }
      })
      console.log(`  ${i+1}. ${aff?.user?.name || 'Unknown'} - Rp ${monthly[i]._sum.commissionAmount?.toLocaleString()} (${monthly[i]._count.id} conversions)`)
    }
    
    console.log('\n✅ Test Complete!')
    console.log(`\nTotal conversions: All-Time=${allTime.reduce((sum, a) => sum + a._count.id, 0)}, Weekly=${weekly.reduce((sum, a) => sum + a._count.id, 0)}, Monthly=${monthly.reduce((sum, a) => sum + a._count.id, 0)}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLeaderboardData()
