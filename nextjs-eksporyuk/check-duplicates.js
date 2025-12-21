/**
 * CHECK AND REMOVE DUPLICATE TRANSACTIONS
 * - Find duplicates based on sejoliOrderId in metadata
 * - Keep the MySQL import (more accurate), remove API import duplicates
 * - DO NOT DELETE DATABASE
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 CHECKING FOR DUPLICATE TRANSACTIONS');
  console.log('='.repeat(60));
  
  // Get all Sejoli transactions
  const allTx = await prisma.transaction.findMany({
    where: { paymentProvider: 'SEJOLI' },
    select: { 
      id: true, 
      externalId: true, 
      amount: true, 
      status: true, 
      metadata: true, 
      customerEmail: true,
      createdAt: true
    }
  });
  
  console.log('Total Sejoli transactions:', allTx.length);
  
  // Group by sejoliOrderId in metadata
  const orderIdMap = new Map();
  let noOrderId = 0;
  
  allTx.forEach(tx => {
    const orderId = tx.metadata?.sejoliOrderId;
    if (orderId === undefined || orderId === null) {
      noOrderId++;
      return;
    }
    
    if (!orderIdMap.has(orderId)) {
      orderIdMap.set(orderId, []);
    }
    orderIdMap.get(orderId).push(tx);
  });
  
  console.log('Transactions without sejoliOrderId:', noOrderId);
  console.log('Unique sejoliOrderIds:', orderIdMap.size);
  
  // Find duplicates (same sejoliOrderId, multiple records)
  const duplicates = [];
  for (const [orderId, txs] of orderIdMap.entries()) {
    if (txs.length > 1) {
      duplicates.push({ orderId, transactions: txs });
    }
  }
  
  console.log('\n⚠️  Duplicate sejoliOrderIds:', duplicates.length);
  
  if (duplicates.length === 0) {
    console.log('\n✅ No duplicates found! Database is clean.');
    await prisma.$disconnect();
    return;
  }
  
  // Show sample duplicates
  console.log('\nSample duplicates (first 10):');
  duplicates.slice(0, 10).forEach((dup, i) => {
    console.log(`\n${i+1}. Sejoli Order #${dup.orderId}:`);
    dup.transactions.forEach(tx => {
      const source = tx.externalId.includes('mysql') ? 'MySQL' : 'API';
      console.log(`   - [${source}] ${tx.externalId} | ${tx.status} | Rp ${tx.amount.toLocaleString()}`);
    });
  });
  
  // Calculate records to remove
  // Strategy: Keep MySQL import (more accurate), remove API import
  const toRemove = [];
  
  duplicates.forEach(dup => {
    // Sort: MySQL first, then API
    dup.transactions.sort((a, b) => {
      const aMySQL = a.externalId.includes('mysql') ? 0 : 1;
      const bMySQL = b.externalId.includes('mysql') ? 0 : 1;
      return aMySQL - bMySQL;
    });
    
    // Keep first (MySQL), mark rest for removal
    for (let i = 1; i < dup.transactions.length; i++) {
      toRemove.push(dup.transactions[i].id);
    }
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`   Total transactions: ${allTx.length}`);
  console.log(`   Duplicate groups: ${duplicates.length}`);
  console.log(`   Records to remove: ${toRemove.length}`);
  console.log(`   Expected after cleanup: ${allTx.length - toRemove.length}`);
  
  // ExternalId pattern breakdown
  const apiCount = allTx.filter(t => t.externalId?.startsWith('sejoli-') && !t.externalId?.includes('mysql')).length;
  const mysqlCount = allTx.filter(t => t.externalId?.includes('mysql')).length;
  console.log('\n📋 ExternalId patterns:');
  console.log(`   sejoli- (API import): ${apiCount}`);
  console.log(`   sejoli-mysql- (MySQL import): ${mysqlCount}`);
  
  // Ask for confirmation before removing
  if (toRemove.length > 0) {
    console.log('\n🗑️  REMOVING DUPLICATES...');
    console.log(`   Removing ${toRemove.length} duplicate records (keeping MySQL imports)...`);
    
    // Delete ALL at once (faster)
    const result = await prisma.transaction.deleteMany({
      where: { id: { in: toRemove } }
    });
    
    console.log(`   ✅ Removed: ${result.count} records`);
    
    // Verify
    const finalCount = await prisma.transaction.count({ where: { paymentProvider: 'SEJOLI' } });
    console.log(`\n🔍 FINAL VERIFICATION:`);
    console.log(`   Transactions before: ${allTx.length}`);
    console.log(`   Transactions after: ${finalCount}`);
    console.log(`   Removed: ${allTx.length - finalCount}`);
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
