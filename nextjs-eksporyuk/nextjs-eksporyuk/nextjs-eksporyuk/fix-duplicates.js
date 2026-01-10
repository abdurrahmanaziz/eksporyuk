const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  // Get all conversions
  const conversions = await prisma.affiliateConversion.findMany({
    select: { id: true, transactionId: true }
  });
  
  console.log('Total conversions:', conversions.length);
  
  // Group by transactionId
  const byTxId = new Map();
  conversions.forEach(c => {
    if (!byTxId.has(c.transactionId)) {
      byTxId.set(c.transactionId, []);
    }
    byTxId.get(c.transactionId).push(c.id);
  });
  
  // Find duplicates
  let duplicateCount = 0;
  const idsToDelete = [];
  
  for (const [txId, ids] of byTxId) {
    if (ids.length > 1) {
      duplicateCount++;
      // Keep first, delete rest
      idsToDelete.push(...ids.slice(1));
    }
  }
  
  console.log('Unique transactions with conversions:', byTxId.size);
  console.log('Transactions with duplicates:', duplicateCount);
  console.log('Conversions to delete:', idsToDelete.length);
  
  if (idsToDelete.length > 0) {
    const deleted = await prisma.affiliateConversion.deleteMany({
      where: { id: { in: idsToDelete } }
    });
    console.log('Deleted:', deleted.count);
  }
  
  // Final count
  const finalCount = await prisma.affiliateConversion.count();
  console.log('Final conversion count:', finalCount);
  
  await prisma.$disconnect();
}
checkDuplicates();
