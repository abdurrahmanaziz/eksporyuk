const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check affiliateConversion records
  const convCount = await prisma.affiliateConversion.count();
  
  // Check transactions with affiliateId
  const txWithAff = await prisma.transaction.count({
    where: { affiliateId: { not: null } }
  });
  
  // Sample transaction with affiliateId
  const sampleTx = await prisma.transaction.findFirst({
    where: { 
      affiliateId: { not: null },
      reference: { startsWith: 'SEJOLI-' }
    },
    include: {
      affiliateConversion: true
    }
  });
  
  console.log('📊 Affiliate Data Status:');
  console.log('   Transactions with affiliateId:', txWithAff);
  console.log('   AffiliateConversion records:', convCount);
  console.log('');
  console.log('📋 Sample transaction:');
  console.log('   ID:', sampleTx?.id);
  console.log('   Reference:', sampleTx?.reference);
  console.log('   affiliateId:', sampleTx?.affiliateId);
  console.log('   Has affiliateConversion:', !!sampleTx?.affiliateConversion);
  
  await prisma.$disconnect();
}

main().catch(console.error);
