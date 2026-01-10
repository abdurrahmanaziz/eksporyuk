/**
 * CLEANUP INVOICE ISSUES
 * - Hapus INV10000 duplikat (sisakan 1)
 * - Fix COM-INV format menjadi COM-
 * - Fix tanpa prefix menjadi INV prefix
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('\n=== CLEANUP INVOICE ISSUES ===\n');
  
  try {
    // ========================================
    // 1. HAPUS INV10000 DUPLIKAT (SISAKAN 1 TERTUA)
    // ========================================
    console.log('1. CLEANUP INV10000 DUPLIKAT...');
    
    const inv10000 = await prisma.transaction.findMany({
      where: { invoiceNumber: 'INV10000' },
      orderBy: { createdAt: 'asc' }, // Tertua dulu
      select: { id: true, type: true, amount: true, createdAt: true }
    });
    
    console.log('   Total INV10000:', inv10000.length);
    
    if (inv10000.length > 1) {
      // Simpan yang pertama (tertua), hapus sisanya
      const toKeep = inv10000[0];
      const toDelete = inv10000.slice(1).map(t => t.id);
      
      console.log('   Akan disimpan:', toKeep.id);
      console.log('   Akan dihapus:', toDelete.length, 'records');
      
      // Hapus duplikat
      const deleted = await prisma.transaction.deleteMany({
        where: { id: { in: toDelete } }
      });
      console.log('   ✅ Dihapus:', deleted.count);
    } else {
      console.log('   ✅ Tidak ada duplikat');
    }
    
    // ========================================
    // 2. FIX COM-INV FORMAT
    // ========================================
    console.log('\n2. FIX COM-INV FORMAT...');
    
    const comInv = await prisma.transaction.findMany({
      where: { invoiceNumber: { startsWith: 'COM-INV' } },
      select: { id: true, invoiceNumber: true }
    });
    
    console.log('   Total COM-INV:', comInv.length);
    
    for (const t of comInv) {
      // COM-INV57745 -> COM-57745
      const newInvoice = t.invoiceNumber.replace('COM-INV', 'COM-');
      await prisma.transaction.update({
        where: { id: t.id },
        data: { invoiceNumber: newInvoice }
      });
      console.log('   ✅ ' + t.invoiceNumber + ' -> ' + newInvoice);
    }
    
    // ========================================
    // 3. FIX TANPA PREFIX (jadi INV)
    // ========================================
    console.log('\n3. FIX TANPA PREFIX...');
    
    const noPrefix = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { not: null },
        NOT: [
          { invoiceNumber: { startsWith: 'INV' } },
          { invoiceNumber: { startsWith: 'COM' } }
        ]
      },
      select: { id: true, invoiceNumber: true }
    });
    
    console.log('   Total tanpa prefix:', noPrefix.length);
    
    // Filter yang pure numeric
    const numericOnly = noPrefix.filter(t => /^\d+$/.test(t.invoiceNumber));
    console.log('   Yang numeric:', numericOnly.length);
    
    for (const t of numericOnly) {
      const newInvoice = 'INV' + t.invoiceNumber;
      await prisma.transaction.update({
        where: { id: t.id },
        data: { invoiceNumber: newInvoice }
      });
      console.log('   ✅ ' + t.invoiceNumber + ' -> ' + newInvoice);
    }
    
    // ========================================
    // 4. VERIFIKASI
    // ========================================
    console.log('\n=== VERIFIKASI AKHIR ===');
    
    // Cek duplikat
    const allInv = await prisma.transaction.findMany({
      select: { invoiceNumber: true }
    });
    
    const counts = {};
    allInv.forEach(t => {
      if (t.invoiceNumber) {
        counts[t.invoiceNumber] = (counts[t.invoiceNumber] || 0) + 1;
      }
    });
    
    const stillDuplicate = Object.entries(counts).filter(([k, v]) => v > 1);
    console.log('Masih duplikat:', stillDuplicate.length);
    
    if (stillDuplicate.length > 0) {
      console.log('Contoh:');
      stillDuplicate.slice(0, 5).forEach(([inv, count]) => {
        console.log('  ' + inv + ': ' + count + 'x');
      });
    }
    
    // Cek invoice tertinggi
    const invNumbers = allInv
      .map(t => t.invoiceNumber)
      .filter(i => i && i.startsWith('INV') && !i.includes('-'))
      .map(i => parseInt(i.replace('INV', '')))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);
    
    if (invNumbers.length > 0) {
      console.log('Invoice tertinggi sekarang: INV' + invNumbers[0]);
      console.log('Invoice baru mulai dari: INV' + (invNumbers[0] + 1));
    }
    
    console.log('\n✅ CLEANUP SELESAI');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
