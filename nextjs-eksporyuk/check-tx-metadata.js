const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get sample transactions with affiliate conversion
  const txs = await prisma.transaction.findMany({
    where: { 
      id: { 
        in: await prisma.affiliateConversion.findMany({ take: 5, select: { transactionId: true } }).then(r => r.map(x => x.transactionId))
      } 
    },
    select: { id: true, metadata: true, customerName: true, customerEmail: true }
  });
  
  console.log('Sample transactions linked to AffiliateConversion:');
  for (const tx of txs) {
    console.log(`\nTX: ${tx.id}`);
    console.log(`  Customer: ${tx.customerName} (${tx.customerEmail})`);
    if (tx.metadata) {
      console.log(`  Metadata: ${JSON.stringify(tx.metadata)}`);
    }
  }
  
  // Check if there's affiliate info in metadata
  const sampleMeta = await prisma.$queryRaw`
    SELECT id, metadata FROM "Transaction" 
    WHERE metadata IS NOT NULL 
    AND metadata::text LIKE '%affiliate%'
    LIMIT 5
  `;
  console.log('\n\nTransactions with "affiliate" in metadata:');
  for (const s of sampleMeta) {
    console.log(`TX ${s.id}: ${JSON.stringify(s.metadata)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
