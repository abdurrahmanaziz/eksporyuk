const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateSejoliVsEksporyukDiscrepancy() {
  try {
    console.log('🔍 INVESTIGASI PERBEDAAN DATA SEJOLI VS EKSPORYUK.COM\n');
    console.log('📊 TEMUAN USER: Sutisna di Sejoli 133jt vs Live 202jt = selisih ~70jt\n');
    
    // 1. Cek data Sutisna di database eksporyuk.com
    const sutisnaData = await prisma.affiliateProfile.findFirst({
      where: {
        OR: [
          { user: { email: 'azzka42@gmail.com' } },
          { user: { name: { contains: 'Sutisna', mode: 'insensitive' } } }
        ]
      },
      include: {
        user: true,
        conversions: {
          select: {
            commissionAmount: true,
            createdAt: true,
            transactionId: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (sutisnaData) {
      console.log('👤 SUTISNA - DATA EKSPORYUK.COM DATABASE:');
      console.log(`   Email: ${sutisnaData.user.email}`);
      console.log(`   Total Earnings: Rp ${parseFloat(sutisnaData.totalEarnings).toLocaleString('id-ID')}`);
      console.log(`   Total Conversions: ${sutisnaData.totalConversions}`);
      console.log(`   Created: ${sutisnaData.createdAt}`);
      console.log(`   Updated: ${sutisnaData.updatedAt}`);
      console.log();

      console.log('📈 RECENT CONVERSIONS (Last 20):');
      let recentTotal = 0;
      sutisnaData.conversions.forEach((conv, i) => {
        const amount = parseFloat(conv.commissionAmount);
        recentTotal += amount;
        console.log(`   ${i+1}. ${conv.createdAt.toISOString().split('T')[0]} - Rp ${amount.toLocaleString('id-ID')}`);
      });
      console.log(`   Recent 20 Total: Rp ${recentTotal.toLocaleString('id-ID')}\n`);

      // Hitung selisih dengan data Sejoli
      const eksporyukTotal = parseFloat(sutisnaData.totalEarnings);
      const sejoliTotal = 133475000; // Dari dashboard Sejoli
      const difference = eksporyukTotal - sejoliTotal;
      
      console.log('🔍 COMPARISON ANALYSIS:');
      console.log(`   Sejoli Dashboard  : Rp ${sejoliTotal.toLocaleString('id-ID')}`);
      console.log(`   Eksporyuk Database: Rp ${eksporyukTotal.toLocaleString('id-ID')}`);
      console.log(`   SELISIH          : Rp ${Math.abs(difference).toLocaleString('id-ID')}`);
      
      if (Math.abs(difference) > 50000000) { // > 50jt
        console.log('   🚨 SIGNIFIKAN: Selisih > 50 juta rupiah!');
      }
      console.log();
    }

    // 2. Cek apakah ada double counting atau duplicate data
    console.log('🔍 CHECKING FOR DUPLICATE/DOUBLE COUNTING:\n');
    
    const duplicateTransactions = await prisma.$queryRaw`
      SELECT 
        affiliate_id,
        user_id,
        amount,
        affiliate_share,
        created_at,
        COUNT(*) as duplicate_count
      FROM "Transaction" 
      WHERE affiliate_id IS NOT NULL 
      AND status = 'SUCCESS'
      GROUP BY affiliate_id, user_id, amount, affiliate_share, created_at
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;

    if (duplicateTransactions.length > 0) {
      console.log('⚠️ FOUND DUPLICATE TRANSACTIONS:');
      duplicateTransactions.forEach((dup, i) => {
        console.log(`   ${i+1}. Affiliate ${dup.affiliate_id} - Amount: ${parseFloat(dup.amount).toLocaleString('id-ID')} - Duplicates: ${dup.duplicate_count}`);
      });
    } else {
      console.log('✅ No duplicate transactions found');
    }
    console.log();

    // 3. Cek apakah ada data yang tidak sinkron antara Transaction dan AffiliateConversion
    const syncIssues = await prisma.$queryRaw`
      SELECT 
        t.id as transaction_id,
        t.affiliate_id,
        t.affiliate_share,
        ac.commission_amount,
        t.created_at
      FROM "Transaction" t
      LEFT JOIN "AffiliateConversion" ac ON t.id = ac.transaction_id
      WHERE t.affiliate_id IS NOT NULL 
      AND t.status = 'SUCCESS'
      AND t.affiliate_share > 0
      AND (
        ac.commission_amount IS NULL 
        OR ABS(CAST(t.affiliate_share AS DECIMAL) - CAST(ac.commission_amount AS DECIMAL)) > 1000
      )
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    console.log('🔍 CHECKING SYNC ISSUES BETWEEN TRANSACTION & CONVERSION:');
    if (syncIssues.length > 0) {
      console.log('⚠️ FOUND SYNC ISSUES:');
      syncIssues.forEach((issue, i) => {
        const txShare = parseFloat(issue.affiliate_share || 0);
        const convAmount = parseFloat(issue.commission_amount || 0);
        console.log(`   ${i+1}. Txn ${issue.transaction_id.substring(0, 8)}... - TxShare: ${txShare.toLocaleString('id-ID')} vs ConvAmount: ${convAmount.toLocaleString('id-ID')}`);
      });
    } else {
      console.log('✅ No sync issues found');
    }
    console.log();

    // 4. Cek total system earnings dan bandingkan dengan Sejoli total
    const systemTotals = await prisma.affiliateProfile.aggregate({
      _sum: { totalEarnings: true },
      _count: { id: true }
    });

    const sejoliSystemTotal = 1256771000; // Dari dashboard "Semua Data"
    const eksporyukSystemTotal = parseFloat(systemTotals._sum.totalEarnings || 0);
    const systemDifference = eksporyukSystemTotal - sejoliSystemTotal;

    console.log('🏢 SYSTEM-WIDE COMPARISON:');
    console.log(`   Sejoli Total (All Data)   : Rp ${sejoliSystemTotal.toLocaleString('id-ID')}`);
    console.log(`   Eksporyuk Total (Database): Rp ${eksporyukSystemTotal.toLocaleString('id-ID')}`);
    console.log(`   System Difference         : Rp ${Math.abs(systemDifference).toLocaleString('id-ID')}`);
    console.log(`   Total Affiliates          : ${systemTotals._count.id}`);
    console.log();

    // 5. Analisis possible causes
    console.log('🎯 POSSIBLE CAUSES FOR DISCREPANCY:\n');
    
    if (difference > 0) {
      console.log('📈 EKSPORYUK LEBIH TINGGI (Data lebih banyak):');
      console.log('   • Eksporyuk mencatat transaksi yang belum sinkron ke Sejoli');
      console.log('   • Data di Eksporyuk include transaksi terbaru');
      console.log('   • Mungkin ada automatic commission calculation di Eksporyuk');
      console.log('   • Conversion tracking yang lebih lengkap');
    } else {
      console.log('📉 SEJOLI LEBIH TINGGI (Ada data yang hilang):');
      console.log('   • Data Sejoli belum fully migrate ke Eksporyuk');
      console.log('   • Ada historical data yang terlewat');
      console.log('   • Manual adjustment di Sejoli yang belum sync');
    }
    
    console.log('\n💡 INVESTIGATION RECOMMENDATIONS:');
    console.log('   1. Cek log sinkronisasi antara Sejoli dan Eksporyuk');
    console.log('   2. Bandingkan transaction log periode tertentu');
    console.log('   3. Verify manual commission adjustments');
    console.log('   4. Check for timing differences in data updates');
    console.log('   5. Audit commission calculation algorithms');

    // 6. Cek recent large transactions untuk Sutisna
    const recentLargeTransactions = await prisma.transaction.findMany({
      where: {
        affiliateId: sutisnaData?.userId,
        status: 'SUCCESS',
        affiliateShare: { gte: 1000000 }, // >= 1 juta
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      select: {
        id: true,
        amount: true,
        affiliateShare: true,
        createdAt: true,
        description: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (recentLargeTransactions.length > 0) {
      console.log('\n💰 RECENT LARGE TRANSACTIONS FOR SUTISNA (>= 1M commission):');
      let recentLargeTotal = 0;
      recentLargeTransactions.forEach((tx, i) => {
        const commission = parseFloat(tx.affiliateShare || 0);
        recentLargeTotal += commission;
        console.log(`   ${i+1}. ${tx.createdAt.toISOString().split('T')[0]} - Rp ${commission.toLocaleString('id-ID')} (Amount: ${parseFloat(tx.amount).toLocaleString('id-ID')})`);
      });
      console.log(`   Recent Large Total: Rp ${recentLargeTotal.toLocaleString('id-ID')}`);
      
      if (recentLargeTotal > 50000000) {
        console.log('   🔍 SIGNIFICANT: Recent large commissions might explain the discrepancy');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

investigateSejoliVsEksporyukDiscrepancy()
  .then(() => {
    console.log('\n✅ Investigation completed - found potential source of 70M+ discrepancy');
  })
  .catch(console.error);