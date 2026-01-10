#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get count of all transactions by type
  const types = await prisma.transaction.groupBy({
    by: ['type'],
    _count: true,
  });

  console.log('📊 Transaction Types Distribution:');
  types.forEach(t => {
    console.log(`  ${t.type}: ${t._count}`);
  });

  // Check total transactions
  const total = await prisma.transaction.count();
  console.log(`\n✅ Total transactions: ${total}`);

  // Get total users
  const users = await prisma.user.count();
  console.log(`✅ Total users: ${users}`);

  // Get user memberships
  const memberships = await prisma.userMembership.count();
  console.log(`✅ Total user memberships: ${memberships}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
