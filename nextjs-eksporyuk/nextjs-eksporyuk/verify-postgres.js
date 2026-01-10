const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  console.log('📊 VERIFIKASI DATA DI POSTGRESQL (NEON):');
  console.log('═'.repeat(60));
  
  try {
    // Count transactions
    const totalTx = await prisma.transaction.count();
    console.log(`\nTotal Transactions: ${totalTx.toLocaleString('id-ID')}`);
    
    // Completed transactions
    const completedTx = await prisma.transaction.count({
      where: { status: 'SUCCESS' }
    });
    console.log(`Completed (SUCCESS): ${completedTx.toLocaleString('id-ID')}`);
    
    // Total Omset
    const omsetResult = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const totalOmset = Number(omsetResult._sum.amount) || 0;
    console.log(`Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
    
    // With affiliate
    const withAffTx = await prisma.transaction.count({
      where: { 
        status: 'SUCCESS',
        affiliateId: { not: null }
      }
    });
    console.log(`With Affiliate: ${withAffTx.toLocaleString('id-ID')}`);
    
    // Total Commission
    const komisiResult = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { affiliateShare: true }
    });
    const totalKomisi = Number(komisiResult._sum.affiliateShare) || 0;
    console.log(`Total Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
    
    console.log('\n═'.repeat(60));
    console.log('📊 PERBANDINGAN DENGAN SCREENSHOT:');
    console.log('═'.repeat(60));
    console.log(`                | Screenshot      | Database`);
    console.log(`   Total Lead   | 19,246          | ${totalTx.toLocaleString('id-ID')}`);
    console.log(`   Total Sales  | 12,839          | ${completedTx.toLocaleString('id-ID')}`);
    console.log(`   Total Omset  | Rp 4,122,334,962| Rp ${totalOmset.toLocaleString('id-ID')}`);
    console.log(`   Total Komisi | Rp 1,245,421,000| Rp ${totalKomisi.toLocaleString('id-ID')}`);
    
    // Calculate match percentage
    const omsetMatch = ((totalOmset / 4122334962) * 100).toFixed(2);
    const komisiMatch = ((totalKomisi / 1245421000) * 100).toFixed(2);
    
    console.log('\n🎯 AKURASI:');
    console.log(`   Omset Match: ${omsetMatch}%`);
    console.log(`   Komisi Match: ${komisiMatch}%`);
    
    if (omsetMatch > 99.9 && komisiMatch > 99.9) {
      console.log('\n✅ DATA 100% AKURAT!');
    } else if (omsetMatch > 95 && komisiMatch > 95) {
      console.log('\n⚠️ DATA > 95% AKURAT - Ada selisih kecil');
    } else {
      console.log('\n❌ DATA PERLU DICEK ULANG');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
  
  await prisma.$disconnect();
}

verify();
