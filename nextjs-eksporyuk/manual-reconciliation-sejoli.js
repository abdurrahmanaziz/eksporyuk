const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 🎯 MANUAL RECONCILIATION FOR REAL SEJOLI DATA
// Target: Increase accuracy from 79.2% to 95%+ by adding high-value missing conversions

async function executeManualReconciliation() {
  console.log('🚀 MANUAL RECONCILIATION - REAL SEJOLI DATA SYNC\n');
  
  const currentStats = await getCurrentStats();
  console.log('📊 CURRENT STATUS:');
  console.log(`Database Commission: Rp ${currentStats.dbCommission.toLocaleString()}`);
  console.log(`Target Commission  : Rp ${currentStats.targetCommission.toLocaleString()}`);
  console.log(`Current Accuracy   : ${currentStats.accuracy.toFixed(2)}%`);
  console.log(`Gap to Close       : Rp ${currentStats.gap.toLocaleString()}\n`);

  // Step 1: Identify high-value missing conversions
  console.log('🔍 STEP 1: Identifying High-Value Missing Conversions');
  const missingConversions = await identifyMissingHighValueConversions();
  
  // Step 2: Create missing affiliate profiles if needed
  console.log('\n👤 STEP 2: Creating Missing Affiliate Profiles');
  const newProfiles = await createMissingAffiliateProfiles(missingConversions);
  
  // Step 3: Add missing conversions to database
  console.log('\n💰 STEP 3: Adding Missing Conversions');
  const addedConversions = await addMissingConversions(missingConversions);
  
  // Step 4: Verify final accuracy
  console.log('\n✅ STEP 4: Final Verification');
  const finalStats = await getCurrentStats();
  
  console.log('\n🎯 RECONCILIATION SUMMARY:');
  console.log(`Profiles Created    : ${newProfiles.length}`);
  console.log(`Conversions Added   : ${addedConversions.length}`);
  console.log(`Commission Added    : Rp ${addedConversions.reduce((sum, conv) => sum + conv.commission, 0).toLocaleString()}`);
  console.log(`Final Accuracy      : ${finalStats.accuracy.toFixed(2)}%`);
  console.log(`Remaining Gap       : Rp ${finalStats.gap.toLocaleString()}\n`);
  
  if (finalStats.accuracy >= 95) {
    console.log('🎉 SUCCESS: Target accuracy achieved!');
  } else {
    console.log('⚠️  Target not fully achieved. Consider running again or requesting fresh export.');
  }
  
  return {
    initialAccuracy: currentStats.accuracy,
    finalAccuracy: finalStats.accuracy,
    profilesCreated: newProfiles.length,
    conversionsAdded: addedConversions.length,
    commissionAdded: addedConversions.reduce((sum, conv) => sum + conv.commission, 0)
  };
}

async function getCurrentStats() {
  const dbCommission = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  const targetCommission = 1227065000; // From Sejoli export analysis
  const dbTotal = Number(dbCommission._sum.commissionAmount || 0);
  const gap = targetCommission - dbTotal;
  const accuracy = (dbTotal / targetCommission) * 100;
  
  return {
    dbCommission: dbTotal,
    targetCommission,
    gap,
    accuracy
  };
}

async function identifyMissingHighValueConversions() {
  console.log('Analyzing Sejoli export for missing high-value conversions...');
  
  // Load Sejoli data
  const sejoliData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json'), 
    'utf8'
  ));
  
  const { getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');
  
  // Get all existing conversions
  const existingConversions = await prisma.affiliateConversion.findMany({
    include: {
      transaction: { select: { amount: true, createdAt: true } },
      affiliate: { 
        include: { user: { select: { name: true, email: true } } }
      }
    }
  });
  
  console.log(`Existing conversions: ${existingConversions.length}`);
  
  // Create mapping of existing conversions for quick lookup
  const existingMap = new Map();
  existingConversions.forEach(conv => {
    const key = `${conv.affiliate.user.email}_${conv.commissionAmount}_${new Date(conv.transaction.createdAt).toDateString()}`;
    existingMap.set(key, true);
  });
  
  // Analyze Sejoli orders for high-value missing conversions
  const { orders, affiliates } = sejoliData;
  const affiliateMap = {};
  affiliates.forEach(aff => {
    affiliateMap[aff.id] = {
      name: aff.display_name || aff.user_nicename,
      email: aff.user_email
    };
  });
  
  const missingConversions = [];
  const completedOrders = orders.filter(order => 
    order.status === 'completed' && order.affiliate_id && order.affiliate_id > 0
  );
  
  console.log(`Analyzing ${completedOrders.length} completed orders with affiliates...`);
  
  completedOrders.forEach(order => {
    const commission = getCommissionForProduct(order.product_id);
    if (commission >= 200000) { // Focus on high-value commissions (>= 200k)
      const affiliate = affiliateMap[order.affiliate_id];
      if (affiliate) {
        const orderDate = new Date(order.date_created);
        const lookupKey = `${affiliate.email}_${commission}_${orderDate.toDateString()}`;
        
        if (!existingMap.has(lookupKey)) {
          missingConversions.push({
            sejoliOrderId: order.id,
            productId: order.product_id,
            affiliateName: affiliate.name,
            affiliateEmail: affiliate.email,
            commission,
            orderDate: order.date_created,
            orderAmount: order.grand_total,
            priority: commission >= 300000 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
  });
  
  // Sort by commission amount (highest first)
  missingConversions.sort((a, b) => b.commission - a.commission);
  
  console.log(`Found ${missingConversions.length} missing high-value conversions`);
  
  // Show top 10 missing
  console.log('\n🔝 TOP 10 MISSING HIGH-VALUE CONVERSIONS:');
  missingConversions.slice(0, 10).forEach((conv, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${conv.affiliateName.padEnd(25)} Rp ${conv.commission.toLocaleString().padStart(10)} [${conv.priority}]`);
  });
  
  const totalMissingCommission = missingConversions.reduce((sum, conv) => sum + conv.commission, 0);
  console.log(`\nTotal Missing Commission: Rp ${totalMissingCommission.toLocaleString()}`);
  
  return missingConversions;
}

async function createMissingAffiliateProfiles(missingConversions) {
  console.log('Checking for missing affiliate profiles...');
  
  const uniqueAffiliates = new Map();
  missingConversions.forEach(conv => {
    uniqueAffiliates.set(conv.affiliateEmail, {
      name: conv.affiliateName,
      email: conv.affiliateEmail
    });
  });
  
  const createdProfiles = [];
  
  for (const [email, affiliateData] of uniqueAffiliates) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { affiliateProfile: true }
    });
    
    if (existingUser && !existingUser.affiliateProfile) {
      // User exists but no affiliate profile
      try {
        const newProfile = await prisma.affiliateProfile.create({
          data: {
            userId: existingUser.id,
            affiliateCode: `AFF${Date.now()}`,
            shortLink: `https://eksporyuk.com/go/${existingUser.email.split('@')[0]}`,
            commissionRate: 30 // Default rate
          }
        });
        
        createdProfiles.push({
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        });
        
        console.log(`✅ Created affiliate profile for: ${affiliateData.name}`);
      } catch (error) {
        console.log(`❌ Failed to create profile for ${affiliateData.name}:`, error.message);
      }
    } else if (!existingUser) {
      console.log(`⚠️  User not found in database: ${affiliateData.name} (${email})`);
      console.log(`   This affiliate's conversions will be skipped.`);
    }
  }
  
  console.log(`Created ${createdProfiles.length} new affiliate profiles`);
  return createdProfiles;
}

async function addMissingConversions(missingConversions) {
  console.log('Adding missing conversions to database...');
  
  const addedConversions = [];
  let skippedCount = 0;
  
  // Process in batches to avoid overwhelming database
  for (let i = 0; i < missingConversions.length; i += 20) {
    const batch = missingConversions.slice(i, i + 20);
    console.log(`Processing batch ${Math.floor(i/20) + 1}/${Math.ceil(missingConversions.length/20)}...`);
    
    for (const conv of batch) {
      try {
        // Find affiliate profile
        const affiliateProfile = await prisma.affiliateProfile.findFirst({
          where: {
            user: { email: conv.affiliateEmail.toLowerCase() }
          }
        });
        
        if (!affiliateProfile) {
          console.log(`⚠️  Skipping ${conv.affiliateName} - no affiliate profile`);
          skippedCount++;
          continue;
        }
        
        // Create or find transaction
        let transaction = await prisma.transaction.findFirst({
          where: {
            amount: conv.orderAmount,
            createdAt: {
              gte: new Date(new Date(conv.orderDate).getTime() - 24*60*60*1000), // 1 day before
              lte: new Date(new Date(conv.orderDate).getTime() + 24*60*60*1000)  // 1 day after
            }
          }
        });
        
        if (!transaction) {
          // Create a transaction for this conversion
          transaction = await prisma.transaction.create({
            data: {
              userId: affiliateProfile.userId,
              amount: conv.orderAmount,
              status: 'SUCCESS',
              type: 'MEMBERSHIP_PURCHASE',
              createdAt: new Date(conv.orderDate)
            }
          });
        }
        
        // Check if conversion already exists for this transaction
        const existingConversion = await prisma.affiliateConversion.findFirst({
          where: {
            transactionId: transaction.id,
            affiliateId: affiliateProfile.id
          }
        });
        
        if (existingConversion) {
          console.log(`⚠️  Conversion already exists for ${conv.affiliateName}`);
          skippedCount++;
          continue;
        }
        
        // Create the conversion
        const newConversion = await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateProfile.id,
            transactionId: transaction.id,
            commissionAmount: conv.commission,
            commissionRate: 30, // Default rate
            createdAt: new Date(conv.orderDate)
          }
        });
        
        addedConversions.push({
          id: newConversion.id,
          affiliateName: conv.affiliateName,
          commission: conv.commission,
          orderDate: conv.orderDate
        });
        
        console.log(`✅ Added: ${conv.affiliateName} - Rp ${conv.commission.toLocaleString()}`);
        
      } catch (error) {
        console.log(`❌ Error adding conversion for ${conv.affiliateName}:`, error.message);
        skippedCount++;
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 RESULTS:`);
  console.log(`✅ Successfully added: ${addedConversions.length} conversions`);
  console.log(`⚠️  Skipped: ${skippedCount} conversions`);
  
  return addedConversions;
}

// Execute manual reconciliation
if (require.main === module) {
  executeManualReconciliation()
    .then(results => {
      console.log('\n🎉 MANUAL RECONCILIATION COMPLETED');
      console.log(`Accuracy improved from ${results.initialAccuracy.toFixed(2)}% to ${results.finalAccuracy.toFixed(2)}%`);
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { executeManualReconciliation };