const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Get MEMBERSHIP/PRODUCT type transactions only (not commission)
  const realInvoices = await prisma.transaction.findMany({
    where: {
      invoiceNumber: { startsWith: 'INV' },
      type: { in: ['MEMBERSHIP', 'PRODUCT'] }
    },
    select: { invoiceNumber: true },
    orderBy: { invoiceNumber: 'desc' }
  });
  
  const nums = realInvoices
    .map(t => parseInt(t.invoiceNumber.replace('INV', '')))
    .filter(n => n > 0)
    .sort((a, b) => b - a);
  
  console.log('=== INVOICE REAL (MEMBERSHIP/PRODUCT) ===');
  console.log('Total:', nums.length);
  console.log('Tertinggi:', 'INV' + nums[0]);
  console.log('Top 10:', nums.slice(0, 10).map(n => 'INV' + n).join(', '));
  
  // Check commission invoices
  const comInvoices = await prisma.transaction.findMany({
    where: { type: 'COMMISSION' },
    select: { invoiceNumber: true }
  });
  
  console.log('\n=== COMMISSION INVOICES ===');
  console.log('Total:', comInvoices.length);
  comInvoices.slice(0, 10).forEach(t => {
    console.log('  ' + t.invoiceNumber);
  });
  
  await prisma.$disconnect();
}
check();
