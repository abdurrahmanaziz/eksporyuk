const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function checkMissingConversions() {
  console.log('🔍 CHECKING 859 MISSING CONVERSIONS IN DETAIL');
  console.log('===============================================\n');

  try {
    // Load Sejoli data
    const dataPath = path.join(process.cwd(), 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const sejoliData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Create maps for quick lookup
    const orderMap = new Map(sejoliData.orders.map(o => [parseInt(o.id), o]));
    const affiliateMap = new Map(sejoliData.affiliates.map(a => [a.affiliate_code, a]));

    // Get transactions that exist in Sejoli but don't have conversions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        reference: { startsWith: 'SEJOLI-' }
      }
    });

    const existingConversions = await prisma.affiliateConversion.findMany();
    const existingTransactionIds = new Set(existingConversions.map(c => c.transactionId));

    const validTransactions = allTransactions.filter(tx => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      return orderMap.has(sejoliOrderId);
    });

    const missingConversions = validTransactions.filter(tx => !existingTransactionIds.has(tx.id));

    console.log(`Found ${missingConversions.length} transactions without conversions\n`);

    let hasAffiliate = 0;
    let noAffiliate = 0;
    let affiliateNotFound = 0;
    let canCreate = [];

    console.log(`📝 DETAILED ANALYSIS (showing all):\n`);

    missingConversions.forEach((tx, index) => {
      const sejoliOrderId = parseInt(tx.reference.replace('SEJOLI-', ''));
      const order = orderMap.get(sejoliOrderId);
      
      if (order) {
        if (order.affiliate_id && order.affiliate_id !== 0) {
          const affiliate = affiliateMap.get(order.affiliate_id);
          if (affiliate) {
            hasAffiliate++;
            canCreate.push({ tx, order, affiliate });
            console.log(`✅ ${index + 1}. ${tx.invoiceNumber} - Order ${sejoliOrderId} - Affiliate: ${affiliate.name} (${order.affiliate_id})`);
          } else {
            affiliateNotFound++;
            console.log(`❓ ${index + 1}. ${tx.invoiceNumber} - Order ${sejoliOrderId} - Affiliate ID ${order.affiliate_id} NOT FOUND in export`);
          }
        } else {
          noAffiliate++;
          console.log(`❌ ${index + 1}. ${tx.invoiceNumber} - Order ${sejoliOrderId} - NO AFFILIATE (affiliate_id = ${order.affiliate_id})`);
        }
      } else {
        console.log(`🚫 ${index + 1}. ${tx.invoiceNumber} - Order ${sejoliOrderId} NOT FOUND IN SEJOLI`);
      }
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Can create conversions: ${hasAffiliate}`);
    console.log(`❌ No affiliate (affiliate_id = 0): ${noAffiliate}`);
    console.log(`❓ Affiliate not found in export: ${affiliateNotFound}`);

    if (hasAffiliate > 0) {
      console.log(`\n🎯 READY TO CREATE ${hasAffiliate} CONVERSIONS!`);
      console.log(`These represent valid affiliate sales that are missing conversion records.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingConversions();