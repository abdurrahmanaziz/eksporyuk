const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeWebinarEventData() {
  console.log('🎯 WEBINAR/EVENT/ZOOMINAR DATA ANALYSIS\n');
  
  try {
    // 1. Check current transaction types in NEON
    console.log('📊 CURRENT TRANSACTION TYPES IN NEON:');
    const transactionTypes = await prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_revenue
      FROM "Transaction"
      GROUP BY type
      ORDER BY count DESC
    `;
    
    transactionTypes.forEach(type => {
      console.log(`  ${type.type}: ${Number(type.count).toLocaleString()} transactions, Rp. ${parseInt(type.total_revenue || 0).toLocaleString()}`);
    });
    
    // 2. Check for Event-related transactions
    console.log('\n🎪 EVENT-RELATED TRANSACTIONS:');
    
    const eventTransactions = await prisma.transaction.count({
      where: { eventId: { not: null }}
    });
    
    const courseTransactions = await prisma.transaction.count({
      where: { courseId: { not: null }}
    });
    
    const membershipTransactions = await prisma.transaction.count({
      where: { 
        OR: [
          { productId: { not: null }},
          { AND: [{ eventId: null }, { courseId: null }]}
        ]
      }
    });
    
    console.log(`  Event Transactions: ${eventTransactions.toLocaleString()}`);
    console.log(`  Course Transactions: ${courseTransactions.toLocaleString()}`);
    console.log(`  Membership/Product Transactions: ${membershipTransactions.toLocaleString()}`);
    
    // 3. Check actual Events in database
    console.log('\n📅 EVENTS IN DATABASE:');
    
    const totalEvents = await prisma.event.count();
    const activeEvents = await prisma.event.count({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`  Total Events: ${totalEvents.toLocaleString()}`);
    console.log(`  Active Events: ${activeEvents.toLocaleString()}`);
    
    if (totalEvents > 0) {
      const recentEvents = await prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          type: true,
          price: true,
          status: true,
          startDate: true,
          _count: {
            select: {
              transactions: true
            }
          }
        }
      });
      
      console.log('\n  Recent Events:');
      recentEvents.forEach(event => {
        console.log(`    ${event.title} (${event.type}) - Rp. ${event.price?.toLocaleString()} - ${event._count.transactions} transactions`);
      });
    }
    
    // 4. Check Courses in database  
    console.log('\n📚 COURSES IN DATABASE:');
    
    const totalCourses = await prisma.course.count();
    const activeCourses = await prisma.course.count({
      where: { status: 'PUBLISHED' }
    });
    
    console.log(`  Total Courses: ${totalCourses.toLocaleString()}`);
    console.log(`  Published Courses: ${activeCourses.toLocaleString()}`);
    
    if (totalCourses > 0) {
      const recentCourses = await prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          price: true,
          status: true,
          _count: {
            select: {
              transactions: true
            }
          }
        }
      });
      
      console.log('\n  Recent Courses:');
      recentCourses.forEach(course => {
        console.log(`    ${course.title} - Rp. ${course.price?.toLocaleString()} - ${course._count.transactions} transactions`);
      });
    }
    
    // 5. Revenue breakdown by transaction type
    console.log('\n💰 REVENUE BREAKDOWN BY TYPE:');
    
    const eventRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        eventId: { not: null },
        status: 'SUCCESS'
      }
    });
    
    const courseRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        courseId: { not: null },
        status: 'SUCCESS'
      }
    });
    
    const membershipRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        AND: [
          { eventId: null },
          { courseId: null }
        ],
        status: 'SUCCESS'
      }
    });
    
    console.log(`  Event Revenue: Rp. ${(eventRevenue._sum.amount || 0).toLocaleString()}`);
    console.log(`  Course Revenue: Rp. ${(courseRevenue._sum.amount || 0).toLocaleString()}`);
    console.log(`  Membership Revenue: Rp. ${(membershipRevenue._sum.amount || 0).toLocaleString()}`);
    
    const totalTrackedRevenue = (eventRevenue._sum.amount || 0) + (courseRevenue._sum.amount || 0) + (membershipRevenue._sum.amount || 0);
    console.log(`  Total Tracked Revenue: Rp. ${totalTrackedRevenue.toLocaleString()}`);
    
    // 6. Commission analysis for events
    console.log('\n💰 EVENT/WEBINAR COMMISSION ANALYSIS:');
    
    const eventCommissions = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as commission_count,
        SUM(ac."commissionAmount") as total_commission
      FROM "AffiliateConversion" ac
      JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE t."eventId" IS NOT NULL
    `;
    
    const courseCommissions = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as commission_count,
        SUM(ac."commissionAmount") as total_commission
      FROM "AffiliateConversion" ac
      JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE t."courseId" IS NOT NULL
    `;
    
    if (eventCommissions.length > 0) {
      console.log(`  Event Commissions: ${Number(eventCommissions[0].commission_count)} records, Rp. ${parseInt(eventCommissions[0].total_commission || 0).toLocaleString()}`);
    }
    
    if (courseCommissions.length > 0) {
      console.log(`  Course Commissions: ${Number(courseCommissions[0].commission_count)} records, Rp. ${parseInt(courseCommissions[0].total_commission || 0).toLocaleString()}`);
    }
    
    // 7. Gap analysis specifically for events/webinars
    console.log('\n🔍 WEBINAR/EVENT GAP ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sejoliTotalRevenue = 4158894962;
    const neonTotalRevenue = 3706031435;
    const revenueGap = sejoliTotalRevenue - neonTotalRevenue;
    
    console.log('  Sejoli Total Revenue: Rp. 4,158,894,962');
    console.log('  NEON Total Revenue: Rp. 3,706,031,435');
    console.log(`  Revenue Gap: Rp. ${revenueGap.toLocaleString()}`);
    
    // Check if events/webinars could be the missing data
    const eventRevenuePercentage = ((eventRevenue._sum.amount || 0) / neonTotalRevenue * 100).toFixed(1);
    const courseRevenuePercentage = ((courseRevenue._sum.amount || 0) / neonTotalRevenue * 100).toFixed(1);
    
    console.log(`\n  Event Revenue Share: ${eventRevenuePercentage}% of total NEON revenue`);
    console.log(`  Course Revenue Share: ${courseRevenuePercentage}% of total NEON revenue`);
    
    // 8. Missing webinar/event hypothesis
    console.log('\n💡 MISSING WEBINAR/EVENT HYPOTHESIS:');
    
    if (eventTransactions === 0 && courseTransactions === 0) {
      console.log('  🚨 NO EVENT/COURSE TRANSACTIONS FOUND IN NEON!');
      console.log('  💡 HYPOTHESIS: All webinar/zoominar sales are missing from NEON');
      console.log('  📊 IMPACT: Could be significant portion of missing Rp. 452M revenue');
      console.log('  🎯 ACTION REQUIRED: Import event/webinar data from Sejoli');
    } else if (eventTransactions < 100 || courseTransactions < 100) {
      console.log('  ⚠️ LIMITED EVENT/COURSE DATA IN NEON');
      console.log('  💡 HYPOTHESIS: Partial webinar/event import, missing recent/historical data');
      console.log('  📊 ESTIMATED MISSING: Significant webinar revenue not tracked');
    } else {
      console.log('  ✅ Event/Course data exists in NEON');
      console.log('  🔍 Gap likely from other transaction types or failed status sync');
    }
    
    // 9. Action plan for webinar data
    console.log('\n🎯 WEBINAR/EVENT DATA RECOVERY PLAN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (eventTransactions === 0) {
      console.log('  PRIORITY 1: Import ALL webinar/event data');
      console.log('  📥 Source: Sejoli events/webinars module');
      console.log('  💰 Expected: High-value transactions with commissions');
      console.log('  📊 Impact: Could resolve majority of revenue gap');
    }
    
    console.log('\n  IMPLEMENTATION STEPS:');
    console.log('    1. Identify webinar/event transactions in Sejoli');
    console.log('    2. Map Sejoli event/webinar format to NEON schema');
    console.log('    3. Create import script for event transactions');
    console.log('    4. Import event/webinar commission records');
    console.log('    5. Validate revenue totals match Sejoli dashboard');
    console.log('    6. Update affiliate wallets with webinar commissions');
    
    console.log('\n📊 EXPECTED POST-IMPORT RESULTS:');
    console.log(`  Current Revenue Gap: Rp. ${revenueGap.toLocaleString()}`);
    console.log('  After Event Import: Gap should reduce significantly');
    console.log('  Commission Impact: Additional affiliate earnings from events');
    console.log('  Data Completeness: Full transaction visibility');
    
    console.log('\n✅ WEBINAR/EVENT ANALYSIS COMPLETE');
    console.log('🎯 CONCLUSION: Event/webinar data import is CRITICAL');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWebinarEventData();