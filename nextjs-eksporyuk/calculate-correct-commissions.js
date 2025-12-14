const fs = require('fs');

console.log('🔍 VERIFIKASI KOMISI - EXCLUDING OWNER (azizbiasa@gmail.com)');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Owner user_id to exclude
const OWNER_USER_ID = 53; // azizbiasa@gmail.com

// User map
const userMap = new Map();
sejoli.users.forEach(u => userMap.set(u.id, u));

// Completed orders with affiliate, excluding owner
const validOrders = sejoli.orders.filter(o => 
  o.status === 'completed' && 
  o.affiliate_id > 0 && 
  o.affiliate_id !== OWNER_USER_ID
);

console.log(`\nTotal completed affiliate orders: ${sejoli.orders.filter(o => o.status === 'completed' && o.affiliate_id > 0).length}`);
console.log(`Excluding owner (${OWNER_USER_ID}): ${validOrders.length}`);

// Product commission map - let me recalculate based on actual product analysis
// From screenshot, total top 10 = Rp 976,068,000
// Let me calculate backwards what rates would match

// First, let me analyze Rahmat's orders to understand the rate
console.log('\n\n🔍 ANALYZING RAHMAT AL FIANTO ORDERS:');
console.log('═══════════════════════════════════════════════════════════════');

const rahmatId = 1637;
const rahmatOrders = validOrders.filter(o => o.affiliate_id === rahmatId);

console.log(`Rahmat's orders: ${rahmatOrders.length}`);
console.log(`Screenshot commission: Rp 169,955,000`);
console.log(`Expected commission per order: Rp ${Math.round(169955000 / rahmatOrders.length).toLocaleString('id-ID')}`);

// Group Rahmat's orders by product
const rahmatByProduct = {};
rahmatOrders.forEach(o => {
  if (!rahmatByProduct[o.product_id]) {
    rahmatByProduct[o.product_id] = { count: 0, totalAmount: 0 };
  }
  rahmatByProduct[o.product_id].count++;
  rahmatByProduct[o.product_id].totalAmount += o.grand_total;
});

console.log('\nRahmat orders by product:');
Object.entries(rahmatByProduct)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([pid, data]) => {
    const avgPrice = data.totalAmount / data.count;
    console.log(`  Product ${pid}: ${data.count} orders, avg price Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
  });

// Let me try different commission rates to match screenshot
console.log('\n\n💰 TESTING COMMISSION RATES TO MATCH SCREENSHOT:');
console.log('═══════════════════════════════════════════════════════════════');

// Expected from screenshot (top 10)
const expectedCommissions = {
  'rahmatalfianto1997@gmail.com': 169955000,
  'asep.abdurrahman.w@gmail.com': 165150000,
  'azzka42@gmail.com': 132825000, // Sutisna
  'hamidbaidowi03@gmail.com': 131110000,
  'yogasoneo@gmail.com': 93085000,
  'irmaprime01@gmail.com': 83957000, // NgobrolinEkspor
  'ekowibowo831@gmail.com': 65777000,
  'pintarekspor146@gmail.com': 53909000,
  'rsaf924@gmail.com': 43800000, // Muhamad safrizal
  'mentorpasukan@gmail.com': 36500000 // Brian
};

// Test with different commission rates
// Maybe the rates are: 20K, 100K, 150K, 200K (not 200K, 250K, 325K)

const testRates = [
  // Test 1: Current rates
  { name: 'Current (20K/200K/250K/325K)', rates: {
    35000: 20000, 99000: 200000, 249000: 200000, 399000: 200000,
    699000: 250000, 799000: 250000, 899000: 325000, 999000: 325000
  }},
  // Test 2: Lower rates
  { name: 'Lower (10K/100K/150K/200K)', rates: {
    35000: 10000, 99000: 100000, 249000: 100000, 399000: 100000,
    699000: 150000, 799000: 150000, 899000: 200000, 999000: 200000
  }},
  // Test 3: Even lower
  { name: 'Lower (5K/50K/75K/100K)', rates: {
    35000: 5000, 99000: 50000, 249000: 50000, 399000: 50000,
    699000: 75000, 799000: 75000, 899000: 100000, 999000: 100000
  }}
];

// Analyze product prices to determine commission based on price
function getCommissionByPrice(price, rateType) {
  if (price <= 0) return 0;
  if (price <= 50000) return rateType[35000] || 0;
  if (price <= 150000) return rateType[99000] || 0;
  if (price <= 300000) return rateType[249000] || 0;
  if (price <= 500000) return rateType[399000] || 0;
  if (price <= 750000) return rateType[699000] || 0;
  if (price <= 850000) return rateType[799000] || 0;
  return rateType[999000] || 0;
}

// Actually, let me calculate based on actual commission from screenshot
// If Rahmat has Rp 169,955,000 from 1751 orders
// Let me see the breakdown

console.log('\n📊 TRYING TO REVERSE-ENGINEER COMMISSION RATES:');
console.log('═══════════════════════════════════════════════════════════════');

// Get Rahmat's product breakdown
const rahmatProducts = {};
rahmatOrders.forEach(o => {
  const pid = o.product_id;
  if (!rahmatProducts[pid]) {
    rahmatProducts[pid] = { count: 0, prices: [] };
  }
  rahmatProducts[pid].count++;
  if (o.grand_total > 0) rahmatProducts[pid].prices.push(o.grand_total);
});

// Calculate median price for each product Rahmat sold
console.log('\nRahmat product analysis:');
let testCommission = 0;

// Let's assume commission rates based on median price:
// ~35K products: ~10K commission  
// ~99K products: ~50K commission (or 50% of price)
// ~399K products: ~100K commission
// ~699K products: ~150K commission
// ~899K products: ~200K commission

const commissionRates = {};

Object.entries(rahmatProducts).forEach(([pid, data]) => {
  const prices = data.prices.sort((a, b) => a - b);
  const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  
  let commission = 0;
  if (medianPrice > 0 && medianPrice < 50000) commission = 10000;
  else if (medianPrice >= 50000 && medianPrice < 150000) commission = 50000;
  else if (medianPrice >= 150000 && medianPrice < 350000) commission = 100000;
  else if (medianPrice >= 350000 && medianPrice < 500000) commission = 100000;
  else if (medianPrice >= 500000 && medianPrice < 750000) commission = 150000;
  else if (medianPrice >= 750000 && medianPrice < 850000) commission = 150000;
  else if (medianPrice >= 850000) commission = 200000;
  
  commissionRates[pid] = commission;
  
  const totalComm = commission * data.count;
  testCommission += totalComm;
  
  console.log(`  Product ${pid}: ${data.count} orders, median Rp ${Math.round(medianPrice).toLocaleString('id-ID')} -> commission Rp ${commission.toLocaleString('id-ID')} = Rp ${totalComm.toLocaleString('id-ID')}`);
});

console.log(`\nRahmat calculated commission: Rp ${testCommission.toLocaleString('id-ID')}`);
console.log(`Screenshot: Rp 169,955,000`);
console.log(`Difference: Rp ${(169955000 - testCommission).toLocaleString('id-ID')}`);

// Now let's try to find exact rates that match
console.log('\n\n🎯 CALCULATING ALL AFFILIATES WITH ESTIMATED RATES:');
console.log('═══════════════════════════════════════════════════════════════');

// Build product commission map from all orders
const allProductPrices = {};
validOrders.forEach(o => {
  if (!allProductPrices[o.product_id]) {
    allProductPrices[o.product_id] = [];
  }
  if (o.grand_total > 0) {
    allProductPrices[o.product_id].push(o.grand_total);
  }
});

// Determine commission for each product based on median price
const productCommissionMap = {};
Object.entries(allProductPrices).forEach(([pid, prices]) => {
  const sorted = prices.sort((a, b) => a - b);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  
  let commission = 0;
  if (median > 0 && median < 50000) commission = 10000;
  else if (median >= 50000 && median < 150000) commission = 50000;
  else if (median >= 150000 && median < 350000) commission = 100000;
  else if (median >= 350000 && median < 600000) commission = 100000;
  else if (median >= 600000 && median < 850000) commission = 150000;
  else if (median >= 850000) commission = 200000;
  
  productCommissionMap[pid] = { median, commission };
});

console.log('\nProduct Commission Map:');
Object.entries(productCommissionMap)
  .filter(([_, d]) => d.commission > 0)
  .forEach(([pid, data]) => {
    console.log(`  Product ${pid}: median Rp ${Math.round(data.median).toLocaleString('id-ID')} -> Rp ${data.commission.toLocaleString('id-ID')}`);
  });

// Calculate all affiliates
const affiliateResults = {};

validOrders.forEach(o => {
  const user = userMap.get(o.affiliate_id);
  if (!user) return;
  
  const email = user.user_email;
  const commission = productCommissionMap[o.product_id]?.commission || 0;
  
  if (!affiliateResults[email]) {
    affiliateResults[email] = {
      name: user.display_name,
      email: email,
      orders: 0,
      commission: 0,
      revenue: 0
    };
  }
  
  affiliateResults[email].orders++;
  affiliateResults[email].commission += commission;
  affiliateResults[email].revenue += o.grand_total;
});

// Sort and show
const sortedResults = Object.values(affiliateResults)
  .sort((a, b) => b.commission - a.commission);

console.log('\n\n👥 TOP 15 AFFILIATES (NEW CALCULATION):');
console.log('═══════════════════════════════════════════════════════════════');

sortedResults.slice(0, 15).forEach((aff, i) => {
  const expected = expectedCommissions[aff.email];
  const diff = expected ? aff.commission - expected : null;
  
  console.log(`\n${i+1}. ${aff.name}`);
  console.log(`   Email: ${aff.email}`);
  console.log(`   Orders: ${aff.orders}`);
  console.log(`   Omset: Rp ${aff.revenue.toLocaleString('id-ID')}`);
  console.log(`   💰 Komisi: Rp ${aff.commission.toLocaleString('id-ID')}`);
  
  if (expected) {
    console.log(`   📊 Screenshot: Rp ${expected.toLocaleString('id-ID')}`);
    console.log(`   ${Math.abs(diff) < 1000000 ? '✅' : '❌'} Selisih: Rp ${diff.toLocaleString('id-ID')}`);
  }
});

// Grand totals
const totalCommission = sortedResults.reduce((sum, a) => sum + a.commission, 0);
const totalRevenue = sortedResults.reduce((sum, a) => sum + a.revenue, 0);
const totalOrders = sortedResults.reduce((sum, a) => sum + a.orders, 0);

console.log('\n\n💵 GRAND TOTAL (EXCLUDING OWNER):');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Affiliates: ${sortedResults.length}`);
console.log(`Total Orders: ${totalOrders}`);
console.log(`Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
console.log(`💰 Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);

// Compare top 10 with screenshot
const myTop10 = sortedResults.slice(0, 10).reduce((sum, a) => sum + a.commission, 0);
const screenshotTop10 = Object.values(expectedCommissions).reduce((sum, c) => sum + c, 0);
console.log(`\nTop 10 Comparison:`);
console.log(`  My calculation: Rp ${myTop10.toLocaleString('id-ID')}`);
console.log(`  Screenshot: Rp ${screenshotTop10.toLocaleString('id-ID')}`);
console.log(`  Difference: Rp ${(myTop10 - screenshotTop10).toLocaleString('id-ID')}`);
