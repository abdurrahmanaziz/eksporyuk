/**
 * Regenerate invoice numbers in sequential order by transaction ID
 * Oldest ID = INV-00001, newer IDs follow sequentially
 * This ensures consistent, predictable numbering
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function regenerateByIdOrder() {
  try {
    console.log('🔍 Fetching all transactions ordered by ID...');
    
    const allTransactions = await prisma.transaction.findMany({
      select: { id: true, invoiceNumber: true },
      orderBy: { id: 'asc' }, // Lexicographic order (ID order)
    });

    console.log(`📊 Total transactions: ${allTransactions.length}`);

    if (allTransactions.length === 0) {
      console.log('⚠️  No transactions found');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📋 Sample current invoice numbers (first 5):`);
    allTransactions.slice(0, 5).forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.invoiceNumber}`);
    });

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

    // Show what will change
    console.log('\n📋 New invoice assignments (first 5 and last 5):');
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
      if (count % 1000 === 0) {
        console.log(`  ✓ Updated ${count}/${updates.length}`);
      }
    }

    console.log(`\n✅ SUCCESS! All ${count} invoices regenerated in ID order`);
    console.log(`✅ Range: INV-00001 to INV-${String(allTransactions.length).padStart(5, '0')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateByIdOrder();
