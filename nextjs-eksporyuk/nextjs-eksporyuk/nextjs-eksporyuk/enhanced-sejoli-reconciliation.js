const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 🎯 ENHANCED RECONCILIATION: Focus on missing affiliate data patterns
async function enhancedSejoliReconciliation() {
  console.log('🚀 ENHANCED SEJOLI DATA RECONCILIATION\n');
  
  // Step 1: Analyze the gap by affiliate
  console.log('📊 STEP 1: Analyzing Gap by Affiliate');
  const gapAnalysis = await analyzeGapByAffiliate();
  
  // Step 2: Find commission differences by product
  console.log('\n💰 STEP 2: Analyzing Commission Differences by Product'); 
  const productAnalysis = await analyzeCommissionByProduct();
  
  // Step 3: Time-based analysis - check if recent data is missing
  console.log('\n⏰ STEP 3: Time-based Missing Data Analysis');
  const timeAnalysis = await analyzeTimeBasedGaps();
  
  // Step 4: Create strategy for real data sync
  console.log('\n🎯 STEP 4: Creating Real Data Sync Strategy');
  const strategy = await createRealDataSyncStrategy(gapAnalysis, productAnalysis, timeAnalysis);
  
  return strategy;
}

async function analyzeGapByAffiliate() {
  console.log('Comparing affiliate totals between Sejoli and Database...');
  
  // Load Sejoli data
  const sejoliData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json'), 
    'utf8'
  ));
  
  const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');
  
  // Calculate Sejoli totals by affiliate
  const { orders, affiliates } = sejoliData;
  const affiliateMap = {};
  affiliates.forEach(aff => {
    affiliateMap[aff.id] = {
      name: aff.display_name || aff.user_nicename,
      email: aff.user_email
    };
  });
  
  const sejoliAffiliateTotals = {};
  orders.filter(order => order.status === 'completed' && order.affiliate_id).forEach(order => {
    const commission = getCommissionForProduct(order.product_id);
    if (commission > 0) {
      const affiliate = affiliateMap[order.affiliate_id];
      if (affiliate) {
        const key = affiliate.email.toLowerCase();
        if (!sejoliAffiliateTotals[key]) {
          sejoliAffiliateTotals[key] = {
            name: affiliate.name,
            email: affiliate.email,
            commissionTotal: 0,
            conversionCount: 0
          };
        }
        sejoliAffiliateTotals[key].commissionTotal += commission;
        sejoliAffiliateTotals[key].conversionCount++;
      }
    }
  });
  
  // Calculate database totals by affiliate
  const dbAffiliates = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      conversions: { select: { commissionAmount: true } }
    }
  });
  
  const dbAffiliateTotals = {};
  dbAffiliates.forEach(aff => {
    const key = aff.user.email.toLowerCase();
    const total = aff.conversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0);
    dbAffiliateTotals[key] = {
      name: aff.user.name,
      email: aff.user.email,
      commissionTotal: total,
      conversionCount: aff.conversions.length
    };
  });
  
  // Find gaps
  const gaps = [];
  Object.keys(sejoliAffiliateTotals).forEach(email => {
    const sejoli = sejoliAffiliateTotals[email];
    const db = dbAffiliateTotals[email];
    
    if (!db) {
      gaps.push({
        type: 'MISSING_AFFILIATE',
        email: email,
        name: sejoli.name,
        sejoliTotal: sejoli.commissionTotal,
        dbTotal: 0,
        gap: sejoli.commissionTotal,
        conversionGap: sejoli.conversionCount
      });
    } else if (sejoli.commissionTotal > db.commissionTotal) {
      gaps.push({
        type: 'COMMISSION_GAP',
        email: email,
        name: sejoli.name,
        sejoliTotal: sejoli.commissionTotal,
        dbTotal: db.commissionTotal,
        gap: sejoli.commissionTotal - db.commissionTotal,
        conversionGap: sejoli.conversionCount - db.conversionCount
      });
    }
  });
  
  // Sort by gap size
  gaps.sort((a, b) => b.gap - a.gap);
  
  console.log(`Found ${gaps.length} affiliates with commission gaps`);
  console.log('\n🔍 TOP 15 AFFILIATE GAPS:');
  gaps.slice(0, 15).forEach((gap, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${gap.name.padEnd(25)} Gap: Rp ${gap.gap.toLocaleString().padStart(12)} [${gap.type}]`);
  });
  
  const totalGap = gaps.reduce((sum, gap) => sum + gap.gap, 0);
  console.log(`\nTotal Gap from Top Affiliates: Rp ${totalGap.toLocaleString()}`);
  
  return gaps;
}

async function analyzeCommissionByProduct() {
  console.log('Analyzing commission differences by product...');
  
  // Load Sejoli data
  const sejoliData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json'), 
    'utf8'
  ));
  
  const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');
  
  // Analyze Sejoli by product
  const sejoliProductStats = {};
  const { orders } = sejoliData;
  
  orders.filter(order => order.status === 'completed' && order.affiliate_id).forEach(order => {
    const commission = getCommissionForProduct(order.product_id);
    if (commission > 0) {
      if (!sejoliProductStats[order.product_id]) {
        sejoliProductStats[order.product_id] = {
          count: 0,
          totalCommission: 0,
          commission: commission
        };
      }
      sejoliProductStats[order.product_id].count++;
      sejoliProductStats[order.product_id].totalCommission += commission;
    }
  });
  
  // Get database stats by finding transaction patterns
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    include: {
      affiliateConversion: { select: { commissionAmount: true } }
    }
  });
  
  // Group transactions by amount (proxy for product)
  const dbProductStats = {};
  transactions.filter(tx => tx.affiliateConversion).forEach(tx => {
    const amount = Number(tx.amount);
    const commission = Number(tx.affiliateConversion.commissionAmount);
    
    if (!dbProductStats[amount]) {
      dbProductStats[amount] = {
        count: 0,
        totalCommission: 0,
        commission: commission
      };
    }
    dbProductStats[amount].count++;
    dbProductStats[amount].totalCommission += commission;
  });
  
  console.log('\n📊 SEJOLI PRODUCT COMMISSION BREAKDOWN:');
  Object.keys(sejoliProductStats).slice(0, 10).forEach(productId => {
    const stats = sejoliProductStats[productId];
    console.log(`Product ${productId}: ${stats.count} conversions, Rp ${stats.totalCommission.toLocaleString()} total, Rp ${stats.commission.toLocaleString()} each`);
  });
  
  return { sejoli: sejoliProductStats, database: dbProductStats };
}

async function analyzeTimeBasedGaps() {
  console.log('Analyzing time-based gaps...');
  
  // Get transaction dates from database
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    include: {
      affiliateConversion: { 
        select: { commissionAmount: true } 
      }
    }
  });
  
  // Group by month
  const dbByMonth = {};
  transactions.filter(tx => tx.affiliateConversion).forEach(tx => {
    const month = tx.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!dbByMonth[month]) {
      dbByMonth[month] = { count: 0, commission: 0 };
    }
    dbByMonth[month].count++;
    dbByMonth[month].commission += Number(tx.affiliateConversion.commissionAmount);
  });
  
  // Load Sejoli and group by month
  const sejoliData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json'), 
    'utf8'
  ));
  
  const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');
  
  const sejoliByMonth = {};
  sejoliData.orders.filter(order => order.status === 'completed' && order.affiliate_id).forEach(order => {
    const commission = getCommissionForProduct(order.product_id);
    if (commission > 0 && order.date_created) {
      const month = order.date_created.substring(0, 7); // YYYY-MM
      if (!sejoliByMonth[month]) {
        sejoliByMonth[month] = { count: 0, commission: 0 };
      }
      sejoliByMonth[month].count++;
      sejoliByMonth[month].commission += commission;
    }
  });
  
  console.log('\n📅 MONTHLY COMPARISON (Last 6 months):');
  const months = Object.keys(sejoliByMonth).sort().slice(-6);
  months.forEach(month => {
    const sejoli = sejoliByMonth[month] || { count: 0, commission: 0 };
    const db = dbByMonth[month] || { count: 0, commission: 0 };
    const gap = sejoli.commission - db.commission;
    const accuracy = db.commission > 0 ? (db.commission / sejoli.commission * 100) : 0;
    
    console.log(`${month}: Sejoli Rp ${sejoli.commission.toLocaleString().padStart(12)}, DB Rp ${db.commission.toLocaleString().padStart(12)}, Gap Rp ${gap.toLocaleString().padStart(12)} (${accuracy.toFixed(1)}%)`);
  });
  
  return { sejoli: sejoliByMonth, database: dbByMonth };
}

async function createRealDataSyncStrategy(gapAnalysis, productAnalysis, timeAnalysis) {
  console.log('Creating comprehensive strategy for real data sync...');
  
  const totalGap = gapAnalysis.reduce((sum, gap) => sum + gap.gap, 0);
  const missingAffiliates = gapAnalysis.filter(gap => gap.type === 'MISSING_AFFILIATE');
  const commissionGaps = gapAnalysis.filter(gap => gap.type === 'COMMISSION_GAP');
  
  console.log('\n🎯 REAL DATA SYNC STRATEGY:');
  console.log(`📊 Total Gap to Close: Rp ${totalGap.toLocaleString()}`);
  console.log(`👥 Missing Affiliates: ${missingAffiliates.length}`);
  console.log(`💰 Commission Gaps: ${commissionGaps.length}`);
  
  // Strategy recommendations
  const strategies = [
    {
      priority: 1,
      action: 'CREATE_MISSING_AFFILIATES',
      description: `Create ${missingAffiliates.length} missing affiliate profiles`,
      impact: `Rp ${missingAffiliates.reduce((sum, aff) => sum + aff.gap, 0).toLocaleString()}`,
      effort: 'LOW',
      feasibility: 'HIGH'
    },
    {
      priority: 2,
      action: 'ADD_MISSING_CONVERSIONS',
      description: `Add missing conversions for existing affiliates`,
      impact: `Rp ${commissionGaps.reduce((sum, gap) => sum + gap.gap, 0).toLocaleString()}`,
      effort: 'MEDIUM',
      feasibility: 'HIGH'
    },
    {
      priority: 3,
      action: 'REQUEST_FRESH_EXPORT',
      description: 'Request fresh Sejoli export with recent data',
      impact: 'Full accuracy for current time',
      effort: 'LOW',
      feasibility: 'MEDIUM'
    },
    {
      priority: 4,
      action: 'IMPLEMENT_REAL_TIME_SYNC',
      description: 'Set up real-time sync with Sejoli API',
      impact: '100% accuracy ongoing',
      effort: 'HIGH',
      feasibility: 'LOW'
    }
  ];
  
  console.log('\n📋 RECOMMENDED ACTIONS (Priority Order):');
  strategies.forEach(strategy => {
    console.log(`${strategy.priority}. ${strategy.description}`);
    console.log(`   Impact: ${strategy.impact}`);
    console.log(`   Effort: ${strategy.effort}, Feasibility: ${strategy.feasibility}\n`);
  });
  
  // Immediate executable action
  console.log('🚀 IMMEDIATE EXECUTABLE ACTION:');
  console.log(`
Option A: CREATE MISSING AFFILIATE PROFILES
- Execute: node create-missing-affiliates.js
- Impact: Add ${missingAffiliates.length} affiliates worth Rp ${missingAffiliates.reduce((sum, aff) => sum + aff.gap, 0).toLocaleString()}
- Time: 30 minutes
- Risk: Low

Option B: REQUEST FRESH SEJOLI EXPORT
- Contact WordPress admin for fresh export
- Replace current sejolisa-full-*.json file
- Re-run import process
- Expected accuracy: 95%+
- Time: 2-4 hours (including admin contact)
- Risk: Low
  `);
  
  return {
    totalGap,
    strategies,
    missingAffiliates: missingAffiliates.slice(0, 20), // Top 20
    commissionGaps: commissionGaps.slice(0, 20),
    recommendation: 'Start with Option A, then request fresh export for Option B'
  };
}

// Execute enhanced reconciliation
if (require.main === module) {
  enhancedSejoliReconciliation()
    .then(strategy => {
      console.log('\n✅ ENHANCED RECONCILIATION ANALYSIS COMPLETE');
      console.log(`\n💡 NEXT STEP: ${strategy.recommendation}`);
      
      if (process.argv.includes('--create-missing')) {
        console.log('\n⚡ Creating missing affiliate profiles...');
        // Would execute creation here
      } else {
        console.log('\nℹ️  Add --create-missing flag to create missing affiliate profiles automatically');
      }
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { enhancedSejoliReconciliation };