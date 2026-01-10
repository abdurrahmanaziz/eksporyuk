const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Affiliate Commission - Include ALL status ===\n');
  
  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    select: {
      amount: true,
      metadata: true,
      status: true
    }
  });
  
  console.log('Total transactions:', transactions.length);
  
  // Check status distribution
  const statusCount = {};
  transactions.forEach(tx => {
    const meta = tx.metadata || {};
    const status = meta.originalStatus || tx.status;
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  console.log('Status distribution:', statusCount);
  
  // Group by affiliate name - INCLUDE ALL except 'cancelled' and 'refunded'
  const affiliateStats = {};
  let totalCommissionAll = 0;
  let includedCount = 0;
  
  transactions.forEach(tx => {
    const meta = tx.metadata || {};
    const affName = meta.affiliateName;
    const commission = Number(meta.commissionAmount || 0);
    const amount = Number(tx.amount || 0);
    const status = meta.originalStatus || '';
    
    // Skip only cancelled and refunded
    if (status === 'cancelled' || status === 'refunded') {
      return;
    }
    
    includedCount++;
    
    if (affName && commission > 0) {
      if (!affiliateStats[affName]) {
        affiliateStats[affName] = { 
          name: affName, 
          totalCommission: 0, 
          totalSales: 0, 
          count: 0 
        };
      }
      affiliateStats[affName].totalCommission += commission;
      affiliateStats[affName].totalSales += amount;
      affiliateStats[affName].count++;
      totalCommissionAll += commission;
    }
  });
  
  console.log('Included transactions:', includedCount);
  console.log('Total Komisi Semua:', totalCommissionAll.toLocaleString('id-ID'));
  
  // Sort by commission
  const sorted = Object.values(affiliateStats).sort((a, b) => b.totalCommission - a.totalCommission);
  
  console.log('\n=== TOP 15 Affiliates ===');
  sorted.slice(0, 15).forEach((a, i) => {
    console.log((i+1) + '.', a.name.substring(0, 25).padEnd(25), '| Komisi:', a.totalCommission.toLocaleString('id-ID').padStart(15), '| Sales:', a.count);
  });
  
  // Update AffiliateProfile
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
  
  // Show final top 10
  const top10 = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: { user: { select: { name: true } } }
  });
  
  console.log('\n=== Final TOP 10 Affiliates ===');
  top10.forEach((a, i) => {
    console.log((i+1) + '.', (a.user?.name || 'Unknown').substring(0, 25).padEnd(25), '| Komisi:', Number(a.totalEarnings).toLocaleString('id-ID').padStart(15));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
