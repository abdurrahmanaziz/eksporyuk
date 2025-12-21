/**
 * ANALYZE INVOICE - CEK DUPLIKAT DAN SEQUENCE
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeInvoices() {
  console.log('\n=== ANALISIS INVOICE NUMBER ===\n');
  
  try {
    // 1. Cek invoice number patterns
    const allInvoices = await prisma.transaction.findMany({
      select: { invoiceNumber: true, type: true, createdAt: true },
      orderBy: { invoiceNumber: 'desc' }
    });
    
    console.log('Total transaksi:', allInvoices.length);
    
    // Group by prefix
    const prefixes = {};
    allInvoices.forEach(t => {
      const inv = t.invoiceNumber || 'NULL';
      // Extract prefix (first few chars)
      let prefix = inv.match(/^[A-Z\-]+/);
      prefix = prefix ? prefix[0] : 'OTHER';
      if (!prefixes[prefix]) prefixes[prefix] = [];
      prefixes[prefix].push(inv);
    });
    
    console.log('\n=== INVOICE BY PREFIX ===');
    Object.keys(prefixes).sort().forEach(p => {
      console.log(p + ': ' + prefixes[p].length + ' records');
      // Show sample
      console.log('  Sample: ' + prefixes[p].slice(0, 3).join(', '));
    });
    
    // 2. Check for duplicates
    const invCounts = {};
    allInvoices.forEach(t => {
      const inv = t.invoiceNumber;
      if (inv) {
        invCounts[inv] = (invCounts[inv] || 0) + 1;
      }
    });
    
    const duplicates = Object.entries(invCounts).filter(([k, v]) => v > 1);
    console.log('\n=== DUPLIKAT ===');
    console.log('Total invoice duplikat:', duplicates.length);
    if (duplicates.length > 0) {
      console.log('Contoh duplikat:');
      duplicates.slice(0, 20).forEach(([inv, count]) => {
        console.log('  ' + inv + ': ' + count + 'x');
      });
    }
    
    // 3. Check INV range (simple INVxxxxx format)
    const invNumbers = allInvoices
      .map(t => t.invoiceNumber)
      .filter(i => i && i.startsWith('INV') && !i.includes('-'))
      .map(i => parseInt(i.replace('INV', '')))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);
    
    console.log('\n=== INV NUMBER RANGE ===');
    if (invNumbers.length > 0) {
      console.log('Tertinggi:', 'INV' + invNumbers[0]);
      console.log('Terendah:', 'INV' + invNumbers[invNumbers.length - 1]);
      console.log('Total INV:', invNumbers.length);
      console.log('Sample tertinggi:', invNumbers.slice(0, 10).map(n => 'INV' + n).join(', '));
    } else {
      console.log('Tidak ada INV number format INVxxxxx');
    }
    
    // 4. Check gaps in sequence
    console.log('\n=== CEK GAPS ===');
    const uniqueNums = [...new Set(invNumbers)].sort((a, b) => a - b);
    let gaps = [];
    let totalGap = 0;
    for (let i = 1; i < uniqueNums.length; i++) {
      const diff = uniqueNums[i] - uniqueNums[i-1];
      if (diff > 1) {
        totalGap += (diff - 1);
        if (gaps.length < 10) {
          gaps.push({ from: uniqueNums[i-1], to: uniqueNums[i], gap: diff - 1 });
        }
      }
    }
    
    if (gaps.length > 0) {
      console.log('Ada gaps di sequence, contoh:');
      gaps.forEach(g => {
        console.log('  INV' + g.from + ' -> INV' + g.to + ' (gap: ' + g.gap + ')');
      });
      console.log('Total gaps:', totalGap);
    } else {
      console.log('Tidak ada gaps');
    }
    
    // 5. Rekomendasi
    console.log('\n=== REKOMENDASI ===');
    if (invNumbers.length > 0) {
      const maxInv = invNumbers[0];
      console.log('1. Invoice tertinggi saat ini: INV' + maxInv);
      console.log('2. Invoice baru harus mulai dari: INV' + (maxInv + 1));
      console.log('3. Gaps adalah NORMAL setelah cleanup, tidak perlu diisi');
      console.log('4. Yang penting: tidak ada DUPLIKAT');
    }
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyzeInvoices()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
