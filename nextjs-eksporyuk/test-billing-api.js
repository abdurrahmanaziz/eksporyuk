const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🧪 Testing billing API logic for mangikiwwdigital@gmail.com...');

async function testBillingLogic() {
  const user = await prisma.user.findUnique({
    where: { email: 'mangikiwwdigital@gmail.com' }
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('👤 Testing for user:', user.email);
  console.log('   User ID:', user.id);

  // Simulate the exact query used in /api/user/billing
  const where = {
    userId: user.id,
  };

  console.log('\n🔍 Query conditions:', JSON.stringify(where, null, 2));

  // Get transactions like the API does
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    }),
    prisma.transaction.count({ where })
  ]);

  console.log(`\n📊 API Query Results:`);
  console.log(`   Total count: ${total}`);
  console.log(`   Retrieved: ${transactions.length}`);

  if (transactions.length > 0) {
    console.log('\n💳 Transactions found by API logic:');
    transactions.forEach((tx, i) => {
      // Simulate the formatting logic from the API
      const metadata = typeof tx.metadata === 'object' && tx.metadata !== null 
        ? tx.metadata 
        : {};
      
      const membershipName = metadata.membershipType || metadata.membershipName || '';
      const itemName = tx.description || membershipName || `Transaksi ${tx.type}`;
      const finalAmount = Number(tx.amount);
      
      console.log(`  ${i+1}. [${tx.invoiceNumber}] ${itemName}`);
      console.log(`     Status: ${tx.status}`);
      console.log(`     Amount: Rp ${finalAmount.toLocaleString()}`);
      console.log(`     Type: ${tx.type}`);
      console.log(`     Created: ${tx.createdAt.toISOString()}`);
      console.log(`     Metadata: ${JSON.stringify(metadata)}`);
      console.log('');
    });
  } else {
    console.log('\n❌ No transactions found by API query!');
    console.log('⚠️  This means the billing API would return empty results');
  }

  await prisma.$disconnect();
}

testBillingLogic().catch(console.error);