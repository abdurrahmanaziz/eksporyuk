const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyLeaderboardConsistency() {
  console.log('🧪 VERIFYING LEADERBOARD DATA CONSISTENCY\n')
  
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Simulate getLeaderboardForPeriod function from API
    async function getLeaderboardForPeriod(startDate) {
      const whereClause = startDate ? { createdAt: { gte: startDate } } : {}
      
      const conversions = await prisma.affiliateConversion.findMany({
        where: whereClause,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      })
      
      // Aggregate by affiliate
      const aggregateMap = new Map()
      
      for (const conv of conversions) {
        if (!conv.affiliate) continue
        
        const existing = aggregateMap.get(conv.affiliateId)
        const commission = Number(conv.commissionAmount)
        
        if (existing) {
          existing.totalCommission += commission
          existing.conversions += 1
        } else {
          aggregateMap.set(conv.affiliateId, {
            affiliateId: conv.affiliateId,
            userId: conv.affiliate.userId,
            name: conv.affiliate.user?.name || 'Unknown',
            avatar: conv.affiliate.user?.avatar || null,
            totalCommission: commission,
            conversions: 1
          })
        }
      }
      
      // Sort and return top 10
      const sorted = Array.from(aggregateMap.values())
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .slice(0, 10)
        .map((item, index) => ({
          rank: index + 1,
          userId: item.userId,
          affiliateId: item.affiliateId,
          name: item.name,
          avatar: item.avatar,
          points: item.totalCommission,
          conversions: item.conversions
        }))
      
      return sorted
    }
    
    // Get all 3 periods
    console.log('📊 Fetching leaderboards...\n')
    const allTime = await getLeaderboardForPeriod()
    const weekly = await getLeaderboardForPeriod(weekAgo)
    const monthly = await getLeaderboardForPeriod(monthAgo)
    
    // Display results
    console.log('🏆 ALL-TIME LEADERBOARD (Top 5):')
    allTime.slice(0, 5).forEach(aff => {
      console.log(`  ${aff.rank}. ${aff.name}`)
      console.log(`     Commission: Rp ${aff.points.toLocaleString('id-ID')}`)
      console.log(`     Conversions: ${aff.conversions}`)
      console.log()
    })
    
    console.log('📅 WEEKLY LEADERBOARD (Last 7 Days):')
    if (weekly.length === 0) {
      console.log('  No conversions in the last 7 days\n')
    } else {
      weekly.slice(0, 5).forEach(aff => {
        console.log(`  ${aff.rank}. ${aff.name}`)
        console.log(`     Commission: Rp ${aff.points.toLocaleString('id-ID')}`)
        console.log(`     Conversions: ${aff.conversions}`)
        console.log()
      })
    }
    
    console.log('📆 MONTHLY LEADERBOARD (Last 30 Days):')
    if (monthly.length === 0) {
      console.log('  No conversions in the last 30 days\n')
    } else {
      monthly.slice(0, 5).forEach(aff => {
        console.log(`  ${aff.rank}. ${aff.name}`)
        console.log(`     Commission: Rp ${aff.points.toLocaleString('id-ID')}`)
        console.log(`     Conversions: ${aff.conversions}`)
        console.log()
      })
    }
    
    // Verify data consistency
    console.log('✅ DATA CONSISTENCY CHECK:')
    
    const allTimeTotal = allTime.reduce((sum, a) => sum + a.points, 0)
    const weeklyTotal = weekly.reduce((sum, a) => sum + a.points, 0)
    const monthlyTotal = monthly.reduce((sum, a) => sum + a.points, 0)
    
    const allTimeConv = allTime.reduce((sum, a) => sum + a.conversions, 0)
    const weeklyConv = weekly.reduce((sum, a) => sum + a.conversions, 0)
    const monthlyConv = monthly.reduce((sum, a) => sum + a.conversions, 0)
    
    console.log(`  All-Time Top 10: Rp ${allTimeTotal.toLocaleString('id-ID')} (${allTimeConv} conversions)`)
    console.log(`  Weekly Top 10: Rp ${weeklyTotal.toLocaleString('id-ID')} (${weeklyConv} conversions)`)
    console.log(`  Monthly Top 10: Rp ${monthlyTotal.toLocaleString('id-ID')} (${monthlyConv} conversions)`)
    
    // Check if periods have different data
    const allTimeName1 = allTime[0]?.name
    const weeklyName1 = weekly[0]?.name
    const monthlyName1 = monthly[0]?.name
    
    console.log('\n🔍 PERIOD DIFFERENTIATION:')
    console.log(`  All-Time #1: ${allTimeName1}`)
    console.log(`  Weekly #1: ${weeklyName1 || 'N/A'}`)
    console.log(`  Monthly #1: ${monthlyName1 || 'N/A'}`)
    
    if (allTimeName1 !== weeklyName1 || allTimeName1 !== monthlyName1) {
      console.log('  ✅ Leaders differ by period (CORRECT!)')
    } else if (weekly.length === 0 || monthly.length === 0) {
      console.log('  ⚠️  No recent conversions to differentiate')
    } else {
      console.log('  ⚠️  Leaders are the same (check if this is expected)')
    }
    
    // Compare with AffiliateProfile.totalEarnings
    console.log('\n📋 CROSS-VALIDATION WITH AFFILIATE PROFILES:')
    const topProfile = await prisma.affiliateProfile.findFirst({
      where: { userId: allTime[0]?.userId },
      include: { user: true }
    })
    
    if (topProfile) {
      const dbTotal = Number(topProfile.totalEarnings)
      const leaderboardTotal = allTime[0].points
      
      console.log(`  ${topProfile.user?.name}:`)
      console.log(`    Profile.totalEarnings: Rp ${dbTotal.toLocaleString('id-ID')}`)
      console.log(`    Leaderboard points: Rp ${leaderboardTotal.toLocaleString('id-ID')}`)
      
      if (Math.abs(dbTotal - leaderboardTotal) < 1000) {
        console.log('    ✅ MATCH!')
      } else {
        console.log(`    ⚠️  MISMATCH! Difference: Rp ${Math.abs(dbTotal - leaderboardTotal).toLocaleString('id-ID')}`)
      }
    }
    
    console.log('\n✅ Verification Complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyLeaderboardConsistency()
