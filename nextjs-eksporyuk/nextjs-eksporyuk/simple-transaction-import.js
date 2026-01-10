#!/usr/bin/env node
/**
 * SIMPLE TRANSACTION IMPORT - Individual creates
 * Bypass prisma createMany issues
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

async function simpleTransactionImport() {
  console.log('💳 SIMPLE TRANSACTION IMPORT');
  console.log('=' .repeat(40));
  
  const startTime = Date.now();

  try {
    // Parse data
    console.log('📂 Reading orders data...');
    const ordersData = readTSV('orders_export.tsv').slice(1); // Skip header
    console.log(`   ${ordersData.length} orders from Sejoli\n`);

    // Get existing data
    console.log('🔍 Loading users and product...');
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const userMap = new Map();
    users.forEach(u => userMap.set(u.email.toLowerCase(), u.id));
    
    const product = await prisma.product.findFirst({
      where: { slug: 'sejoli-import' }
    });
    
    console.log(`   ${users.length} users loaded`);
    console.log(`   Product: ${product.name}\n`);

    // Import transactions individually
    console.log('💳 Importing transactions individually...');
    let imported = 0;
    let skipped = 0;
    
    for (let i = 0; i < Math.min(ordersData.length, 100); i++) { // Start with first 100
      const [orderId, createdAt, productId, productName, userId, userEmail, affiliateId, grandTotal, status] = ordersData[i];
      
      if (status !== 'completed') {
        skipped++;
        continue;
      }
      
      const buyerId = userMap.get(userEmail?.toLowerCase()) || users[0].id;
      const transactionId = `sejoli-tx-${orderId}`;
      
      // Validasi tanggal
      let transactionDate = new Date('2022-01-01');
      if (createdAt && createdAt.trim()) {
        const testDate = new Date(createdAt);
        if (!isNaN(testDate.getTime())) {
          transactionDate = testDate;
        }
      }
      
      try {
        await prisma.transaction.create({
          data: {
            id: transactionId,
            externalId: `sejoli-${orderId}`,
            userId: buyerId,
            type: 'PRODUCT',
            productId: product.id,
            amount: Math.max(0, parseFloat(grandTotal) || 0),
            status: 'SUCCESS',
            paymentMethod: 'manual',
            description: `Imported from Sejoli - ${productName || 'Product'}`,
            createdAt: transactionDate,
            updatedAt: transactionDate,
          }
        });
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`   ✅ ${imported} transactions imported...`);
        }
      } catch (error) {
        if (error.code !== 'P2002') { // Skip duplicate key errors
          console.error(`   ❌ Error importing transaction ${orderId}:`, error.message);
        }
        skipped++;
      }
    }
    
    console.log(`\n✅ Transaction import test completed:`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    
    console.log('\n💡 If this works, run full import with all', ordersData.length, 'orders');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code) console.error('   Code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTransactionImport();