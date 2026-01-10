const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWebinarImportStrategy() {
  console.log('🎯 WEBINAR/EVENT DATA IMPORT STRATEGY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 1. Check current database schema for events
  console.log('📊 CURRENT EVENT SCHEMA STATUS:');
  
  try {
    // Check if Event table exists and its structure
    const eventSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Event' 
      ORDER BY ordinal_position
    `;
    
    if (eventSchema.length > 0) {
      console.log('  ✅ Event table exists with columns:');
      eventSchema.forEach(col => {
        console.log(`    ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
    } else {
      console.log('  ❌ Event table does not exist');
    }
  } catch (e) {
    console.log('  ❌ Cannot access Event table schema:', e.message);
  }
  
  // 2. Check Transaction schema for event support
  console.log('\n📊 TRANSACTION SCHEMA FOR EVENTS:');
  
  try {
    const transactionSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction' 
      AND column_name IN ('eventId', 'courseId', 'type')
      ORDER BY column_name
    `;
    
    transactionSchema.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
    // Check transaction type enum values
    const typeEnum = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'TransactionType'
      ORDER BY enumlabel
    `;
    
    console.log('  Transaction types supported:', typeEnum.map(t => t.enumlabel).join(', '));
    
  } catch (e) {
    console.log('  ❌ Cannot check transaction schema:', e.message);
  }
  
  // 3. Analyze gap data characteristics
  console.log('\n🎯 MISSING DATA CHARACTERISTICS:');
  
  const totalNeonSuccess = await prisma.transaction.count({
    where: { status: 'SUCCESS' }
  });
  
  const neonRevenue = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { status: 'SUCCESS' }
  });
  
  const sejoliData = {
    totalSales: 12879,
    totalRevenue: 4158894962,
    totalCommission: 1256771000
  };
  
  const gap = {
    transactions: sejoliData.totalSales - totalNeonSuccess,
    revenue: sejoliData.totalRevenue - (neonRevenue._sum.amount || 0),
    avgValue: 0
  };
  
  gap.avgValue = gap.revenue / gap.transactions;
  
  console.log(`  Missing Transactions: ${gap.transactions.toLocaleString()}`);
  console.log(`  Missing Revenue: Rp. ${gap.revenue.toLocaleString()}`);
  console.log(`  Avg Missing Value: Rp. ${Math.round(gap.avgValue).toLocaleString()}`);
  
  // 4. December 2025 specific analysis (recent webinar activity)
  console.log('\n📅 DECEMBER 2025 WEBINAR PATTERN:');
  
  const decemberNeon = await prisma.transaction.aggregate({
    _count: { id: true },
    _sum: { amount: true },
    where: {
      createdAt: {
        gte: new Date('2025-12-01'),
        lt: new Date('2026-01-01')
      },
      status: 'SUCCESS'
    }
  });
  
  const decemberSejoliRevenue = 124717000;
  const decemberSejoliSales = 140;
  const decemberGap = {
    transactions: decemberSejoliSales - (decemberNeon._count.id || 0),
    revenue: decemberSejoliRevenue - (decemberNeon._sum.amount || 0)
  };
  
  console.log(`  December NEON: ${decemberNeon._count.id || 0} sales, Rp. ${(decemberNeon._sum.amount || 0).toLocaleString()}`);
  console.log(`  December Sejoli: ${decemberSejoliSales} sales, Rp. ${decemberSejoliRevenue.toLocaleString()}`);
  console.log(`  December Missing: ${decemberGap.transactions} sales, Rp. ${decemberGap.revenue.toLocaleString()}`);
  console.log(`  December Missing Avg: Rp. ${Math.round(decemberGap.revenue/decemberGap.transactions).toLocaleString()}`);
  
  // 5. Webinar transaction pattern analysis
  console.log('\n🔍 WEBINAR TRANSACTION PATTERNS:');
  
  // Get distribution of NEON transaction amounts to understand normal vs webinar pricing
  const priceDistribution = await prisma.transaction.groupBy({
    by: ['amount'],
    _count: { amount: true },
    where: { 
      status: 'SUCCESS',
      amount: { gt: 500000 } // Focus on higher value transactions
    },
    orderBy: { _count: { amount: 'desc' } },
    take: 10
  });
  
  console.log('  High-value NEON transactions (>500K):');
  priceDistribution.forEach(item => {
    console.log(`    Rp. ${item.amount.toLocaleString()}: ${item._count.amount} transactions`);
  });
  
  // 6. Commission pattern for webinars
  console.log('\n💰 COMMISSION PATTERNS:');
  
  const currentCommissions = await prisma.affiliateConversion.aggregate({
    _avg: { commissionAmount: true },
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  const avgCurrentCommission = currentCommissions._avg.commissionAmount || 0;
  const estimatedWebinarCommissionRate = 0.35; // Webinars typically 30-40%
  const estimatedWebinarAvgCommission = gap.avgValue * estimatedWebinarCommissionRate;
  
  console.log(`  Current Avg Commission: Rp. ${Math.round(avgCurrentCommission).toLocaleString()}`);
  console.log(`  Estimated Webinar Avg Commission: Rp. ${Math.round(estimatedWebinarAvgCommission).toLocaleString()}`);
  console.log(`  Commission Multiplier: ${(estimatedWebinarAvgCommission/avgCurrentCommission).toFixed(1)}x higher`);
  
  // 7. Import strategy and requirements
  console.log('\n🚀 WEBINAR IMPORT STRATEGY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('  📥 DATA SOURCES TO CHECK:');
  console.log('    1. Sejoli Webinar Module API');
  console.log('    2. Sejoli Event/Zoominar sections');
  console.log('    3. High-value transaction exports');
  console.log('    4. Recent December 2025 webinar sales');
  
  console.log('\n  🗂️ REQUIRED DATA FIELDS:');
  console.log('    - Event/Webinar ID and title');
  console.log('    - Transaction date and amount'); 
  console.log('    - Customer/member information');
  console.log('    - Affiliate referral data');
  console.log('    - Commission rates and calculations');
  console.log('    - Payment status and method');
  
  console.log('\n  📊 IMPORT VALIDATION:');
  console.log(`    - Target: ${gap.transactions.toLocaleString()} transactions`);
  console.log(`    - Revenue: Rp. ${gap.revenue.toLocaleString()}`);
  console.log(`    - Commission records: ~${Math.round(gap.transactions * 0.8).toLocaleString()}`);
  console.log(`    - December priority: ${decemberGap.transactions} recent sales`);
  
  console.log('\n  🔧 IMPLEMENTATION PHASES:');
  console.log('    Phase 1: Access Sejoli webinar data export');
  console.log('    Phase 2: Create Event records in NEON');
  console.log('    Phase 3: Import webinar transactions with EVENT type');
  console.log('    Phase 4: Calculate and create commission records');
  console.log('    Phase 5: Update affiliate wallets');
  console.log('    Phase 6: Validate totals against Sejoli dashboard');
  
  // 8. Expected results
  console.log('\n✅ EXPECTED POST-IMPORT RESULTS:');
  console.log(`  📈 Transactions: ${totalNeonSuccess.toLocaleString()} → ${sejoliData.totalSales.toLocaleString()} (+${gap.transactions.toLocaleString()})`);
  console.log(`  💰 Revenue: Rp. ${(neonRevenue._sum.amount || 0).toLocaleString()} → Rp. ${sejoliData.totalRevenue.toLocaleString()}`);
  console.log(`  🏆 Commission: +Rp. ${Math.round(gap.revenue * estimatedWebinarCommissionRate).toLocaleString()}`);
  console.log(`  📊 Data Integrity: ${((totalNeonSuccess/sejoliData.totalSales)*100).toFixed(1)}% → 100%`);
  
  console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
  console.log('  1. Access Sejoli admin panel webinar/event section');
  console.log('  2. Export all historical webinar transaction data');
  console.log('  3. Prioritize December 2025 recent sales');
  console.log('  4. Begin import process to complete financial picture');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚨 CRITICAL: 452M revenue and 367M commissions missing!');
  console.log('🎯 PRIORITY: Import webinar data to complete platform migration');
  
  try {
    await prisma.$disconnect();
  } catch (e) {
    // Silent disconnect
  }
}

createWebinarImportStrategy();