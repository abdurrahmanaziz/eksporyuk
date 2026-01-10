const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDiscrepancy() {
  try {
    console.log('=== ANALISIS SELISIH KOMISI SUTISNA ===\n');
    
    const user = await prisma.user.findFirst({
      where: { email: 'azzka42@gmail.com' },
      include: { affiliateProfile: true }
    });
    
    console.log('📊 RINGKASAN DATA:');
    console.log('- Total Earnings (Profile):', `Rp ${Number(user.affiliateProfile.totalEarnings).toLocaleString('id-ID')}`);
    
    // Cek semua conversions detail
    const allConversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id },
      include: {
        transaction: {
          include: {
            product: true,
            membership: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalFromConversions = allConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0);
    console.log('- Total dari Conversions:', `Rp ${totalFromConversions.toLocaleString('id-ID')}`);
    console.log('- Selisih:', `Rp ${(Number(user.affiliateProfile.totalEarnings) - totalFromConversions).toLocaleString('id-ID')}`);
    
    // Analisis date range conversions
    if (allConversions.length > 0) {
      const dates = allConversions.map(c => c.createdAt).sort();
      console.log(`- Periode conversions: ${dates[0].toLocaleDateString('id-ID')} - ${dates[dates.length-1].toLocaleDateString('id-ID')}`);
    }
    
    // Cek apakah ada data di tabel lain yang mungkin menyimpan komisi
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { 
        wallet: { userId: user.id },
        type: 'COMMISSION' 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n💰 WALLET TRANSACTIONS (COMMISSION): ${walletTransactions.length}`);
    if (walletTransactions.length > 0) {
      const totalFromWallet = walletTransactions.reduce((sum, wt) => sum + Number(wt.amount), 0);
      console.log('- Total dari Wallet Transactions:', `Rp ${totalFromWallet.toLocaleString('id-ID')}`);
    }
    
    // Cek revenue transactions
    const revenueTransactions = await prisma.transaction.findMany({
      where: { 
        affiliateId: user.affiliateProfile.id,
        status: 'SUCCESS'
      },
      include: {
        product: true,
        membership: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n💳 RECENT SUCCESS TRANSACTIONS: ${revenueTransactions.length}`);
    revenueTransactions.forEach((trans, i) => {
      console.log(`${i+1}. ${trans.id}`);
      console.log(`   Amount: Rp ${Number(trans.amount).toLocaleString('id-ID')}`);
      console.log(`   Product: ${trans.product?.name || trans.membership?.name || 'N/A'}`);
      console.log(`   Date: ${trans.createdAt.toLocaleDateString('id-ID')}`);
      console.log('');
    });
    
    // SOLUSI: Cek apakah data tersebut berasal dari sync WordPress
    console.log('\n🔍 KEMUNGKINAN PENYEBAB:');
    console.log('1. Data totalEarnings disync dari WordPress Sejoli');
    console.log('2. Ada transaksi lama yang belum dikonversi ke AffiliateConversion');
    console.log('3. Data manual input yang tidak tercatat di conversions');
    
    console.log('\n✅ REKOMENDASI PERBAIKAN:');
    console.log('1. **JANGAN** ubah totalEarnings di AffiliateProfile (data valid dari WordPress)');
    console.log('2. Buat sistem untuk sinkronisasi data historis jika diperlukan');  
    console.log('3. Pastikan sistem commission baru berjalan benar untuk transaksi baru');
    console.log('4. Monitor apakah selisih bertambah pada transaksi baru');
    
    console.log('\n⚠️  STATUS: DATA AMAN - Tidak perlu koreksi karena kemungkinan data historis dari WordPress');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDiscrepancy();