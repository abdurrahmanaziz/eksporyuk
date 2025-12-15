import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMetadata() {
  const tx = await prisma.transaction.findFirst({
    where: { status: 'SUCCESS' }
  });
  
  console.log('Sample transaction:');
  console.log('ID:', tx.id);
  console.log('Status:', tx.status);
  console.log('Metadata:', JSON.stringify(tx.metadata, null, 2));
  
  await prisma.$disconnect();
}

checkMetadata();
