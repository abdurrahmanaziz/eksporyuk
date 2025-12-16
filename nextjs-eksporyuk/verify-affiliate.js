const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 VERIFIKASI FINAL - AFFILIATE DATA');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Affiliate stats
  const totalAffiliates = await prisma.affiliateProfile.count();
  const activeAffiliates = await prisma.affiliateProfile.count({
    where: { totalConversions: { gt: 0 } }
  });
  
  // Commission stats
  const totalConversions = await prisma.affiliateConversion.count();
  const commissionSum = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  // Wallet stats
  const walletSum = await prisma.wallet.aggregate({
    _sum: { balance: true }
  });
  
  // Profile stats
  const profileSum = await prisma.affiliateProfile.aggregate({
    _sum: { totalEarnings: true, totalSales: true }
  });
  
  console.log('👥 AFFILIATE SUMMARY:');
  console.log('  Total Affiliate Profiles:', totalAffiliates.toLocaleString('id-ID'));
  console.log('  Affiliates with Sales:', activeAffiliates.toLocaleString('id-ID'));
  console.log('');
  
  console.log('💰 COMMISSION SUMMARY:');
  console.log('  Total Conversions:', totalConversions.toLocaleString('id-ID'));
  console.log('  Total Commission (AffiliateConversion):', 'Rp', Number(commissionSum._sum.commissionAmount || 0).toLocaleString('id-ID'));
  console.log('  Total Earnings (AffiliateProfile):', 'Rp', Number(profileSum._sum.totalEarnings || 0).toLocaleString('id-ID'));
  console.log('  Total Sales Revenue:', 'Rp', Number(profileSum._sum.totalSales || 0).toLocaleString('id-ID'));
  console.log('');
  
  console.log('💳 WALLET SUMMARY:');
  console.log('  Total Wallet Balance:', 'Rp', Number(walletSum._sum.balance || 0).toLocaleString('id-ID'));
  console.log('');
  
  // Verify commission amounts per product
  console.log('📦 COMMISSION BY PRODUCT:');
  const byProduct = {};
  const conversions = await prisma.affiliateConversion.findMany({
    include: { transaction: { select: { metadata: true, amount: true } } }
  });
  
  for (const c of conversions) {
    const meta = c.transaction?.metadata || {};
    const productName = meta.productName || 'Unknown';
    if (!byProduct[productName]) {
      byProduct[productName] = { count: 0, commission: 0, revenue: 0 };
    }
    byProduct[productName].count++;
    byProduct[productName].commission += Number(c.commissionAmount);
    byProduct[productName].revenue += Number(c.transaction?.amount || 0);
  }
  
  const sorted = Object.entries(byProduct).sort((a, b) => b[1].commission - a[1].commission);
  for (const [name, data] of sorted.slice(0, 10)) {
    console.log('  ' + name);
    console.log('    Sales:', data.count, '| Commission: Rp', data.commission.toLocaleString('id-ID'), '| Avg:', 'Rp', Math.round(data.commission / data.count).toLocaleString('id-ID'));
  }
  
  await prisma.$disconnect();
}

finalVerification();
