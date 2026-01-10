const fs = require('fs');

console.log('🔍 ANALISIS HARGA PRODUK SEJOLI UNTUK MAPPING');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Analyze each product_id
const products = {};

sejoli.orders.forEach(order => {
  const pid = order.product_id;
  if (!products[pid]) {
    products[pid] = {
      prices: [],
      completedOrders: 0,
      affiliateOrders: 0,
      completedAffiliateOrders: 0
    };
  }
  
  if (order.grand_total > 0) {
    products[pid].prices.push(order.grand_total);
  }
  
  if (order.status === 'completed') {
    products[pid].completedOrders++;
    if (order.affiliate_id > 0) {
      products[pid].completedAffiliateOrders++;
    }
  }
  
  if (order.affiliate_id > 0) {
    products[pid].affiliateOrders++;
  }
});

// Sort by affiliate orders
const sorted = Object.entries(products)
  .filter(([_, data]) => data.completedAffiliateOrders > 0)
  .sort((a, b) => b[1].completedAffiliateOrders - a[1].completedAffiliateOrders);

console.log('\n📦 PRODUK DENGAN AFFILIATE ORDERS (Sorted by completed affiliate orders):');
console.log('═══════════════════════════════════════════════════════════════');

// Group by price ranges
const priceGroups = {
  'Rp 35K (20K commission)': [],
  'Rp 99K (200K commission)': [],
  'Rp 249K (200K commission)': [],
  'Rp 297K (200K commission)': [],
  'Rp 399K (200K commission)': [],
  'Rp 449K (200K commission)': [],
  'Rp 649-699K (250K commission)': [],
  'Rp 749-799K (250K commission)': [],
  'Rp 899-999K (325K commission)': [],
  'Rp 1.4-1.5M (325K commission)': [],
  'Rp 1.8-2M (325K commission)': [],
  'Other/Unknown': []
};

sorted.forEach(([pid, data]) => {
  const prices = data.prices.sort((a, b) => a - b);
  const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  let suggestedCommission = 0;
  let priceGroup = 'Other/Unknown';
  
  // Determine commission based on median price
  if (medianPrice >= 30000 && medianPrice < 60000) {
    suggestedCommission = 20000;
    priceGroup = 'Rp 35K (20K commission)';
  } else if (medianPrice >= 90000 && medianPrice < 150000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 99K (200K commission)';
  } else if (medianPrice >= 200000 && medianPrice < 280000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 249K (200K commission)';
  } else if (medianPrice >= 280000 && medianPrice < 350000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 297K (200K commission)';
  } else if (medianPrice >= 350000 && medianPrice < 430000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 399K (200K commission)';
  } else if (medianPrice >= 430000 && medianPrice < 550000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 449K (200K commission)';
  } else if (medianPrice >= 600000 && medianPrice < 750000) {
    suggestedCommission = 250000;
    priceGroup = 'Rp 649-699K (250K commission)';
  } else if (medianPrice >= 750000 && medianPrice < 850000) {
    suggestedCommission = 250000;
    priceGroup = 'Rp 749-799K (250K commission)';
  } else if (medianPrice >= 850000 && medianPrice < 1100000) {
    suggestedCommission = 325000;
    priceGroup = 'Rp 899-999K (325K commission)';
  } else if (medianPrice >= 1400000 && medianPrice < 1600000) {
    suggestedCommission = 325000;
    priceGroup = 'Rp 1.4-1.5M (325K commission)';
  } else if (medianPrice >= 1700000 && medianPrice < 2100000) {
    suggestedCommission = 325000;
    priceGroup = 'Rp 1.8-2M (325K commission)';
  }
  
  priceGroups[priceGroup].push({
    pid,
    data,
    medianPrice,
    avgPrice,
    minPrice,
    maxPrice,
    suggestedCommission
  });
  
  console.log(`\n📦 Product ID: ${pid}`);
  console.log(`   Completed Affiliate Orders: ${data.completedAffiliateOrders}`);
  console.log(`   Total Affiliate Orders: ${data.affiliateOrders}`);
  console.log(`   Prices: ${prices.length} unique`);
  if (prices.length > 0) {
    console.log(`   Min: Rp ${minPrice.toLocaleString('id-ID')}`);
    console.log(`   Max: Rp ${maxPrice.toLocaleString('id-ID')}`);
    console.log(`   Avg: Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
    console.log(`   Median: Rp ${Math.round(medianPrice).toLocaleString('id-ID')}`);
    console.log(`   💰 Suggested Commission: Rp ${suggestedCommission.toLocaleString('id-ID')}`);
    console.log(`   💵 Total Commission: Rp ${(suggestedCommission * data.completedAffiliateOrders).toLocaleString('id-ID')}`);
  } else {
    console.log(`   ⚠️  No price data (grand_total = 0)`);
  }
});

console.log('\n\n📊 SUMMARY BY PRICE GROUP:');
console.log('═══════════════════════════════════════════════════════════════');

Object.entries(priceGroups).forEach(([group, products]) => {
  if (products.length > 0) {
    const totalOrders = products.reduce((sum, p) => sum + p.data.completedAffiliateOrders, 0);
    const totalCommission = products.reduce((sum, p) => sum + (p.suggestedCommission * p.data.completedAffiliateOrders), 0);
    
    console.log(`\n${group}:`);
    console.log(`  Products: ${products.length}`);
    console.log(`  Total Orders: ${totalOrders}`);
    console.log(`  💰 Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
    console.log(`  Product IDs: ${products.map(p => p.pid).join(', ')}`);
  }
});

// Calculate grand total
const grandTotal = Object.values(priceGroups)
  .flatMap(products => products)
  .reduce((sum, p) => sum + (p.suggestedCommission * p.data.completedAffiliateOrders), 0);

const totalOrders = Object.values(priceGroups)
  .flatMap(products => products)
  .reduce((sum, p) => sum + p.data.completedAffiliateOrders, 0);

console.log('\n\n💵 GRAND TOTAL:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Products: ${sorted.length}`);
console.log(`Total Orders: ${totalOrders}`);
console.log(`💰 TOTAL COMMISSION: Rp ${grandTotal.toLocaleString('id-ID')}`);

// Save mapping for database update
const productCommissionMap = {};
sorted.forEach(([pid, data]) => {
  const prices = data.prices.sort((a, b) => a - b);
  const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  
  let commission = 0;
  if (medianPrice >= 30000 && medianPrice < 60000) commission = 20000;
  else if (medianPrice >= 90000 && medianPrice < 550000) commission = 200000;
  else if (medianPrice >= 600000 && medianPrice < 850000) commission = 250000;
  else if (medianPrice >= 850000) commission = 325000;
  
  productCommissionMap[pid] = {
    medianPrice: Math.round(medianPrice),
    commission: commission
  };
});

fs.writeFileSync('product-commission-map.json', JSON.stringify(productCommissionMap, null, 2));
console.log('\n✅ Product commission map saved to product-commission-map.json');
