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

    // Get order IDs that exist in Sejoli (note: using lowercase 'id' not 'ID')
    const sejoliOrderIds = new Set(sejoliData.orders.map(o => parseInt(o.id)));
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

    // Show some missing examples
    if (invalidTransactions.length > 0) {
      console.log(`Examples of missing order IDs (first 10):`);
      invalidTransactions.slice(0, 10).forEach((tx, i) => {
        const orderId = parseInt(tx.reference.replace('SEJOLI-', ''));
        console.log(`  ${i+1}. ${tx.invoiceNumber} → Sejoli Order ${orderId}`);
      });
      console.log();
    }

    // Get existing conversions (fix: remove include since no relations)
    const existingConversions = await prisma.affiliateConversion.findMany();
    const existingTransactionIds = new Set(existingConversions.map(c => c.transactionId));

    // Analyze valid transactions
    const validWithConversion = validTransactions.filter(tx => existingTransactionIds.has(tx.id));
    const validWithoutConversion = validTransactions.filter(tx => !existingTransactionIds.has(tx.id));

    console.log(`🎯 VALID TRANSACTIONS ANALYSIS:`);
    console.log(`With conversion: ${validWithConversion.length}`);
    console.log(`Without conversion: ${validWithoutConversion.length}`);
    console.log(`Valid coverage: ${validTransactions.length > 0 ? ((validWithConversion.length / validTransactions.length) * 100).toFixed(1) : 0}%\n`);

    // Check what types of orders are missing conversions
    const orderMap = new Map(sejoliData.orders.map(o => [parseInt(o.id), o]));
    const affiliateMap = new Map(sejoliData.affiliates.map(a => [a.affiliate_code, a]));

    let withAffiliate = 0;
    let withoutAffiliate = 0;
    let canCreateConversions = [];

    validWithoutConversion.forEach(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = orderMap.get(sejoliOrderId);
      
      if (order && order.affiliate_id && order.affiliate_id !== 0) {
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
    console.log(`Without affiliate (or affiliate_id = 0): ${withoutAffiliate}`);

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
    console.log(`Current total coverage: ${(existingConversions.length / allTransactions.length * 100).toFixed(1)}%`);
    console.log(`Maximum coverage with current data: ${((existingConversions.length + withAffiliate) / allTransactions.length * 100).toFixed(1)}%`);

    if (invalidTransactions.length > 0) {
      console.log(`\n⚠️  LIMITATION: ${invalidTransactions.length} transactions reference Sejoli orders not in export file`);
      console.log(`These require a more complete Sejoli export to achieve higher coverage.`);
    }

    // Show what we can improve
    const potentialImprovement = withAffiliate;
    const currentCoverage = (existingConversions.length / allTransactions.length * 100);
    const maxPossibleCoverage = ((existingConversions.length + withAffiliate) / allTransactions.length * 100);
    
    console.log(`\n🎯 ACTION PLAN:`);
    if (potentialImprovement > 0) {
      console.log(`✅ Can improve coverage by ${(maxPossibleCoverage - currentCoverage).toFixed(1)}% (${potentialImprovement} conversions)`);
      console.log(`Next step: Create script to add these ${potentialImprovement} missing conversions`);
    } else {
      console.log(`💯 Coverage is already maximized with current Sejoli export data`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeConversionCoverage();