import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sample = await prisma.transaction.findMany({
  where: { affiliateId: { not: null } },
  select: { id: true, externalId: true, metadata: true },
  take: 5
});

console.log('\n📋 Sample transactions with affiliate:\n');
sample.forEach(tx => {
  console.log(`ID: ${tx.id}`);
  console.log(`ExternalId: ${tx.externalId}`);
  console.log(`Metadata: ${JSON.stringify(tx.metadata)}\n`);
});

await prisma.$disconnect();
