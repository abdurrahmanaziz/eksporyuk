const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function calculateAccurateCommissions() {
  console.log('💰 KALKULASI KOMISI AKURAT DARI DATABASE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load product commission map
  const productCommissionMap = JSON.parse(fs.readFileSync('product-commission-map.json', 'utf8'));
  
  // Get all SUCCESS transactions with affiliate
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      affiliateId: { not: null }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
  
  console.log(`\n📊 Found ${transactions.length} SUCCESS transactions with affiliate`);
  
  // Calculate commissions by affiliate
  const affiliateCommissions = new Map();
  let totalCommission = 0;
  let ordersWithCommission = 0;
  let ordersNoCommission = 0;
  
  const commissionByRate = {
    0: { count: 0, total: 0 },
    20000: { count: 0, total: 0 },
    200000: { count: 0, total: 0 },
    250000: { count: 0, total: 0 },
    325000: { count: 0, total: 0 }
  };
  
  transactions.forEach(tx => {
    const metadata = tx.metadata;
    const sejoliProductId = metadata?.sejoliProductId;
    
    if (!sejoliProductId) {
      ordersNoCommission++;
      return;
    }
    
    // Get commission from product map
    const productInfo = productCommissionMap[sejoliProductId];
    const commission = productInfo?.commission || 0;
    
    if (commission === 0) {
      ordersNoCommission++;
      commissionByRate[0].count++;
      return;
    }
    
    ordersWithCommission++;
    totalCommission += commission;
    
    // Track by commission rate
    if (!commissionByRate[commission]) {
      commissionByRate[commission] = { count: 0, total: 0 };
    }
    commissionByRate[commission].count++;
    commissionByRate[commission].total += commission;
    
    // Track by affiliate
    if (!affiliateCommissions.has(tx.affiliateId)) {
      affiliateCommissions.set(tx.affiliateId, {
        affiliateId: tx.affiliateId,
        email: null, // Will fetch later
        totalOrders: 0,
        totalCommission: 0,
        byRate: {
          20000: 0,
          200000: 0,
          250000: 0,
          325000: 0
        }
      });
    }
    
    const affData = affiliateCommissions.get(tx.affiliateId);
    affData.totalOrders++;
    affData.totalCommission += commission;
    
    if (affData.byRate[commission] !== undefined) {
      affData.byRate[commission]++;
    }
  });
  
  console.log('\n📊 STATISTIK TRANSAKSI:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total SUCCESS transactions with affiliate: ${transactions.length}`);
  console.log(`Orders DAPAT komisi: ${ordersWithCommission}`);
  console.log(`Orders TIDAK DAPAT komisi: ${ordersNoCommission}`);
  
  console.log('\n💰 BREAKDOWN BY COMMISSION RATE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  Object.entries(commissionByRate)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([rate, data]) => {
      const rateNum = parseInt(rate);
      console.log(`\nRp ${rateNum.toLocaleString('id-ID')} per sale:`);
      console.log(`  Orders: ${data.count}`);
      console.log(`  Total Commission: Rp ${data.total.toLocaleString('id-ID')}`);
    });
  
  // Fetch affiliate emails
  console.log('\n\n👥 FETCHING AFFILIATE DATA...');
  const affiliateIds = Array.from(affiliateCommissions.keys());
  const affiliateUsers = await prisma.user.findMany({
    where: {
      id: { in: affiliateIds }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  
  // Update affiliate data with emails
  affiliateUsers.forEach(user => {
    const affData = affiliateCommissions.get(user.id);
    if (affData) {
      affData.email = user.email;
      affData.name = user.name;
      affData.role = user.role;
    }
  });
  
  // Sort by total commission
  const sortedAffiliates = Array.from(affiliateCommissions.values())
    .sort((a, b) => b.totalCommission - a.totalCommission);
  
  console.log('\n\n👥 TOP 20 AFFILIATES:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  sortedAffiliates.slice(0, 20).forEach((aff, index) => {
    console.log(`\n${index + 1}. ${aff.email || 'Unknown'}`);
    console.log(`   Name: ${aff.name || 'N/A'}`);
    console.log(`   Role: ${aff.role || 'N/A'}`);
    console.log(`   Total Orders: ${aff.totalOrders}`);
    console.log(`   Breakdown:`);
    console.log(`     - Rp 20K:  ${aff.byRate[20000]} orders = Rp ${(aff.byRate[20000] * 20000).toLocaleString('id-ID')}`);
    console.log(`     - Rp 200K: ${aff.byRate[200000]} orders = Rp ${(aff.byRate[200000] * 200000).toLocaleString('id-ID')}`);
    console.log(`     - Rp 250K: ${aff.byRate[250000]} orders = Rp ${(aff.byRate[250000] * 250000).toLocaleString('id-ID')}`);
    console.log(`     - Rp 325K: ${aff.byRate[325000]} orders = Rp ${(aff.byRate[325000] * 325000).toLocaleString('id-ID')}`);
    console.log(`   💰 Total Commission: Rp ${aff.totalCommission.toLocaleString('id-ID')}`);
  });
  
  console.log('\n\n💵 GRAND TOTAL:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Affiliates: ${affiliateCommissions.size}`);
  console.log(`Total Orders with Commission: ${ordersWithCommission}`);
  console.log(`💰 TOTAL COMMISSION: Rp ${totalCommission.toLocaleString('id-ID')}`);
  
  // Calculate revenue
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const affiliateRevenue = transactions
    .filter(tx => {
      const sejoliProductId = tx.metadata?.sejoliProductId;
      const productInfo = productCommissionMap[sejoliProductId];
      return productInfo?.commission > 0;
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  console.log(`\n📊 REVENUE:`);
  console.log(`Omset Kotor (all affiliate transactions): Rp ${totalRevenue.toLocaleString('id-ID')}`);
  console.log(`Omset Bersih (transactions dengan komisi): Rp ${affiliateRevenue.toLocaleString('id-ID')}`);
  console.log(`Total Komisi: Rp ${totalCommission.toLocaleString('id-ID')}`);
  console.log(`% Komisi dari Omset Bersih: ${((totalCommission / affiliateRevenue) * 100).toFixed(2)}%`);
  
  // Save for distribution
  const distributionData = {
    timestamp: new Date().toISOString(),
    stats: {
      totalAffiliates: affiliateCommissions.size,
      totalOrders: ordersWithCommission,
      totalOrdersNoCommission: ordersNoCommission,
      totalCommission: totalCommission,
      omsetKotor: totalRevenue,
      omsetBersih: affiliateRevenue
    },
    commissionBreakdown: commissionByRate,
    affiliates: sortedAffiliates
  };
  
  fs.writeFileSync('accurate-commission-distribution.json', JSON.stringify(distributionData, null, 2));
  console.log('\n✅ Data saved to accurate-commission-distribution.json');
  
  await prisma.$disconnect();
}

calculateAccurateCommissions().catch(console.error);
