import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tx = await prisma.transaction.findFirst({
  where: { status: 'SUCCESS' }
});

console.log('Sample transaction metadata:');
console.log(JSON.stringify(tx.metadata, null, 2));

await prisma.$disconnect();
