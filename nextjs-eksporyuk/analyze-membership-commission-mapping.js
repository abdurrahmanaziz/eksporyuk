const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkProducts() {
  console.log('🔍 MEMERIKSA PRODUK DI DATABASE DAN SEJOLI');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load Sejoli data
  const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Get memberships from database
  console.log('\n💳 MEMBERSHIP DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const memberships = await prisma.membership.findMany({
    orderBy: {
      price: 'desc'
    }
  });
  
  console.log(`\nTotal memberships in DB: ${memberships.length}\n`);
  
  memberships.forEach(membership => {
    console.log(`💳 ${membership.name}`);
    console.log(`   ID: ${membership.id}`);
    console.log(`   Sejoli Product ID: ${membership.sejoliProductId || 'N/A'}`);
    console.log(`   Price: Rp ${membership.price.toLocaleString('id-ID')}`);
    console.log(`   Commission Type: ${membership.affiliateCommissionType}`);
    console.log(`   Commission Rate: ${membership.affiliateCommissionRate}`);
    console.log('');
  });
  
  // Analyze order product_ids
  console.log('\n📊 ANALISIS PRODUCT_ID DI SEJOLI ORDERS:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const productCounts = {};
  const productPrices = {};
  
  sejoli.orders.forEach(order => {
    const pid = order.product_id;
    if (!productCounts[pid]) {
      productCounts[pid] = {
        total: 0,
        completed: 0,
        withAffiliate: 0,
        completedWithAffiliate: 0,
        revenue: 0,
        prices: []
      };
    }
    productCounts[pid].total++;
    
    if (order.grand_total > 0) {
      productCounts[pid].prices.push(order.grand_total);
    }
    
    if (order.status === 'completed') {
      productCounts[pid].completed++;
      productCounts[pid].revenue += order.grand_total;
      
      if (order.affiliate_id > 0) {
        productCounts[pid].completedWithAffiliate++;
      }
    }
    
    if (order.affiliate_id > 0) {
      productCounts[pid].withAffiliate++;
    }
  });
  
  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].completedWithAffiliate - a[1].completedWithAffiliate)
    .slice(0, 50);
  
  console.log('\n📦 TOP 50 PRODUCTS BY COMPLETED AFFILIATE ORDERS:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const membershipSejoliIds = memberships.map(m => m.sejoliProductId).filter(id => id);
  
  sortedProducts.forEach(([pid, data]) => {
    const avgPrice = data.completed > 0 ? data.revenue / data.completed : 0;
    const prices = data.prices.sort((a, b) => a - b);
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
    
    // Check if this product_id is in our memberships
    const membership = memberships.find(m => m.sejoliProductId === parseInt(pid));
    
    console.log(`\n📦 Product ID: ${pid}${membership ? ' ✅ IN DB' : ''}`);
    console.log(`   Total Orders: ${data.total} (${data.completed} completed)`);
    console.log(`   Affiliate Orders: ${data.withAffiliate} (${data.completedWithAffiliate} completed)`);
    console.log(`   Avg Price: Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
    console.log(`   Median Price: Rp ${Math.round(medianPrice).toLocaleString('id-ID')}`);
    console.log(`   Total Revenue: Rp ${Math.round(data.revenue).toLocaleString('id-ID')}`);
    
    if (membership) {
      console.log(`   💰 DB Commission: ${membership.affiliateCommissionType} ${membership.affiliateCommissionRate}`);
    } else {
      console.log(`   ⚠️  NOT IN DATABASE - Need to map commission!`);
    }
  });
  
  // Check matching
  console.log('\n\n🔗 MAPPING SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const sejoliProductIds = [...new Set(sejoli.orders.map(o => o.product_id))];
  console.log(`\nTotal unique product_ids in Sejoli: ${sejoliProductIds.length}`);
  console.log(`Memberships in DB: ${memberships.length}`);
  console.log(`Memberships with sejoliProductId: ${membershipSejoliIds.length}`);
  
  const matchingIds = sejoliProductIds.filter(id => membershipSejoliIds.includes(id));
  console.log(`\n✅ Matched: ${matchingIds.length} products`);
  console.log(`❌ Unmatched: ${sejoliProductIds.length - matchingIds.length} products`);
  
  // Show unmatched products with affiliate orders
  const unmatchedWithAffiliates = sortedProducts
    .filter(([pid]) => !membershipSejoliIds.includes(parseInt(pid)))
    .filter(([_, data]) => data.completedWithAffiliate > 0);
  
  console.log(`\n⚠️  PRODUCTS WITH AFFILIATE ORDERS NOT IN DB: ${unmatchedWithAffiliates.length}`);
  console.log('These need commission mapping:');
  unmatchedWithAffiliates.slice(0, 20).forEach(([pid, data]) => {
    const avgPrice = data.completed > 0 ? data.revenue / data.completed : 0;
    console.log(`  Product ${pid}: ${data.completedWithAffiliate} orders, Avg Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
  });
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);
