const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Cek INV9999 dan INV10001
  const invoices = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { in: ['INV9999', 'INV10001', 'INV10000'] }
    },
    include: {
      user: { select: { name: true, email: true } }
    },
    orderBy: { invoiceNumber: 'asc' }
  });
  
  console.log('=== CEK INV9999, INV10000, INV10001 ===\n');
  
  for (const tx of invoices) {
    console.log(tx.invoiceNumber + ':');
    console.log('  ID:', tx.id);
    console.log('  Type:', tx.type);
    console.log('  Amount:', 'Rp', Number(tx.amount).toLocaleString());
    console.log('  User:', tx.user?.name || tx.user?.email || '-');
    console.log('  Status:', tx.status);
    console.log('  Created:', tx.createdAt);
    console.log('  Metadata:', JSON.stringify(tx.metadata, null, 2));
    
    // Cek affiliate conversion
    const conv = await prisma.affiliateConversion.findFirst({
      where: { transactionId: tx.id },
      include: {
        affiliate: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });
    
    if (conv) {
      console.log('  === AFFILIATE DATA ===');
      console.log('  Affiliate:', conv.affiliate.user?.name || conv.affiliate.user?.email);
      console.log('  Commission Amount:', 'Rp', Number(conv.commissionAmount).toLocaleString());
      console.log('  Commission Rate:', Number(conv.commissionRate));
    } else {
      console.log('  === AFFILIATE: TIDAK ADA ===');
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}
check();
