const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const txs = await prisma.transaction.findMany({
    select: { id: true, invoiceNumber: true },
    orderBy: { id: 'asc' },
  });
  
  // Find transactions with non-standard format
  const weird = txs.filter(tx => {
    // Standard format: INV-XXXXX (5 digits)
    return !tx.invoiceNumber.match(/^INV-\d{5}$/);
  });
  
  console.log(`\n📊 Total transactions: ${txs.length}`);
  console.log(`⚠️  Non-standard invoices: ${weird.length}`);
  
  if (weird.length > 0) {
    console.log('\n🔴 Examples of weird invoices:');
    weird.slice(0, 30).forEach(tx => {
      console.log(`  ID: ${tx.id.substring(0, 12)}... → ${tx.invoiceNumber}`);
    });
    
    if (weird.length > 30) {
      console.log(`  ... and ${weird.length - 30} more`);
    }
  }
  
  await prisma.$disconnect();
})();
