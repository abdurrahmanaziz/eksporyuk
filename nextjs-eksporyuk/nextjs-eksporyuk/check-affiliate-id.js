const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionAffiliateId() {
  console.log('🔍 CEK AFFILIATE ID DI TRANSACTIONS');
  console.log('==================================');

  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' }
  });
  
  const withAffiliateId = transactions.filter(t => t.affiliateId).length;
  const withoutAffiliateId = transactions.filter(t => !t.affiliateId).length;
  
  console.log('Total SUCCESS transactions:', transactions.length);
  console.log('With affiliateId:', withAffiliateId);  
  console.log('Without affiliateId:', withoutAffiliateId);
  
  // Sample transactions
  console.log('\nSample 5 transactions:');
  transactions.slice(0, 5).forEach((t, i) => {
    console.log(`${i+1}. ID: ${t.id} | Amount: ${t.amount} | AffiliateId: ${t.affiliateId || 'NULL'} | Reference: ${t.reference}`);
  });

  await prisma.$disconnect();
}

checkTransactionAffiliateId().catch(console.error);