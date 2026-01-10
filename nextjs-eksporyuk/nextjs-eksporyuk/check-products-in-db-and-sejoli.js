const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkProducts() {
  console.log('🔍 MEMERIKSA PRODUK DI DATABASE DAN SEJOLI');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load Sejoli data
  const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  console.log('\n📊 STRUKTUR DATA SEJOLI:');
  console.log(`  users: ${sejoli.users.length}`);
  console.log(`  orders: ${sejoli.orders.length}`);
  console.log(`  affiliates: ${sejoli.affiliates.length}`);
  console.log(`  commissions: ${sejoli.commissions?.length || 0}`);
  
  // Check if there's product data
  console.log('\n🔍 MENCARI DATA PRODUK DI SEJOLI...');
  console.log('Available keys:', Object.keys(sejoli));
  
  // Check sample orders for product info
  console.log('\n📦 SAMPLE ORDERS (First 5) - FULL DATA:');
  console.log('═══════════════════════════════════════════════════════════════');
  sejoli.orders.slice(0, 5).forEach((order, i) => {
    console.log(`\n${i + 1}. Order ID: ${order.id}`);
    console.log('Full order data:', JSON.stringify(order, null, 2));
  });
  
  // Get products from database
  console.log('\n\n💾 PRODUK DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const dbProducts = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\nTotal products in DB: ${dbProducts.length}`);
  
  if (dbProducts.length > 0) {
    console.log('\n📦 PRODUCTS WITH COMMISSION INFO:');
    dbProducts.forEach(product => {
      console.log(`\nProduct ID: ${product.id}`);
      console.log(`  Sejoli ID: ${product.sejoliProductId || 'N/A'}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Price: Rp ${product.price.toLocaleString('id-ID')}`);
      console.log(`  Affiliate Commission Type: ${product.affiliateCommissionType}`);
      console.log(`  Affiliate Commission Rate: ${product.affiliateCommissionRate}`);
      console.log(`  Transactions: ${product._count.transactions}`);
    });
  } else {
    console.log('\n❌ No products found in database!');
  }
  
  // Get memberships from database
  console.log('\n\n💳 MEMBERSHIP DI DATABASE:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const memberships = await prisma.membership.findMany({
    include: {
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: {
      price: 'desc'
    }
  });
  
  console.log(`\nTotal memberships in DB: ${memberships.length}`);
  
  memberships.forEach(membership => {
    console.log(`\n💳 ${membership.name}`);
    console.log(`  Sejoli ID: ${membership.sejoliProductId || 'N/A'}`);
    console.log(`  Price: Rp ${membership.price.toLocaleString('id-ID')}`);
    console.log(`  Affiliate Commission Type: ${membership.affiliateCommissionType}`);
    console.log(`  Affiliate Commission Rate: ${membership.affiliateCommissionRate}`);
    console.log(`  Transactions: ${membership._count.transactions}`);
  });
  
  // Analyze order product_ids
  console.log('\n\n📊 ANALISIS PRODUCT_ID DI ORDERS:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const productCounts = {};
  sejoli.orders.forEach(order => {
    const pid = order.product_id;
    if (!productCounts[pid]) {
      productCounts[pid] = {
        total: 0,
        completed: 0,
        withAffiliate: 0,
        revenue: 0
      };
    }
    productCounts[pid].total++;
    if (order.status === 'completed') {
      productCounts[pid].completed++;
      productCounts[pid].revenue += order.grand_total;
    }
    if (order.affiliate_id > 0) {
      productCounts[pid].withAffiliate++;
    }
  });
  
  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].withAffiliate - a[1].withAffiliate)
    .slice(0, 30);
  
  console.log('\n📦 TOP 30 PRODUCTS BY AFFILIATE ORDERS:');
  sortedProducts.forEach(([pid, data]) => {
    const avgPrice = data.completed > 0 ? data.revenue / data.completed : 0;
    console.log(`\nProduct ID ${pid}:`);
    console.log(`  Total Orders: ${data.total}`);
    console.log(`  Completed: ${data.completed}`);
    console.log(`  With Affiliate: ${data.withAffiliate}`);
    console.log(`  Avg Price: Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
    console.log(`  Total Revenue: Rp ${Math.round(data.revenue).toLocaleString('id-ID')}`);
  });
  
  // Check if product_id matches sejoliProductId
  console.log('\n\n🔗 MAPPING SEJOLI PRODUCT_ID TO DB:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const sejoliProductIds = [...new Set(sejoli.orders.map(o => o.product_id))];
  console.log(`\nUnique product_ids in Sejoli orders: ${sejoliProductIds.length}`);
  console.log('Sample product_ids:', sejoliProductIds.slice(0, 20).join(', '));
  
  // Check how many match memberships
  const membershipSejoliIds = memberships.map(m => m.sejoliProductId).filter(id => id);
  console.log(`\nMemberships with sejoliProductId: ${membershipSejoliIds.length}`);
  console.log('Membership Sejoli IDs:', membershipSejoliIds);
  
  const matchingIds = sejoliProductIds.filter(id => membershipSejoliIds.includes(id));
  console.log(`\nMatching product_ids: ${matchingIds.length}`);
  console.log('Matching IDs:', matchingIds);
  
  await prisma.$disconnect();
}

checkProducts().catch(console.error);
