/**
 * Migration Script: Update Invoice Numbers
 * 
 * Purpose:
 * - Set invoiceNumber for transactions that don't have one
 * - Standardize old format invoices (INV-CREDIT-xxx) to new format (INV01, INV02, etc)
 * - Maintain chronological order based on createdAt
 * 
 * Run: node migrate-invoice-numbers.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateInvoiceNumbers() {
  console.log('🔄 Starting Invoice Number Migration...\n');

  try {
    // 1. Get all transactions ordered by creation date
    const allTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        amount: true,
        createdAt: true
      }
    });

    console.log(`📊 Total transactions found: ${allTransactions.length}\n`);

    // 2. Assign invoice numbers sequentially
    let updateCount = 0;
    let skipCount = 0;

    for (let i = 0; i < allTransactions.length; i++) {
      const tx = allTransactions[i];
      const newInvoiceNumber = `INV${String(i + 1).padStart(2, '0')}`;

      // Check if needs update (no invoice or old format)
      const needsUpdate = 
        !tx.invoiceNumber || 
        !tx.invoiceNumber.match(/^INV\d{2,}$/);

      if (needsUpdate) {
        try {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { invoiceNumber: newInvoiceNumber }
          });

          console.log(`✅ Updated: ${tx.id.slice(0, 8)}... | ${tx.invoiceNumber || 'NULL'} → ${newInvoiceNumber} | ${tx.type}`);
          updateCount++;
        } catch (error) {
          console.error(`❌ Failed to update ${tx.id}:`, error.message);
        }
      } else {
        console.log(`⏭️  Skipped: ${tx.id.slice(0, 8)}... | Already has standard format: ${tx.invoiceNumber}`);
        skipCount++;
      }
    }

    console.log(`\n✨ Migration Complete!`);
    console.log(`   - Updated: ${updateCount} transactions`);
    console.log(`   - Skipped: ${skipCount} transactions`);
    console.log(`   - Total: ${allTransactions.length} transactions\n`);

    // 3. Verify results
    console.log('🔍 Verifying migration...\n');

    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        invoiceNumber: {
          not: null
        }
      },
      select: {
        invoiceNumber: true,
        type: true,
        amount: true
      },
      orderBy: {
        invoiceNumber: 'asc'
      },
      take: 10
    });

    console.log('📋 First 10 transactions after migration:');
    updatedTransactions.forEach(tx => {
      console.log(`   ${tx.invoiceNumber} | ${tx.type} | Rp ${Number(tx.amount).toLocaleString('id-ID')}`);
    });

    // Check for duplicates
    const allInvoices = await prisma.transaction.groupBy({
      by: ['invoiceNumber'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      },
      where: {
        invoiceNumber: {
          not: null
        }
      }
    });

    if (allInvoices.length > 0) {
      console.log('\n⚠️  WARNING: Duplicate invoice numbers found:');
      allInvoices.forEach(dup => {
        console.log(`   ${dup.invoiceNumber}: ${dup._count.id} occurrences`);
      });
    } else {
      console.log('\n✅ No duplicate invoice numbers found!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateInvoiceNumbers()
  .then(() => {
    console.log('\n🎉 Invoice number migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
