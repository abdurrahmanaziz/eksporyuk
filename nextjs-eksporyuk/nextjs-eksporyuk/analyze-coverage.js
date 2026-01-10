const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function analyzeConversionCoverage() {
  console.log('🔍 Analyzing conversion coverage for Sejoli orders');
  console.log('====================================================\n');

  try {
    // Load Sejoli data
    const dataPath = path.join(process.cwd(), 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const sejoliData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Loaded Sejoli data: ${sejoliData.orders.length} orders`);

    // Get order IDs that exist in Sejoli
    const sejoliOrderIds = new Set(sejoliData.orders.map(o => o.ID));
    console.log(`Order ID range: ${Math.min(...sejoliOrderIds)} - ${Math.max(...sejoliOrderIds)}`);

    // Get all SUCCESS transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        reference: { startsWith: 'SEJOLI-' }
      }
    });

    console.log(`Found ${allTransactions.length} Sejoli transactions in database`);

    // Filter to only transactions that exist in Sejoli export
    const validTransactions = allTransactions.filter(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      return sejoliOrderIds.has(sejoliOrderId);
    });

    console.log(`${validTransactions.length} transactions exist in Sejoli export`);
    console.log(`${allTransactions.length - validTransactions.length} transactions missing from export`);

    // Get existing conversions
    const existingConversions = await prisma.affiliateConversion.findMany();
    const existingTransactionIds = new Set(existingConversions.map(c => c.transactionId));

    const validWithConversion = validTransactions.filter(tx => existingTransactionIds.has(tx.id));
    const validWithoutConversion = validTransactions.filter(tx => !existingTransactionIds.has(tx.id));

    console.log(`\n📊 VALID TRANSACTIONS (exist in Sejoli export):`);
    console.log(`✅ With conversion: ${validWithConversion.length}`);
    console.log(`❌ Without conversion: ${validWithoutConversion.length}`);
    console.log(`Coverage: ${((validWithConversion.length / validTransactions.length) * 100).toFixed(1)}%`);

    // Check what types of orders are missing conversions
    const orderMap = new Map(sejoliData.orders.map(o => [o.ID, o]));
    const affiliateMap = new Map(sejoliData.affiliates.map(a => [a.affiliate_code, a]));

    console.log(`\n🔍 ANALYZING MISSING CONVERSIONS (first 20):`);
    
    let withAffiliate = 0;
    let withoutAffiliate = 0;

    validWithoutConversion.slice(0, 20).forEach((tx, index) => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = orderMap.get(sejoliOrderId);
      
      if (order) {
        if (order.affiliate_id) {
          const affiliate = affiliateMap.get(order.affiliate_id);
          console.log(`${index + 1}. ${tx.invoiceNumber} - Product ${order.product_id} - Affiliate: ${affiliate?.name || order.affiliate_id}`);
          withAffiliate++;
        } else {
          console.log(`${index + 1}. ${tx.invoiceNumber} - Product ${order.product_id} - NO AFFILIATE`);
          withoutAffiliate++;
        }
      }
    });

    // Count all missing with/without affiliate
    validWithoutConversion.forEach(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = orderMap.get(sejoliOrderId);
      if (order?.affiliate_id) {
        withAffiliate++;
      } else {
        withoutAffiliate++;
      }
    });

    console.log(`\n📈 MISSING CONVERSION BREAKDOWN:`);
    console.log(`With affiliate: ${withAffiliate}`);
    console.log(`Without affiliate: ${withoutAffiliate}`);

    if (withAffiliate > 0) {
      console.log(`\n✅ We can create ${withAffiliate} more conversions from valid Sejoli data!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeConversionCoverage();