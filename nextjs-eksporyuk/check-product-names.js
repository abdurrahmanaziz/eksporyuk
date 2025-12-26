#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking Transaction Product Names...\n');

  // Get sample transactions with all related data
  const transactions = await prisma.transaction.findMany({
    where: { type: 'PRODUCT' },
    select: {
      id: true,
      type: true,
      amount: true,
      metadata: true,
      createdAt: true,
    },
    take: 30,
  });

  if (transactions.length === 0) {
    console.log('❌ No PRODUCT transactions found');
    process.exit(1);
  }

  console.log(`✅ Found ${transactions.length} PRODUCT transactions\n`);

  console.log('📝 Sample Transactions (first 10):');
  transactions.slice(0, 10).forEach((tx, i) => {
    console.log(`\n${i + 1}. ID: ${tx.id.slice(0, 8)}... | Amount: Rp ${tx.amount}`);
    const metadata = tx.metadata;
    console.log(`   productName: ${metadata?.productName || 'N/A'}`);
    console.log(`   description: ${metadata?.description || 'N/A'}`);
    console.log(`   membershipName: ${metadata?.membershipName || 'N/A'}`);
    console.log(`   membershipTier: ${metadata?.membershipTier || 'N/A'}`);
  });

  // Analyze metadata keys
  const productNames = new Map();
  const descriptions = new Map();

  transactions.forEach(tx => {
    const metadata = tx.metadata;
    if (metadata?.productName) {
      productNames.set(metadata.productName, (productNames.get(metadata.productName) || 0) + 1);
    }
    if (metadata?.description) {
      descriptions.set(metadata.description, (descriptions.get(metadata.description) || 0) + 1);
    }
  });

  console.log('\n📊 Unique Product Names Found:');
  Array.from(productNames.entries()).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });

  console.log('\n📊 Unique Descriptions Found:');
  const sortedDesc = Array.from(descriptions.entries()).sort((a, b) => b[1] - a[1]);
  sortedDesc.slice(0, 15).forEach(([desc, count]) => {
    console.log(`  ${desc}: ${count}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
