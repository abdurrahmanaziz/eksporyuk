const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function analyzeConversionCoverage() {
  console.log('🔍 ANALYZING CONVERSION COVERAGE FOR SEJOLI ORDERS');
  console.log('==========================================================\n');

  try {
    // Load Sejoli data
    const dataPath = path.join(process.cwd(), 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const sejoliData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`📋 SEJOLI EXPORT DATA:`);
    console.log(`Orders: ${sejoliData.orders.length}`);
    console.log(`Affiliates: ${sejoliData.affiliates.length}`);

    // Get order IDs that exist in Sejoli
    const sejoliOrderIds = new Set(sejoliData.orders.map(o => parseInt(o.ID)));
    const minOrderId = Math.min(...Array.from(sejoliOrderIds));
    const maxOrderId = Math.max(...Array.from(sejoliOrderIds));
    console.log(`Order ID range: ${minOrderId} - ${maxOrderId}\n`);

    // Get all SUCCESS transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        reference: { startsWith: 'SEJOLI-' }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`📊 DATABASE TRANSACTIONS:`);
    console.log(`Total SUCCESS Sejoli transactions: ${allTransactions.length}`);

    // Check which transactions exist in Sejoli export
    const validTransactions = [];
    const invalidTransactions = [];

    allTransactions.forEach(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      if (sejoliOrderIds.has(sejoliOrderId)) {
        validTransactions.push(tx);
      } else {
        invalidTransactions.push(tx);
      }
    });

    console.log(`✅ Exist in Sejoli export: ${validTransactions.length}`);
    console.log(`❌ Missing from export: ${invalidTransactions.length}\n`);

    // Get existing conversions
    const existingConversions = await prisma.affiliateConversion.findMany({
      include: { transaction: true }
    });
    
    const existingTransactionIds = new Set(existingConversions.map(c => c.transactionId));

    // Analyze valid transactions
    const validWithConversion = validTransactions.filter(tx => existingTransactionIds.has(tx.id));
    const validWithoutConversion = validTransactions.filter(tx => !existingTransactionIds.has(tx.id));

    console.log(`🎯 VALID TRANSACTIONS ANALYSIS:`);
    console.log(`With conversion: ${validWithConversion.length}`);
    console.log(`Without conversion: ${validWithoutConversion.length}`);
    console.log(`Valid coverage: ${validTransactions.length > 0 ? ((validWithConversion.length / validTransactions.length) * 100).toFixed(1) : 0}%\n`);

    // Check what types of orders are missing conversions
    const orderMap = new Map(sejoliData.orders.map(o => [parseInt(o.ID), o]));
    const affiliateMap = new Map(sejoliData.affiliates.map(a => [a.affiliate_code, a]));

    let withAffiliate = 0;
    let withoutAffiliate = 0;
    let canCreateConversions = [];

    validWithoutConversion.forEach(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = orderMap.get(sejoliOrderId);
      
      if (order && order.affiliate_id) {
        const affiliate = affiliateMap.get(order.affiliate_id);
        if (affiliate) {
          withAffiliate++;
          canCreateConversions.push({
            transaction: tx,
            order: order,
            affiliate: affiliate
          });
        }
      } else {
        withoutAffiliate++;
      }
    });

    console.log(`🔍 MISSING CONVERSIONS BREAKDOWN:`);
    console.log(`With valid affiliate: ${withAffiliate}`);
    console.log(`Without affiliate: ${withoutAffiliate}`);

    if (withAffiliate > 0) {
      console.log(`\n✅ CAN CREATE ${withAffiliate} MORE CONVERSIONS!\n`);
      
      console.log(`📝 Sample conversions that can be created (first 10):`);
      canCreateConversions.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.transaction.invoiceNumber} - ${item.affiliate.name} - Product ${item.order.product_id}`);
      });
    } else {
      console.log(`\n❌ No additional conversions can be created from current Sejoli data.`);
    }

    console.log(`\n📈 OVERALL COVERAGE STATUS:`);
    console.log(`Current conversions: ${existingConversions.length}`);
    console.log(`Possible new conversions: ${withAffiliate}`);
    console.log(`Maximum possible conversions: ${existingConversions.length + withAffiliate}`);
    console.log(`Maximum coverage with current data: ${((existingConversions.length + withAffiliate) / allTransactions.length * 100).toFixed(1)}%`);

    if (invalidTransactions.length > 0) {
      console.log(`\n⚠️  LIMITATION: ${invalidTransactions.length} transactions reference Sejoli orders not in export file`);
      console.log(`These require a more complete Sejoli export to achieve higher coverage.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeConversionCoverage();