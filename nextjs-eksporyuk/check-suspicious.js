const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Cek transaksi dengan invoice tinggi yang mencurigakan
  const suspicious = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { in: ['INV81253', 'INV57745', 'INV52464', 'INV47227'] }
    },
    include: {
      user: { select: { name: true, email: true } }
    }
  });
  
  console.log('=== INVOICE TINGGI MENCURIGAKAN ===');
  suspicious.forEach(t => {
    console.log('\n' + t.invoiceNumber + ':');
    console.log('  Type:', t.type);
    console.log('  Amount:', Number(t.amount).toLocaleString());
    console.log('  User:', t.user?.name || t.user?.email || '-');
    console.log('  Created:', t.createdAt);
    console.log('  Metadata:', JSON.stringify(t.metadata));
  });
  
  // Cek invoice range normal
  const normalRange = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { startsWith: 'INV' },
      type: { in: ['MEMBERSHIP', 'PRODUCT'] }
    },
    select: { invoiceNumber: true }
  });
  
  const nums = normalRange
    .map(t => parseInt(t.invoiceNumber.replace('INV', '')))
    .filter(n => n > 0 && n < 20000)  // Filter < 20000
    .sort((a, b) => b - a);
  
  console.log('\n=== INVOICE NORMAL (< 20000) ===');
  console.log('Total:', nums.length);
  console.log('Tertinggi:', 'INV' + nums[0]);
  
  await prisma.$disconnect();
}
check();
