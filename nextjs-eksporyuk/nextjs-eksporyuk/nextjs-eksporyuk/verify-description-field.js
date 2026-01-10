#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking Transaction Description Field...\n');

  // Get sample transactions to verify description exists
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
    },
    take: 15,
  });

  if (transactions.length === 0) {
    console.log('❌ No transactions found');
    process.exit(1);
  }

  console.log(`✅ Found ${transactions.length} sample transactions\n`);

  console.log('📝 Transactions with Description:');
  let withDesc = 0;
  transactions.forEach((tx, i) => {
    console.log(`${i + 1}. Type: ${tx.type.padEnd(10)} | Amount: Rp ${String(tx.amount).padEnd(10)} | Description: ${tx.description || '(empty)'}`);
    if (tx.description) withDesc++;
  });

  console.log(`\n✅ ${withDesc}/${transactions.length} transactions have description`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
