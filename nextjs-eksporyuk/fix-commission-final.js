const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Calculating Commission from metadata.commissionAmount ===\n');
  
  const allTx = await prisma.transaction.findMany({
    select: {
      amount: true,
      metadata: true
    }
  });
  
  // Calculate totals - only completed (not cancelled/refunded)
  let totalCommissionCompleted = 0;
  let totalCommissionAll = 0;
  let completedCount = 0;
  
  // Group by affiliate
  const affiliateStats = {};
  
  allTx.forEach(tx => {
    const meta = tx.metadata || {};
    const commission = Number(meta.commissionAmount || 0);
    const amount = Number(tx.amount || 0);
    const status = meta.originalStatus || '';
    const affName = meta.affiliateName;
    
    totalCommissionAll += commission;
    
    // Count completed only
    if (status !== 'cancelled' && status !== 'refunded') {
      totalCommissionCompleted += commission;
      completedCount++;
      
      if (affName && commission > 0) {
        if (!affiliateStats[affName]) {
          affiliateStats[affName] = { name: affName, totalCommission: 0, totalSales: 0, count: 0 };
        }
        affiliateStats[affName].totalCommission += commission;
        affiliateStats[affName].totalSales += amount;
        affiliateStats[affName].count++;
      }
    }
  });
  
  console.log('Total Transaksi:', allTx.length);
  console.log('Completed Transaksi:', completedCount);
  console.log('\nTotal Komisi (ALL):', totalCommissionAll.toLocaleString('id-ID'));
  console.log('Total Komisi (Completed only):', totalCommissionCompleted.toLocaleString('id-ID'));
  
  // Sort and show top 10
  const sorted = Object.values(affiliateStats).sort((a, b) => b.totalCommission - a.totalCommission);
  
  console.log('\n=== TOP 10 Affiliates (Completed Transactions) ===');
  sorted.slice(0, 10).forEach((a, i) => {
    console.log((i+1) + '.', a.name.substring(0, 25).padEnd(25), '| Komisi:', a.totalCommission.toLocaleString('id-ID').padStart(15));
  });
  
  // Now update AffiliateProfile with this data
  console.log('\n=== Updating AffiliateProfile ===');
  
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { name: true } } }
  });
  
  let updatedCount = 0;
  for (const profile of profiles) {
    const userName = profile.user?.name;
    if (!userName) continue;
    
    const stats = affiliateStats[userName];
    if (stats) {
      await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: {
          totalEarnings: stats.totalCommission,
          totalSales: stats.totalSales,
          totalConversions: stats.count
        }
      });
      updatedCount++;
    } else {
      await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: { totalEarnings: 0, totalSales: 0, totalConversions: 0 }
      });
    }
  }
  
  console.log('Updated', updatedCount, 'profiles');
  
  // Final check
  const top10Final = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: { user: { select: { name: true } } }
  });
  
  console.log('\n=== Final TOP 10 in Database ===');
  top10Final.forEach((a, i) => {
    console.log((i+1) + '.', (a.user?.name || 'Unknown').substring(0, 25).padEnd(25), '| Komisi:', Number(a.totalEarnings).toLocaleString('id-ID').padStart(15));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
