const fs = require('fs');

const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
const commissionMap = JSON.parse(fs.readFileSync('product-commission-map.json', 'utf8'));

// HANYA COMPLETED ORDERS dengan affiliate
const completed = sales.orders.filter(o => 
  o.status === 'completed' && 
  o.affiliate_id && 
  o.affiliate_id > 0
);

console.log(`Total completed orders dengan affiliate: ${completed.length}`);

// Hitung dengan commission map
const affiliateStats = new Map();

completed.forEach(o => {
  const affId = o.affiliate_id;
  const affName = o.affiliate_name || 'Unknown';
  const productId = String(o.product_id);
  
  // Prioritas: commission map > product.affiliate.fee
  let commission = 0;
  if (commissionMap[productId]) {
    commission = commissionMap[productId].commission;
  } else if (o.product?.affiliate) {
    const setting = o.product.affiliate['1'] || o.product.affiliate;
    commission = Number(setting?.fee) || 0;
  }
  
  if (!affiliateStats.has(affId)) {
    affiliateStats.set(affId, { name: affName, total: 0, count: 0 });
  }
  affiliateStats.get(affId).total += commission;
  affiliateStats.get(affId).count++;
});

console.log('\n=== TOP 20 AFFILIATES (dengan Commission Map) ===');
const sorted = [...affiliateStats.entries()].sort((a, b) => b[1].total - a[1].total);
sorted.slice(0, 20).forEach(([id, s], i) => {
  console.log(`${i+1}. ${s.name} (ID:${id}) | ${s.count} orders | Rp ${s.total.toLocaleString('id-ID')}`);
});

// Detail Rahmat
console.log('\n\n=== DETAIL RAHMAT AL FIANTO ===');
const rahmatOrders = completed.filter(o => o.affiliate_id === 1637);
const productBreakdown = {};
rahmatOrders.forEach(o => {
  const pid = String(o.product_id);
  if (!productBreakdown[pid]) {
    productBreakdown[pid] = { name: o.product_name, count: 0 };
  }
  productBreakdown[pid].count++;
});

let rahmatTotal = 0;
Object.entries(productBreakdown).forEach(([pid, p]) => {
  const commission = commissionMap[pid]?.commission || 0;
  const subtotal = p.count * commission;
  rahmatTotal += subtotal;
  console.log(`- ${pid} (${p.name}): ${p.count} x Rp ${commission.toLocaleString('id-ID')} = Rp ${subtotal.toLocaleString('id-ID')}`);
});
console.log(`\nTotal Rahmat: Rp ${rahmatTotal.toLocaleString('id-ID')}`);
console.log(`Live: Rp 169,595,000`);
console.log(`Difference: Rp ${(169595000 - rahmatTotal).toLocaleString('id-ID')}`);

// Perbandingan Live
console.log('\n\n=== PERBANDINGAN ===');
const liveData = [
  { name: 'Rahmat Al Fianto', live: 169595000 },
  { name: 'Asep Abdurrahman Wahid', live: 165015000 },
  { name: 'Sutisna', live: 132825000 },
  { name: 'Hamid Baidowi', live: 131610000 },
  { name: 'Yoga Andrian', live: 93610000 },
];

liveData.forEach(l => {
  const calc = sorted.find(([, s]) => s.name.includes(l.name.split(' ')[0]));
  if (calc) {
    const diff = l.live - calc[1].total;
    console.log(`${l.name}: Live=${l.live.toLocaleString('id-ID')} | Calc=${calc[1].total.toLocaleString('id-ID')} | Diff=${diff.toLocaleString('id-ID')}`);
  }
});

