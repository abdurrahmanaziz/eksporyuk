#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking Membership Transaction Metadata...\n');

  // Get membership transactions with metadata
  const membershipTx = await prisma.transaction.findMany({
    where: { type: 'MEMBERSHIP' },
    select: {
      id: true,
      type: true,
      amount: true,
      status: true,
      metadata: true,
      createdAt: true,
    },
    take: 20,
  });

  if (membershipTx.length === 0) {
    console.log('❌ No membership transactions found');
    process.exit(1);
  }

  console.log(`✅ Found ${membershipTx.length} membership transactions\n`);

  // Analyze metadata structure
  const metadataKeys = new Set();
  membershipTx.forEach(tx => {
    if (tx.metadata && typeof tx.metadata === 'object') {
      Object.keys(tx.metadata).forEach(key => metadataKeys.add(key));
    }
  });

  console.log('📋 Metadata Keys Found:');
  Array.from(metadataKeys).forEach(key => console.log(`  - ${key}`));

  console.log('\n📝 Sample Transactions (first 5):');
  membershipTx.slice(0, 5).forEach((tx, i) => {
    console.log(`\n${i + 1}. ID: ${tx.id.slice(0, 8)}... | Amount: Rp ${tx.amount}`);
    console.log(`   Metadata:`, JSON.stringify(tx.metadata, null, 2));
  });

  // Count by duration if available
  const membershipTierCounts = {};
  const membershipDurationCounts = {};

  membershipTx.forEach(tx => {
    const tier = tx.metadata?.membershipTier;
    const duration = tx.metadata?.membershipDuration || tx.metadata?.duration;
    
    if (tier) {
      membershipTierCounts[tier] = (membershipTierCounts[tier] || 0) + 1;
    }
    if (duration) {
      membershipDurationCounts[duration] = (membershipDurationCounts[duration] || 0) + 1;
    }
  });

  console.log('\n📊 Distribution by membershipTier:');
  Object.entries(membershipTierCounts).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });

  console.log('\n📊 Distribution by membershipDuration:');
  Object.entries(membershipDurationCounts).forEach(([duration, count]) => {
    console.log(`  ${duration}: ${count}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
