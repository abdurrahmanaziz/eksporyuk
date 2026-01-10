const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditTransactionSystem() {
  console.log('🔍 AUDIT SISTEM TRANSAKSI & KOMISI');
  console.log('=====================================');

  // 1. Cek total transactions
  const totalTransactions = await prisma.transaction.count();
  console.log('📊 Total Transactions:', totalTransactions);

  // 2. Cek AffiliateConversion data
  const totalConversions = await prisma.affiliateConversion.count();
  console.log('📊 Total Affiliate Conversions:', totalConversions);

  // 3. Cek sample data AffiliateConversion
  const sampleConversions = await prisma.affiliateConversion.findMany({
    take: 5,
    include: {
      transaction: true,
      affiliate: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n📋 SAMPLE AFFILIATE CONVERSIONS:');
  sampleConversions.forEach((conv, i) => {
    console.log(`${i+1}. Product: ${conv.transaction?.sejolProductId || 'N/A'} | Commission: Rp ${conv.commissionAmount?.toLocaleString('id-ID') || '0'}`);
  });

  // 4. Cek total komisi
  const totalCommissionResult = await prisma.affiliateConversion.aggregate({
    _sum: {
      commissionAmount: true
    }
  });

  const totalCommission = totalCommissionResult._sum.commissionAmount || 0;
  console.log('\n💰 Total Commission Amount: Rp', totalCommission.toLocaleString('id-ID'));

  // 5. Cek transactions dengan external ID (data sejoli)
  const transactionsWithExternal = await prisma.transaction.findMany({
    where: {
      externalId: {
        not: null
      }
    },
    include: {
      affiliateConversion: true
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n📋 SAMPLE TRANSACTIONS WITH EXTERNAL ID (SEJOLI):');
  transactionsWithExternal.forEach((tx, i) => {
    console.log(`${i+1}. External ID: ${tx.externalId} | Amount: Rp ${tx.amount?.toString()} | Commission: Rp ${tx.affiliateConversion?.commissionAmount?.toString() || '0'}`);
  });

  // 6. Cek affiliate dengan komisi terbanyak
  const topAffiliates = await prisma.affiliateConversion.groupBy({
    by: ['affiliateId'],
    _sum: {
      commissionAmount: true
    },
    _count: true,
    orderBy: {
      _sum: {
        commissionAmount: 'desc'
      }
    },
    take: 5
  });

  console.log('\n🏆 TOP 5 AFFILIATES BY COMMISSION:');
  for (let i = 0; i < topAffiliates.length; i++) {
    const aff = topAffiliates[i];
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: aff.affiliateId },
      include: { user: true }
    });
    console.log(`${i+1}. ${affiliate?.user?.username || affiliate?.affiliateId} - Rp ${aff._sum.commissionAmount?.toLocaleString('id-ID')} (${aff._count} conversions)`);
  }

  await prisma.$disconnect();
}

auditTransactionSystem().catch(console.error);