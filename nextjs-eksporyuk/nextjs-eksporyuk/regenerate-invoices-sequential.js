/**
 * Regenerate ALL invoice numbers in sequential order by transaction date
 * Oldest transaction = INV-00001, newest follows sequentially
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function regenerateInvoicesSequential() {
  try {
    console.log('🔍 Fetching all transactions ordered by date...');
    
    const allTransactions = await prisma.transaction.findMany({
      select: { id: true, createdAt: true, invoiceNumber: true },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    console.log(`📊 Total transactions: ${allTransactions.length}`);

    if (allTransactions.length === 0) {
      console.log('⚠️  No transactions found');
      await prisma.$disconnect();
      return;
    }

    // Show date range
    const firstDate = allTransactions[0].createdAt;
    const lastDate = allTransactions[allTransactions.length - 1].createdAt;
    console.log(`📅 Date range: ${firstDate.toISOString()} → ${lastDate.toISOString()}`);

    // Prepare sequential updates
    const updates = [];
    
    for (let i = 0; i < allTransactions.length; i++) {
      const invoiceNum = String(i + 1).padStart(5, '0');
      const newInvoice = `INV-${invoiceNum}`;
      
      updates.push({
        id: allTransactions[i].id,
        oldInvoice: allTransactions[i].invoiceNumber,
        newInvoice: newInvoice,
      });
    }

    // Show sample
    console.log('\n📋 Sample conversions (first 5 and last 5):');
    console.log('FIRST:');
    updates.slice(0, 5).forEach(u => {
      console.log(`  ${u.oldInvoice} → ${u.newInvoice}`);
    });
    console.log('...');
    console.log('LAST:');
    updates.slice(-5).forEach(u => {
      console.log(`  ${u.oldInvoice} → ${u.newInvoice}`);
    });

    // Apply updates
    console.log(`\n🔄 Applying ${updates.length} updates...`);
    
    let count = 0;
    for (const update of updates) {
      await prisma.transaction.update({
        where: { id: update.id },
        data: { invoiceNumber: update.newInvoice },
      });
      
      count++;
      if (count % 500 === 0) {
        console.log(`  ✓ Updated ${count}/${updates.length}`);
      }
    }

    console.log(`\n✅ SUCCESS! All ${count} invoices regenerated in sequential order`);
    console.log(`✅ Range: INV-00001 to INV-${String(allTransactions.length).padStart(5, '0')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateInvoicesSequential();
