const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function fillMissingAffiliateData() {
  console.log('🔄 Filling missing affiliate & commission data from Sejoli');
  console.log('==========================================================\n');

  try {
    // Load Sejoli data
    const dataPath = path.join(process.cwd(), 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const sejoliData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Loaded Sejoli data: ${sejoliData.orders.length} orders, ${sejoliData.affiliates.length} affiliates`);

    // Get transactions without affiliate conversions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        reference: { startsWith: 'SEJOLI-' }
      }
    });

    console.log(`Found ${allTransactions.length} SUCCESS Sejoli transactions`);

    // Get existing conversions
    const existingConversions = await prisma.affiliateConversion.findMany();
    const existingTransactionIds = new Set(existingConversions.map(c => c.transactionId));

    const transactionsWithoutConversion = allTransactions.filter(tx => 
      !existingTransactionIds.has(tx.id)
    );

    console.log(`${transactionsWithoutConversion.length} transactions missing affiliate conversion`);

    if (transactionsWithoutConversion.length === 0) {
      console.log('✅ All transactions already have affiliate conversions!');
      return;
    }

    // Commission mapping
    const COMMISSION_MAP = {
      179: 250000, 13401: 325000, 3840: 300000, 8683: 300000,
      8684: 250000, 1529: 300000, 6810: 300000, 16956: 300000,
      6068: 280000, 20852: 280000, 15234: 250000, 4684: 250000,
      11207: 250000, 17920: 250000, 19296: 250000, 93: 200000,
      28: 200000, 13399: 250000, 13400: 200000, 8910: 0,
      8914: 0, 8915: 0, 397: 100000, 488: 100000,
      12994: 100000, 13039: 100000, 13045: 100000, 16130: 100000,
      16860: 100000, 16963: 100000, 17227: 100000, 17322: 100000,
      17767: 100000, 18358: 100000, 18528: 20000, 18705: 100000,
      18893: 100000, 19042: 50000, 20130: 50000, 20336: 100000,
      21476: 50000, 5928: 150000, 5932: 150000, 5935: 150000,
      16581: 150000, 16587: 150000, 16592: 150000, 2910: 85000,
      3764: 85000, 4220: 85000, 8686: 85000, 300: 0, 16826: 0
    };

    // Build affiliate mapping
    const affiliateMap = new Map();
    sejoliData.affiliates.forEach(aff => {
      affiliateMap.set(aff.affiliate_code, aff);
    });

    // Build order mapping
    const orderMap = new Map();
    sejoliData.orders.forEach(order => {
      orderMap.set(order.ID, order);
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of transactionsWithoutConversion) {
      try {
        // Extract Sejoli order ID from reference (SEJOLI-19285 -> 19285)
        const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
        
        // Get Sejoli order
        const sejoliOrder = orderMap.get(sejoliOrderId);
        if (!sejoliOrder) {
          console.log(`⚠️ Sejoli order ${sejoliOrderId} not found`);
          skipped++;
          continue;
        }

        // Check if order has affiliate
        if (!sejoliOrder.affiliate_id) {
          skipped++;
          continue;
        }

        // Get affiliate data
        const affiliateData = affiliateMap.get(sejoliOrder.affiliate_id);
        if (!affiliateData) {
          console.log(`⚠️ Affiliate ${sejoliOrder.affiliate_id} not found`);
          skipped++;
          continue;
        }

        // Find user by email
        const user = await prisma.user.findFirst({
          where: {
            email: { equals: affiliateData.email, mode: 'insensitive' }
          }
        });

        if (!user) {
          console.log(`⚠️ User not found for affiliate email: ${affiliateData.email}`);
          skipped++;
          continue;
        }

        // Find affiliate profile
        const affiliateProfile = await prisma.affiliateProfile.findFirst({
          where: { userId: user.id }
        });

        if (!affiliateProfile) {
          console.log(`⚠️ No affiliate profile for user: ${affiliateData.name}`);
          skipped++;
          continue;
        }

        // Calculate commission
        const productId = sejoliOrder.product_id;
        const commission = COMMISSION_MAP[productId] || 0;
        
        if (commission === 0) {
          skipped++;
          continue;
        }

        const commissionRate = commission > 0 ? (commission / parseFloat(tx.amount)) * 100 : 0;

        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateProfile.id,
            transactionId: tx.id,
            commissionAmount: commission,
            commissionRate: commissionRate,
            paidOut: false
          }
        });

        console.log(`✅ ${tx.invoiceNumber} - ${affiliateData.name} - Rp ${commission.toLocaleString('id-ID')}`);
        created++;

      } catch (error) {
        console.log(`❌ Error processing tx ${tx.invoiceNumber}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Created: ${created} conversions`);
    console.log(`⚠️ Skipped: ${skipped} (no affiliate/commission)`);
    console.log(`❌ Errors: ${errors}`);

    // Final stats
    const totalConversions = await prisma.affiliateConversion.count();
    const totalTransactions = await prisma.transaction.count({ 
      where: { status: 'SUCCESS' } 
    });
    const coveragePercent = ((totalConversions / totalTransactions) * 100).toFixed(1);

    console.log(`\n📈 COVERAGE:`);
    console.log(`Total SUCCESS transactions: ${totalTransactions}`);
    console.log(`Total with affiliate conversion: ${totalConversions}`);
    console.log(`Coverage: ${coveragePercent}%`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillMissingAffiliateData();