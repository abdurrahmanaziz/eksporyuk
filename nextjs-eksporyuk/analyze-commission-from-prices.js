const fs = require('fs');

console.log('🔍 ANALISIS KOMISI BERDASARKAN HARGA PRODUK');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Group orders by product_id and analyze prices
const products = {};

sejoli.orders.forEach(order => {
  const pid = order.product_id;
  if (!products[pid]) {
    products[pid] = {
      id: pid,
      prices: new Set(),
      totalOrders: 0,
      affiliateOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    };
  }
  
  products[pid].totalOrders++;
  if (order.grand_total > 0) {
    products[pid].prices.add(order.grand_total);
  }
  if (order.affiliate_id > 0) {
    products[pid].affiliateOrders++;
  }
  if (order.status === 'completed' && order.affiliate_id > 0) {
    products[pid].completedOrders++;
    products[pid].totalRevenue += order.grand_total;
  }
});

// Sort by affiliate orders
const sortedProducts = Object.values(products)
  .filter(p => p.affiliateOrders > 0)
  .sort((a, b) => b.affiliateOrders - a.affiliateOrders);

console.log('\n📦 PRODUK DENGAN AFFILIATE (Diurutkan Total Orders):');
console.log('═══════════════════════════════════════════════════════════════');

// Group by typical price
const priceGroups = {
  'Rp 35K - 50K': [],
  'Rp 300K - 500K': [],
  'Rp 600K - 800K': [],
  'Rp 800K - 1M': [],
  'Rp 1M - 2M': [],
  'Lainnya': []
};

sortedProducts.slice(0, 30).forEach(prod => {
  const pricesArray = Array.from(prod.prices).sort((a, b) => b - a);
  const avgPrice = pricesArray.length > 0 ? pricesArray.reduce((sum, p) => sum + p, 0) / pricesArray.length : 0;
  const medianPrice = pricesArray.length > 0 ? pricesArray[Math.floor(pricesArray.length / 2)] : 0;
  const minPrice = pricesArray.length > 0 ? Math.min(...pricesArray) : 0;
  const maxPrice = pricesArray.length > 0 ? Math.max(...pricesArray) : 0;
  
  let suggestedCommission = 0;
  let priceGroup = 'Lainnya';
  
  // Tentukan komisi berdasarkan median price
  if (medianPrice >= 35000 && medianPrice < 50000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 35K - 50K';
  } else if (medianPrice >= 300000 && medianPrice < 500000) {
    suggestedCommission = 200000;
    priceGroup = 'Rp 300K - 500K';
  } else if (medianPrice >= 600000 && medianPrice < 800000) {
    suggestedCommission = 250000;
    priceGroup = 'Rp 600K - 800K';
  } else if (medianPrice >= 800000 && medianPrice < 1000000) {
    suggestedCommission = 325000;
    priceGroup = 'Rp 800K - 1M';
  } else if (medianPrice >= 1000000 && medianPrice < 2000000) {
    suggestedCommission = 325000;
    priceGroup = 'Rp 1M - 2M';
  }
  
  priceGroups[priceGroup].push(prod);
  
  console.log(`\n📦 Product ID: ${prod.id}`);
  console.log(`   Affiliate Orders: ${prod.affiliateOrders} (${prod.completedOrders} completed)`);
  console.log(`   Prices: ${pricesArray.length} unique`);
  if (pricesArray.length > 0) {
    console.log(`   Min: Rp ${minPrice.toLocaleString('id-ID')}`);
    console.log(`   Max: Rp ${maxPrice.toLocaleString('id-ID')}`);
    console.log(`   Avg: Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
    console.log(`   Median: Rp ${medianPrice.toLocaleString('id-ID')}`);
    console.log(`   💰 Suggested Commission: Rp ${suggestedCommission.toLocaleString('id-ID')} per sale`);
    console.log(`   💵 Total Commission: Rp ${(suggestedCommission * prod.completedOrders).toLocaleString('id-ID')}`);
  }
});

console.log('\n\n📊 SUMMARY BY PRICE GROUP:');
console.log('═══════════════════════════════════════════════════════════════');

Object.entries(priceGroups).forEach(([group, products]) => {
  if (products.length > 0) {
    const totalOrders = products.reduce((sum, p) => sum + p.completedOrders, 0);
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    
    let commissionRate = 0;
    if (group === 'Rp 35K - 50K' || group === 'Rp 300K - 500K') {
      commissionRate = 200000;
    } else if (group === 'Rp 600K - 800K') {
      commissionRate = 250000;
    } else if (group === 'Rp 800K - 1M' || group === 'Rp 1M - 2M') {
      commissionRate = 325000;
    }
    
    const totalCommission = totalOrders * commissionRate;
    
    console.log(`\n${group}:`);
    console.log(`  Products: ${products.length}`);
    console.log(`  Completed Orders: ${totalOrders}`);
    console.log(`  Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
    console.log(`  💰 Commission Rate: Rp ${commissionRate.toLocaleString('id-ID')} per sale`);
    console.log(`  💵 Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
  }
});

console.log('\n\n💡 KESIMPULAN:');
console.log('═══════════════════════════════════════════════════════════════');
console.log('Sejoli tidak menyimpan data komisi per produk.');
console.log('Komisi harus ditentukan berdasarkan HARGA MEDIAN produk:');
console.log('  • Rp 35K - 50K → Komisi Rp 200.000');
console.log('  • Rp 300K - 500K → Komisi Rp 200.000');
console.log('  • Rp 600K - 800K → Komisi Rp 250.000');
console.log('  • Rp 800K - 2M → Komisi Rp 325.000');
console.log('\n⚠️  PERLU KONFIRMASI: Apakah mapping ini sudah sesuai?');
