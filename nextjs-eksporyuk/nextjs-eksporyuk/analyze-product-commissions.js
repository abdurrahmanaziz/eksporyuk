/**
 * Analyze Sejoli products to extract commission rates per product
 */

const fs = require('fs');
const path = require('path');

const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('🔍 ANALISA PRODUK SEJOLI - DETAIL KOMISI\n');

// Group by product
const products = new Map();
data.orders.forEach(o => {
  const pid = o.product_id;
  if (!products.has(pid)) {
    products.set(pid, {
      id: pid,
      name: o.product_name || 'N/A',
      orders: [],
      totalRevenue: 0,
      totalAffiliateCommission: 0,
      sampleOrders: []
    });
  }
  
  const p = products.get(pid);
  p.orders.push(o);
  
  const amount = parseFloat(o.grand_total || 0);
  const affComm = parseFloat(o.affiliate_commission || 0);
  
  p.totalRevenue += amount;
  p.totalAffiliateCommission += affComm;
  
  if (p.sampleOrders.length < 5 && o.status === 'completed' && affComm > 0) {
    p.sampleOrders.push({
      orderId: o.id,
      price: amount,
      affComm: affComm,
      status: o.status,
      affId: o.affiliate_id
    });
  }
});

// Sort by order count
const sorted = Array.from(products.values()).sort((a, b) => b.orders.length - a.orders.length);

console.log('📦 TOP 20 PRODUK DENGAN DETAIL KOMISI:\n');
console.log('═'.repeat(100));

sorted.slice(0, 20).forEach((p, idx) => {
  const completedOrders = p.orders.filter(o => o.status === 'completed').length;
  const avgPrice = p.totalRevenue / p.orders.length;
  const avgCommission = p.totalAffiliateCommission / p.orders.length;
  const commissionRate = avgPrice > 0 ? (avgCommission / avgPrice * 100) : 0;
  
  console.log(`${idx + 1}. Product ID: ${p.id}`);
  console.log(`   Name: ${p.name.substring(0, 70)}`);
  console.log(`   Total Orders: ${p.orders.length} (${completedOrders} completed)`);
  console.log(`   Avg Price: Rp ${avgPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  console.log(`   Avg Commission: Rp ${avgCommission.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`);
  console.log(`   Commission Rate: ${commissionRate.toFixed(2)}%`);
  
  if (p.sampleOrders.length > 0) {
    console.log(`   Sample Orders with Commission:`);
    p.sampleOrders.forEach(s => {
      const rate = s.price > 0 ? (s.affComm / s.price * 100) : 0;
      console.log(`     - Order #${s.orderId}: Price Rp ${s.price.toLocaleString('id-ID')}, Commission Rp ${s.affComm.toLocaleString('id-ID')} (${rate.toFixed(1)}%, AffID: ${s.affId})`);
    });
  } else {
    console.log(`   ⚠️  No orders with commission data`);
  }
  console.log('');
});

console.log('═'.repeat(100));
console.log('\n📊 SUMMARY BY COMMISSION RATE:\n');

// Group by commission rate ranges
const rateGroups = {
  '0%': [],
  '1-10%': [],
  '11-20%': [],
  '21-30%': [],
  '31-40%': [],
  '41-50%': [],
  '50%+': []
};

sorted.forEach(p => {
  const avgPrice = p.totalRevenue / p.orders.length;
  const avgCommission = p.totalAffiliateCommission / p.orders.length;
  const rate = avgPrice > 0 ? (avgCommission / avgPrice * 100) : 0;
  
  if (rate === 0) rateGroups['0%'].push({ id: p.id, name: p.name, orders: p.orders.length });
  else if (rate <= 10) rateGroups['1-10%'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
  else if (rate <= 20) rateGroups['11-20%'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
  else if (rate <= 30) rateGroups['21-30%'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
  else if (rate <= 40) rateGroups['31-40%'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
  else if (rate <= 50) rateGroups['41-50%'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
  else rateGroups['50%+'].push({ id: p.id, name: p.name, orders: p.orders.length, rate });
});

Object.entries(rateGroups).forEach(([range, items]) => {
  if (items.length > 0) {
    console.log(`\n${range}: ${items.length} products`);
    items.slice(0, 10).forEach(item => {
      const rateStr = item.rate ? ` (${item.rate.toFixed(1)}%)` : '';
      console.log(`  - Product ${item.id}${rateStr}: ${item.orders} orders - ${item.name.substring(0, 50)}`);
    });
    if (items.length > 10) {
      console.log(`  ... and ${items.length - 10} more products`);
    }
  }
});

console.log('\n═'.repeat(100));
console.log('\n💡 COMMISSION RATE MAPPING FOR IMPORT:\n');

// Generate commission map for import script
const commissionMap = {};
sorted.forEach(p => {
  const avgPrice = p.totalRevenue / p.orders.length;
  const avgCommission = p.totalAffiliateCommission / p.orders.length;
  const rate = avgPrice > 0 ? (avgCommission / avgPrice) : 0;
  
  if (rate > 0) {
    commissionMap[p.id] = rate;
  }
});

console.log('// Add this to your import script:');
console.log('const COMMISSION_RATES = {');
Object.entries(commissionMap).forEach(([pid, rate]) => {
  console.log(`  ${pid}: ${rate.toFixed(4)}, // ${(rate * 100).toFixed(2)}%`);
});
console.log('};');
console.log('\n// Default commission if product not found:');
console.log('const DEFAULT_COMMISSION_RATE = 0.30; // 30%');
