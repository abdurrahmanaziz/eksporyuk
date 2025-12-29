const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditFullTransactionFlow() {
  console.log('📋 FULL TRANSACTION FLOW AUDIT REPORT\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Transaction Summary
    console.log('📊 TRANSACTION SUMMARY:\n');
    const totalTrans = await prisma.transaction.count();
    const successTrans = await prisma.transaction.count({
      where: { status: 'SUCCESS' }
    });
    const withAffiliateShare = await prisma.transaction.count({
      where: { affiliateShare: { gt: 0 } }
    });
    
    console.log('Total transactions:', totalTrans);
    console.log('Status SUCCESS:', successTrans);
    console.log('With affiliateShare > 0:', withAffiliateShare);
    
    // 2. Commission Conversions
    console.log('\n💳 COMMISSION CONVERSIONS:\n');
    const convCount = await prisma.affiliateConversion.count();
    console.log('AffiliateConversion records:', convCount);
    
    // 3. Wallet Summary
    console.log('\n💰 WALLET SUMMARY:\n');
    const walletsTotal = await prisma.wallet.count();
    const walletsWithEarnings = await prisma.wallet.count({
      where: { totalEarnings: { gt: 0 } }
    });
    const totalEarnings = await prisma.wallet.aggregate({
      _sum: { totalEarnings: true }
    });
    
    console.log('Total wallets:', walletsTotal);
    console.log('Wallets with earnings > 0:', walletsWithEarnings);
    console.log('Total earnings:', 'Rp' + Number(totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID'));
    
    // 4. Wallet Transactions (audit trail)
    console.log('\n📈 WALLET TRANSACTIONS (Audit Trail):\n');
    const wallTransCount = await prisma.walletTransaction.count();
    console.log('Total WalletTransaction records:', wallTransCount);
    
    if (wallTransCount > 0) {
      const recentWallTrans = await prisma.walletTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Recent wallet transactions:');
      recentWallTrans.forEach(wt => {
        console.log(`  - Type: ${wt.type} | Amount: Rp${Number(wt.amount).toLocaleString('id-ID')} | Ref: ${wt.reference || 'N/A'}`);
      });
    }
    
    // 5. Check: Transactions with affiliate share but no wallet transaction
    console.log('\n🔍 DATA CONSISTENCY CHECK:\n');
    
    // Get all transactions with affiliateShare
    const transWithShare = await prisma.transaction.findMany({
      where: { affiliateShare: { gt: 0 } },
      select: { id: true, amount: true, affiliateShare: true }
    });
    
    console.log('Transactions with affiliateShare:', transWithShare.length);
    
    // Check if these are in conversions
    const convTransIds = new Set(
      (await prisma.affiliateConversion.findMany({
        select: { transactionId: true }
      })).map(c => c.transactionId).filter(id => id)
    );
    
    const missing = transWithShare.filter(t => !convTransIds.has(t.id)).length;
    
    console.log('In AffiliateConversion:', transWithShare.length - missing);
    console.log('Missing from conversion:', missing);
    
    if (missing > 0) {
      console.log('\n❌ ISSUE: Transactions with affiliateShare tidak semua ter-record di conversion!');
    } else {
      console.log('\n✅ All transactions with affiliateShare are in conversions');
    }
    
    // 6. Check: affiliateProfile yang tidak punya earnings
    console.log('\n👥 AFFILIATE PROFILE CHECK:\n');
    const affProfiles = await prisma.affiliateProfile.count();
    const affWithEarnings = await prisma.affiliateProfile.count({
      where: { totalEarnings: { gt: 0 } }
    });
    
    console.log('Total AffiliateProfiles:', affProfiles);
    console.log('Profiles with earnings > 0:', affWithEarnings);
    
    if (affProfiles !== affWithEarnings) {
      console.log(`⚠️  ${affProfiles - affWithEarnings} profiles tanpa earnings`);
    }
    
    // 7. Alur Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ALUR TRANSAKSI STATUS:\n');
    
    const flowOK = 
      totalTrans > 0 &&
      successTrans > 0 &&
      convCount > 0 &&
      walletsWithEarnings > 0 &&
      missing === 0;
    
    if (flowOK) {
      console.log('STATUS: ✅ ALUR TRANSAKSI SUDAH BENAR\n');
      console.log('✓ Transactions recorded');
      console.log('✓ Commission conversions created');
      console.log('✓ Wallets synchronized');
      console.log('✓ Data consistent (no missing records)');
    } else {
      console.log('STATUS: ⚠️  ADA ISSUE DENGAN ALUR TRANSAKSI\n');
      if (totalTrans === 0) console.log('✗ Tidak ada transactions');
      if (convCount === 0) console.log('✗ Tidak ada conversion records');
      if (walletsWithEarnings === 0) console.log('✗ Wallets tidak ada earnings');
      if (missing > 0) console.log(`✗ ${missing} transactions tidak ter-record di conversion`);
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditFullTransactionFlow();
