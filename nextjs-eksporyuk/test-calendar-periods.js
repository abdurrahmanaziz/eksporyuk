const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCalendarPeriods() {
  console.log('📊 TESTING CALENDAR-BASED PERIODS\n');
  
  const now = new Date();
  console.log('Current date:', now.toISOString().split('T')[0], '\n');
  
  // Current week (Monday to today)
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Current month (1st to today)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  
  console.log('📅 WEEK START (Monday):', weekStart.toISOString().split('T')[0]);
  console.log('📅 MONTH START (1st):', monthStart.toISOString().split('T')[0]);
  console.log();
  
  // Count conversions
  const weekCount = await prisma.affiliateConversion.count({
    where: { 
      createdAt: { gte: weekStart },
      transaction: { status: 'SUCCESS' }
    }
  });
  
  const monthCount = await prisma.affiliateConversion.count({
    where: { 
      createdAt: { gte: monthStart },
      transaction: { status: 'SUCCESS' }
    }
  });
  
  const allCount = await prisma.affiliateConversion.count({
    where: { 
      transaction: { status: 'SUCCESS' }
    }
  });
  
  console.log('📊 CONVERSION COUNTS:');
  console.log(`  This Week (${weekStart.toISOString().split('T')[0]} - today): ${weekCount} conversions`);
  console.log(`  This Month (${monthStart.toISOString().split('T')[0]} - today): ${monthCount} conversions`);
  console.log(`  All-Time: ${allCount} conversions`);
  
  // Get top 3 for each period
  async function getTop3(startDate) {
    const whereClause = startDate ? { 
      createdAt: { gte: startDate },
      transaction: { status: 'SUCCESS' }
    } : {
      transaction: { status: 'SUCCESS' }
    };
    
    const aggregated = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: whereClause,
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 3
    });
    
    const results = [];
    for (const agg of aggregated) {
      const profile = await prisma.affiliateProfile.findFirst({
        where: { id: agg.affiliateId },
        include: { user: { select: { name: true } } }
      });
      
      results.push({
        name: profile?.user?.name || 'Unknown',
        commission: Number(agg._sum.commissionAmount),
        conversions: agg._count.id
      });
    }
    
    return results;
  }
  
  console.log('\n🏆 TOP 3 EACH PERIOD:\n');
  
  const weekTop3 = await getTop3(weekStart);
  console.log('📅 THIS WEEK:');
  weekTop3.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} - Rp ${item.commission.toLocaleString('id-ID')} (${item.conversions} conv)`);
  });
  
  console.log('\n📆 THIS MONTH:');
  const monthTop3 = await getTop3(monthStart);
  monthTop3.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} - Rp ${item.commission.toLocaleString('id-ID')} (${item.conversions} conv)`);
  });
  
  console.log('\n🏆 ALL-TIME:');
  const allTop3 = await getTop3();
  allTop3.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} - Rp ${item.commission.toLocaleString('id-ID')} (${item.conversions} conv)`);
  });
  
  await prisma.$disconnect();
}

testCalendarPeriods();
