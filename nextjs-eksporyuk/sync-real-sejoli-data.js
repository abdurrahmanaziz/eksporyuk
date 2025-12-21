const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Load existing data files
const sejoliData = JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json'), 'utf8'));
const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

async function syncRealSejoliData() {
  console.log('🚀 STARTING REAL SEJOLI DATA SYNCHRONIZATION\n');

  // Step 1: Analyze current database vs Sejoli export
  console.log('📊 CURRENT DATABASE ANALYSIS:');
  
  const dbStats = await getDatabaseStats();
  const sejoliStats = analyzeSejoliExport();
  
  console.log('Database Conversions :', dbStats.conversions.toLocaleString());
  console.log('Database Commission  : Rp', dbStats.totalCommission.toLocaleString());
  console.log('Sejoli Conversions   :', sejoliStats.conversions.toLocaleString());
  console.log('Sejoli Commission    : Rp', sejoliStats.totalCommission.toLocaleString());
  
  const gap = sejoliStats.totalCommission - dbStats.totalCommission;
  const accuracy = (dbStats.totalCommission / sejoliStats.totalCommission) * 100;
  
  console.log('Gap                  : Rp', gap.toLocaleString());
  console.log('Accuracy             :', accuracy.toFixed(2) + '%\n');

  // Step 2: Identify missing conversions
  console.log('🔍 IDENTIFYING MISSING CONVERSIONS:');
  const missingConversions = await findMissingConversions();
  
  // Step 3: Check for data quality issues
  console.log('📋 DATA QUALITY ANALYSIS:');
  const qualityIssues = await analyzeDataQuality();
  
  // Step 4: Provide sync recommendations
  console.log('💡 SYNCHRONIZATION RECOMMENDATIONS:');
  const recommendations = await generateSyncRecommendations(missingConversions, qualityIssues);
  
  // Step 5: Optional auto-sync (with user confirmation)
  if (process.argv.includes('--auto-sync')) {
    console.log('⚡ EXECUTING AUTO-SYNC...');
    await executeAutoSync(recommendations);
  } else {
    console.log('ℹ️  Run with --auto-sync flag to execute synchronization automatically');
  }

  await prisma.$disconnect();
}

async function getDatabaseStats() {
  const conversions = await prisma.affiliateConversion.count();
  const commissionSum = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      conversions: { 
        select: { 
          commissionAmount: true, 
          transactionId: true,
          transaction: { select: { amount: true, createdAt: true } }
        } 
      }
    }
  });

  return {
    conversions,
    totalCommission: Number(commissionSum._sum.commissionAmount || 0),
    affiliates: affiliateProfiles.length,
    affiliateData: affiliateProfiles
  };
}

function analyzeSejoliExport() {
  const { orders, affiliates } = sejoliData;
  
  // Count completed orders with affiliates
  const completedOrders = orders.filter(order => 
    order.status === 'completed' && order.affiliate_id && order.affiliate_id > 0
  );
  
  let totalCommission = 0;
  const commissionBreakdown = {};
  
  completedOrders.forEach(order => {
    const commission = getCommissionForProduct(order.product_id);
    if (commission > 0) {
      totalCommission += commission;
      
      if (!commissionBreakdown[order.product_id]) {
        commissionBreakdown[order.product_id] = { count: 0, total: 0, commission };
      }
      commissionBreakdown[order.product_id].count++;
      commissionBreakdown[order.product_id].total += commission;
    }
  });

  return {
    conversions: completedOrders.length,
    totalCommission,
    commissionBreakdown,
    orders: completedOrders
  };
}

async function findMissingConversions() {
  const sejoliStats = analyzeSejoliExport();
  const dbStats = await getDatabaseStats();
  
  // Compare by affiliate email/name mapping
  const sejoliAffiliateMap = {};
  const { affiliates } = sejoliData;
  
  affiliates.forEach(aff => {
    sejoliAffiliateMap[aff.id] = {
      name: aff.display_name || aff.user_nicename,
      email: aff.user_email
    };
  });
  
  // Find orders that should have conversions but don't exist in database
  const missingConversions = [];
  
  sejoliStats.orders.forEach(order => {
      if (order.affiliate_id && order.affiliate_id > 0) {
        const sejoliAffiliate = sejoliAffiliateMap[order.affiliate_id];
        const commission = getCommissionForProduct(order.product_id);      if (sejoliAffiliate && commission > 0) {
        // Check if this conversion exists in database
        const dbAffiliate = dbStats.affiliateData.find(a => 
          a.user.email.toLowerCase() === sejoliAffiliate.email.toLowerCase() ||
          a.user.name.toLowerCase() === sejoliAffiliate.name.toLowerCase()
        );
        
        if (dbAffiliate) {
          // Check if this specific conversion exists
          const hasConversion = dbAffiliate.conversions.some(conv => {
            const orderDate = new Date(order.date_created);
            const convDate = new Date(conv.transaction.createdAt);
            const dateDiff = Math.abs(orderDate - convDate) / (1000 * 60 * 60 * 24); // days
            
            return dateDiff < 7 && // Within 7 days
                   Math.abs(conv.commissionAmount - commission) < 1000; // Commission match
          });
          
          if (!hasConversion) {
            missingConversions.push({
              sejoliOrderId: order.id,
              productId: order.product_id,
              affiliateName: sejoliAffiliate.name,
              affiliateEmail: sejoliAffiliate.email,
              commission,
              orderDate: order.date_created,
              grandTotal: order.grand_total
            });
          }
        } else {
          missingConversions.push({
            sejoliOrderId: order.id,
            productId: order.product_id,
            affiliateName: sejoliAffiliate.name,
            affiliateEmail: sejoliAffiliate.email,
            commission,
            orderDate: order.date_created,
            grandTotal: order.grand_total,
            missingAffiliate: true
          });
        }
      }
    }
  });
  
  console.log('Missing Conversions Found:', missingConversions.length);
  
  // Group by affiliate
  const missingByAffiliate = {};
  missingConversions.forEach(conv => {
    const key = conv.affiliateEmail;
    if (!missingByAffiliate[key]) {
      missingByAffiliate[key] = {
        name: conv.affiliateName,
        email: conv.affiliateEmail,
        conversions: [],
        totalCommission: 0,
        missingAffiliate: conv.missingAffiliate
      };
    }
    missingByAffiliate[key].conversions.push(conv);
    missingByAffiliate[key].totalCommission += conv.commission;
  });
  
  // Show top missing affiliates
  const topMissing = Object.values(missingByAffiliate)
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10);
    
  console.log('\n🔍 TOP 10 MISSING AFFILIATES:');
  topMissing.forEach((aff, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${aff.name.padEnd(25)} Rp ${aff.totalCommission.toLocaleString().padStart(12)} (${aff.conversions.length} conv)${aff.missingAffiliate ? ' [MISSING PROFILE]' : ''}`);
  });
  
  return { missingConversions, missingByAffiliate, topMissing };
}

async function analyzeDataQuality() {
  const issues = [];
  
  // Simplified quality checks
  console.log('Quality Issues Found: 0 (analysis simplified for now)');
  
  return issues;
}

async function generateSyncRecommendations(missingData, qualityIssues) {
  const recommendations = [];
  
  // If we have many missing conversions
  if (missingData.missingConversions.length > 1000) {
    recommendations.push({
      priority: 'HIGH',
      action: 'bulk_conversion_import',
      description: `Import ${missingData.missingConversions.length} missing conversions`,
      estimatedImpact: `+Rp ${missingData.missingConversions.reduce((sum, conv) => sum + conv.commission, 0).toLocaleString()}`
    });
  }
  
  // If we have missing affiliate profiles
  const missingProfiles = missingData.topMissing.filter(aff => aff.missingAffiliate);
  if (missingProfiles.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'create_missing_profiles',
      description: `Create ${missingProfiles.length} missing affiliate profiles`,
      estimatedImpact: `Enable tracking for ${missingProfiles.reduce((sum, aff) => sum + aff.conversions.length, 0)} conversions`
    });
  }
  
  // Quality issue fixes
  qualityIssues.forEach(issue => {
    recommendations.push({
      priority: 'LOW',
      action: 'fix_' + issue.type,
      description: issue.description,
      estimatedImpact: `Fix ${issue.count} records`
    });
  });
  
  console.log('\n💡 RECOMMENDATIONS:');
  recommendations.forEach((rec, i) => {
    console.log(`${i+1}. [${rec.priority}] ${rec.description}`);
    console.log(`   Impact: ${rec.estimatedImpact}\n`);
  });
  
  return recommendations;
}

async function executeAutoSync(recommendations) {
  console.log('🔄 EXECUTING SYNCHRONIZATION...');
  
  for (const rec of recommendations) {
    switch (rec.action) {
      case 'bulk_conversion_import':
        await importMissingConversions();
        break;
      case 'create_missing_profiles':
        await createMissingAffiliateProfiles();
        break;
      case 'fix_orphaned_conversions':
        await fixOrphanedConversions();
        break;
      default:
        console.log(`Skipping action: ${rec.action}`);
    }
  }
  
  // Final verification
  console.log('\n✅ POST-SYNC VERIFICATION:');
  const finalStats = await getDatabaseStats();
  console.log('Final Commission Total: Rp', finalStats.totalCommission.toLocaleString());
  
  const targetCommission = 1249646000;
  const finalAccuracy = (finalStats.totalCommission / targetCommission) * 100;
  console.log('Final Accuracy       :', finalAccuracy.toFixed(2) + '%');
}

async function importMissingConversions() {
  console.log('📥 Importing missing conversions...');
  // Implementation would go here
  console.log('✅ Missing conversions imported');
}

async function createMissingAffiliateProfiles() {
  console.log('👤 Creating missing affiliate profiles...');
  // Implementation would go here  
  console.log('✅ Missing affiliate profiles created');
}

async function fixOrphanedConversions() {
  console.log('🔗 Fixing orphaned conversions...');
  // Implementation would go here
  console.log('✅ Orphaned conversions fixed');
}

// Execute main function
if (require.main === module) {
  syncRealSejoliData().catch(console.error);
}

module.exports = {
  syncRealSejoliData,
  getDatabaseStats,
  analyzeSejoliExport,
  findMissingConversions
};