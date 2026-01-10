const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Affiliate Commission from Transaction Metadata ===\n');
  
  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    select: {
      amount: true,
      metadata: true,
      status: true
    }
  });
  
  console.log('Total transactions:', transactions.length);
  
  // Group by affiliate name and calculate totals
  const affiliateStats = {};
  let totalCommissionAll = 0;
  let completedCount = 0;
  
  transactions.forEach(tx => {
    const meta = tx.metadata || {};
    const affName = meta.affiliateName;
    const commission = Number(meta.commissionAmount || 0);
    const amount = Number(tx.amount || 0);
    
    // Only count completed transactions (not cancelled, pending, on-hold)
    if (meta.originalStatus === 'cancelled' || meta.originalStatus === 'pending' || meta.originalStatus === 'on-hold' || meta.originalStatus === 'refunded') {
      return;
    }
    
    completedCount++;
    
    if (affName && commission > 0) {
      if (!affiliateStats[affName]) {
        affiliateStats[affName] = { 
          name: affName, 
          totalCommission: 0, 
          totalSales: 0, 
          count: 0,
          sejoliAffiliateId: meta.affiliateId 
        };
      }
      affiliateStats[affName].totalCommission += commission;
      affiliateStats[affName].totalSales += amount;
      affiliateStats[affName].count++;
      totalCommissionAll += commission;
    }
  });
  
  console.log('Completed transactions:', completedCount);
  console.log('Total Komisi Semua:', totalCommissionAll.toLocaleString('id-ID'));
  
  // Sort by commission
  const sorted = Object.values(affiliateStats).sort((a, b) => b.totalCommission - a.totalCommission);
  
  console.log('\n=== TOP 15 Affiliates (from Transaction Metadata) ===');
  sorted.slice(0, 15).forEach((a, i) => {
    console.log((i+1) + '.', a.name.substring(0, 25).padEnd(25), '| Komisi:', a.totalCommission.toLocaleString('id-ID').padStart(15), '| Sales:', a.count);
  });
  
  // Now update AffiliateProfile with correct data
  console.log('\n=== Updating AffiliateProfile ===');
  
  // Get all affiliate profiles with user name
  const profiles = await prisma.affiliateProfile.findMany({
    include: {
      user: {
        select: { name: true }
      }
    }
  });
  
  let updatedCount = 0;
  
  for (const profile of profiles) {
    const userName = profile.user?.name;
    if (!userName) continue;
    
    // Find matching stats by name
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
      // No transactions found, set to 0
      await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: {
          totalEarnings: 0,
          totalSales: 0,
          totalConversions: 0
        }
      });
    }
  }
  
  console.log('Updated', updatedCount, 'affiliate profiles');
  
  // Show final top 10
  const top10 = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true } }
    }
  });
  
  console.log('\n=== Final TOP 10 Affiliates ===');
  top10.forEach((a, i) => {
    console.log((i+1) + '.', (a.user?.name || 'Unknown').substring(0, 25).padEnd(25), '| Komisi:', Number(a.totalEarnings).toLocaleString('id-ID').padStart(15), '| Konversi:', a.totalConversions);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
