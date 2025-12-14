const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  // Check transactions with affiliateShare > 0
  const withComm = await prisma.transaction.count({
    where: { affiliateShare: { gt: 0 } }
  });
  console.log(`Transactions with affiliateShare > 0: ${withComm}`);
  
  // Check if affiliateShare is actually in the data
  const sample = await prisma.transaction.findFirst({
    where: { status: 'SUCCESS', affiliateId: { not: null } },
    select: { affiliateId: true, affiliateShare: true, metadata: true }
  });
  console.log('Sample transaction with affiliate:', sample);
  
  // Check total affiliateShare
  const total = await prisma.transaction.aggregate({
    _sum: { affiliateShare: true }
  });
  console.log('Total affiliateShare:', total._sum.affiliateShare);
  
  // Check how many have affiliateId
  const withAffId = await prisma.transaction.count({
    where: { affiliateId: { not: null } }
  });
  console.log(`Transactions with affiliateId: ${withAffId}`);
  
  await prisma.$disconnect();
}

debug();
