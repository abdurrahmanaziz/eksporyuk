/**
 * Fix all invoice numbers in database to sequential format INV-XXXXX
 * This script:
 * 1. Gets all transactions without invoiceNumber
 * 2. Finds the highest existing invoice number
 * 3. Assigns sequential numbers starting from the next number
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function extractInvoiceNumber(invoiceStr) {
  if (!invoiceStr) return 0;
  
  // Try to extract number from various formats
  const formats = [
    /^INV-(\d+)$/, // INV-12906
    /^INV(\d+)$/, // INV12906
    /^INV-?(\d+)/, // INV-XXXXX or INVXXXXX
    /^(\d+)$/, // Just numbers
    /(\d+)/, // Any number
  ];
  
  for (const regex of formats) {
    const match = invoiceStr.match(regex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

async function fixInvoiceNumbers() {
  try {
    console.log('🔍 Fetching all transactions...');
    const allTransactions = await prisma.transaction.findMany({
      select: { id: true, invoiceNumber: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Total transactions: ${allTransactions.length}`);

    // Find highest invoice number
    let maxNumber = 0;
    const invoiceMap = new Map();

    for (const tx of allTransactions) {
      if (tx.invoiceNumber) {
        const num = extractInvoiceNumber(tx.invoiceNumber);
        if (num > maxNumber) maxNumber = num;
        invoiceMap.set(tx.id, num);
      }
    }

    console.log(`📈 Current highest invoice number: ${maxNumber}`);

    // Prepare updates
    const updates = [];
    let nextNumber = maxNumber + 1;
    const usedNumbers = new Set(invoiceMap.values());

    for (const tx of allTransactions) {
      if (!tx.invoiceNumber) {
        // Find next available number
        while (usedNumbers.has(nextNumber)) {
          nextNumber++;
        }
        
        const newInvoice = `INV-${String(nextNumber).padStart(5, '0')}`;
        updates.push({
          id: tx.id,
          invoiceNumber: newInvoice,
        });
        
        usedNumbers.add(nextNumber);
        nextNumber++;
      }
    }

    console.log(`\n📝 Updates to apply: ${updates.length}`);

    if (updates.length === 0) {
      console.log('✅ All invoices already have numbers!');
      await prisma.$disconnect();
      return;
    }

    // Apply updates
    let count = 0;
    console.log('\n🔄 Applying updates...');
    
    for (const update of updates) {
      await prisma.transaction.update({
        where: { id: update.id },
        data: { invoiceNumber: update.invoiceNumber },
      });
      
      count++;
      if (count % 10 === 0) {
        console.log(`  ✓ Updated ${count}/${updates.length}`);
      }
    }

    console.log(`\n✅ Success! Updated ${count} transactions`);
    console.log(`📊 Invoice range: INV-${String(maxNumber + 1).padStart(5, '0')} to INV-${String(nextNumber - 1).padStart(5, '0')}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvoiceNumbers();
