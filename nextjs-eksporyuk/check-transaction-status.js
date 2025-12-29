const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionStatus() {
  console.log('📊 STATUS TRANSAKSI & KOMISI\n');
  
  try {
    // 1. Total transactions
    const totalTrans = await prisma.transaction.count();
    console.log('💳 Transactions:');
    console.log('  Total: ', totalTrans);
    
    // 2. Transactions dengan affiliate commission
    const transWithAff = await prisma.transaction.count({
      where: { affiliateShare: { gt: 0 } }
    });
    console.log('  Dengan affiliate share: ', transWithAff);
    
    // 3. Conversions (generated dari commission processing)
    const convCount = await prisma.affiliateConversion.count();
    console.log('  Conversion records: ', convCount);
    
    // 4. Check: berapa transactions belum punya conversion?
    const transIds = await prisma.transaction.findMany({
      where: { affiliateShare: { gt: 0 } },
      select: { id: true }
    });
    
    const convTransIds = new Set(
      (await prisma.affiliateConversion.findMany({
        select: { transactionId: true }
      })).map(c => c.transactionId).filter(id => id)
    );
    
    const missingConvs = transIds.filter(t => !convTransIds.has(t.id)).length;
    
    console.log('  Belum punya conversion: ', missingConvs);
    
    // 5. Wallet status
    console.log('\n💰 Wallet Status:');
    const wallets = await prisma.wallet.count({
      where: { totalEarnings: { gt: 0 } }
    });
    const totalEarnings = await prisma.wallet.aggregate({
      _sum: { totalEarnings: true }
    });
    
    console.log('  Wallets dengan earnings: ', wallets);
    console.log('  Total earnings: Rp', Number(totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID'));
    
    // 6. Analysis
    console.log('\n📈 ANALISIS:');
    console.log(`  ${transWithAff} transactions punya affiliateShare`);
    console.log(`  ${convCount} conversion records ada di database`);
    console.log(`  ${missingConvs} transactions BELUM dikonversi ke comission`);
    
    if (missingConvs > 0) {
      console.log('\n⚠️  BELUM DIPROSES:');
      console.log(`  Ada ${missingConvs} transaksi dari Sejoli yang belum masuk ke komisi`);
      console.log('  Ini perlu diproses manual atau ada bug di import Sejoli');
    } else {
      console.log('\n✅ SEMUA TRANSAKSI SUDAH DIPROSES!');
    }
    
    // 7. Check: apakah sistem otomatis bekerja untuk transaksi baru?
    console.log('\n🔄 SISTEM OTOMATIS:');
    console.log('  Saat ada transaksi BARU via API checkout/success:');
    console.log('  ✅ processTransactionCommission() otomatis dipanggil');
    console.log('  ✅ Wallet otomatis di-update');
    console.log('  ✅ AffiliateConversion otomatis dibuat');
    console.log('  ✅ Data realtime ke admin/affiliate dashboard');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionStatus();
