const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCommissionReport() {
  console.log('💰 LAPORAN COMMISSION FINAL - EKSPORYUK');
  console.log('======================================');
  console.log(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`);
  console.log();

  // 1. Overview transactions
  const allTransactions = await prisma.transaction.findMany();
  const successTransactions = allTransactions.filter(t => t.status === 'SUCCESS');
  const totalOmset = successTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  console.log('📊 TRANSAKSI OVERVIEW:');
  console.log(`   Total semua transaksi: ${allTransactions.length.toLocaleString()}`);
  console.log(`   Success transaksi: ${successTransactions.length.toLocaleString()}`);
  console.log(`   Total omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log();

  // 2. Affiliate transactions
  const affiliateTransactions = successTransactions.filter(t => t.affiliateId);
  const nonAffiliateTransactions = successTransactions.filter(t => !t.affiliateId);
  
  console.log('🔗 TRANSAKSI AFFILIATE:');
  console.log(`   Dengan affiliate: ${affiliateTransactions.length.toLocaleString()}`);
  console.log(`   Tanpa affiliate: ${nonAffiliateTransactions.length.toLocaleString()}`);
  console.log();

  // 3. Commission data
  const allConversions = await prisma.affiliateConversion.findMany();
  const totalCommission = allConversions.reduce((sum, ac) => sum + parseFloat(ac.commissionAmount), 0);
  
  console.log('💵 COMMISSION DATA:');
  console.log(`   Total AffiliateConversions: ${allConversions.length.toLocaleString()}`);
  console.log(`   Total commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
  console.log();

  // 4. Comparison with targets
  const targetOmset = 4000000000; // 4 miliar
  const targetCommission = 1200000000; // 1.2 miliar
  
  const omsetGap = targetOmset - totalOmset;
  const commissionGap = targetCommission - totalCommission;
  
  console.log('🎯 TARGET vs ACTUAL:');
  console.log(`   Target Omset: Rp ${targetOmset.toLocaleString('id-ID')}`);
  console.log(`   Actual Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`   Gap Omset: Rp ${omsetGap.toLocaleString('id-ID')} (${((omsetGap/targetOmset)*100).toFixed(1)}%)`);
  console.log();
  console.log(`   Target Commission: Rp ${targetCommission.toLocaleString('id-ID')}`);
  console.log(`   Actual Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
  console.log(`   Gap Commission: Rp ${commissionGap.toLocaleString('id-ID')} (${((commissionGap/targetCommission)*100).toFixed(1)}%)`);
  console.log();

  // 5. Top affiliate commissions (sample)
  const topConversions = await prisma.affiliateConversion.findMany({
    include: {
      affiliate: {
        include: {
          user: { select: { name: true, email: true } }
        }
      },
      transaction: { select: { amount: true } }
    },
    orderBy: { commissionAmount: 'desc' },
    take: 5
  });
  
  console.log('🏆 TOP 5 COMMISSION CONVERSIONS:');
  topConversions.forEach((conv, i) => {
    console.log(`   ${i+1}. ${conv.affiliate.user.name} - Rp ${parseFloat(conv.commissionAmount).toLocaleString('id-ID')} (dari transaksi Rp ${parseFloat(conv.transaction.amount).toLocaleString('id-ID')})`);
  });
  console.log();

  // 6. Status assessment
  const omsetAccuracy = ((totalOmset / targetOmset) * 100);
  const commissionAccuracy = ((totalCommission / targetCommission) * 100);
  
  console.log('✅ STATUS MIGRASI:');
  console.log(`   Akurasi Omset: ${omsetAccuracy.toFixed(1)}%`);
  console.log(`   Akurasi Commission: ${commissionAccuracy.toFixed(1)}%`);
  
  if (commissionAccuracy >= 90) {
    console.log('   🎉 EXCELLENT: Commission data 90%+ akurat!');
  } else if (commissionAccuracy >= 80) {
    console.log('   ✅ GOOD: Commission data 80%+ akurat');
  } else {
    console.log('   ⚠️ NEEDS IMPROVEMENT: Commission masih kurang dari 80%');
  }

  await prisma.$disconnect();
}

finalCommissionReport().catch(console.error);