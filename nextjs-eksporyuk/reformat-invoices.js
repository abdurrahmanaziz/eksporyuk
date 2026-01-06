/**
 * Reformat all invoice numbers to standard INV-XXXXX format
 * This script converts:
 * - 22073843665 → INV-22073
 * - INV6389551678 → INV-63895
 * - 1M617767967563 → INV-61776
 * - Any other format to standard INV-XXXXX
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function extractAndFormatInvoice(invoiceStr) {
  if (!invoiceStr) return null;

  // Extract numeric part
  const numMatch = invoiceStr.match(/\d+/);
  if (!numMatch) return invoiceStr; // Keep original if no numbers

  const fullNumber = numMatch[0];
  
  // For very long numbers (>5 digits), take last 5 digits
  // For short numbers, pad with zeros
  let numericPart;
  if (fullNumber.length > 5) {
    numericPart = fullNumber.slice(-5); // Take last 5 digits
  } else {
    numericPart = fullNumber.padStart(5, '0');
  }

  return `INV-${numericPart}`;
}

async function reformatInvoices() {
  try {
    console.log('🔍 Fetching all transactions...');
    const allTransactions = await prisma.transaction.findMany({
      select: { id: true, invoiceNumber: true },
    });

    console.log(`📊 Total transactions: ${allTransactions.length}`);

    // Prepare updates for non-standard formats
    const updates = [];
    const beforeAfter = [];

    for (const tx of allTransactions) {
      if (tx.invoiceNumber) {
        const formatted = extractAndFormatInvoice(tx.invoiceNumber);
        
        // Check if needs reformatting
        if (formatted !== tx.invoiceNumber && !tx.invoiceNumber.match(/^INV-\d{5}$/)) {
          updates.push({
            id: tx.id,
            oldInvoice: tx.invoiceNumber,
            newInvoice: formatted,
          });
          
          if (beforeAfter.length < 10) {
            beforeAfter.push(`  ${tx.invoiceNumber} → ${formatted}`);
          }
        }
      }
    }

    console.log(`\n📝 Updates needed: ${updates.length}`);
    
    if (beforeAfter.length > 0) {
      console.log('\nSample conversions:');
      beforeAfter.forEach(str => console.log(str));
    }

    if (updates.length === 0) {
      console.log('✅ All invoices already in standard format!');
      await prisma.$disconnect();
      return;
    }

    // Apply updates
    let count = 0;
    const checkUnique = new Set();
    
    console.log('\n🔄 Applying updates...');
    
    for (const update of updates) {
      // Check for duplicates
      if (checkUnique.has(update.newInvoice)) {
        console.log(`  ⚠️  Skipping ${update.oldInvoice} (duplicate target: ${update.newInvoice})`);
        continue;
      }
      
      try {
        await prisma.transaction.update({
          where: { id: update.id },
          data: { invoiceNumber: update.newInvoice },
        });
        
        checkUnique.add(update.newInvoice);
        count++;
        
        if (count % 50 === 0) {
          console.log(`  ✓ Updated ${count}/${updates.length}`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          console.log(`  ⚠️  Duplicate constraint for ${update.newInvoice}, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Success! Reformatted ${count} invoices to standard format INV-XXXXX`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reformatInvoices();
