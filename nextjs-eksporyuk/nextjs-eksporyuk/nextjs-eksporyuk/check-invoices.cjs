const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking transactions and invoice numbers...\n');

  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      status: true,
      createdAt: true,
      user: {
        select: { email: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (transactions.length === 0) {
    console.log('No transactions found');
  } else {
    console.log(`Found ${transactions.length} recent transactions:\n`);
    transactions.forEach((t, idx) => {
      console.log(`${idx + 1}. Invoice: ${t.invoiceNumber || 'NULL'}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Amount: ${t.amount}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   User: ${t.user?.email} (${t.user?.name})`);
      console.log(`   Created: ${t.createdAt}\n`);
    });
  }

  // Check invoice number format
  console.log('\n=== Invoice Number Format Check ===');
  const invoices = transactions
    .map(t => t.invoiceNumber)
    .filter(inv => inv !== null);

  console.log(`Found ${invoices.length} transactions with invoices:`);
  invoices.forEach(inv => console.log(`  - ${inv}`));

  await prisma.$disconnect();
}

main().catch(console.error);
