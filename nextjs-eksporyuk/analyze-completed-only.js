const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));

// HANYA COMPLETED ORDERS
const completedWithAffiliate = data.orders.filter(o => 
  o.status === 'completed' && 
  o.affiliate_id && 
  o.affiliate_id > 0
);

console.log('=== ANALISIS RAHMAT - HANYA COMPLETED ===');
const rahmatCompleted = completedWithAffiliate.filter(o => o.affiliate_id === 1637);
console.log(`Completed orders: ${rahmatCompleted.length}`);

// Group by product
const productStats = {};
rahmatCompleted.forEach(o => {
  const productId = o.product_id;
  const productName = o.product_name;
  if (!productStats[productId]) {
    productStats[productId] = {
      name: productName,
      count: 0,
      affiliateFee: 0
    };
  }
  productStats[productId].count++;
  
  if (o.product?.affiliate) {
    const setting = o.product.affiliate['1'] || o.product.affiliate;
    productStats[productId].affiliateFee = setting?.fee || 0;
  }
});

console.log('\nBreakdown by product (COMPLETED ONLY):');
Object.entries(productStats).forEach(([id, s]) => {
  const calcCommission = s.count * s.affiliateFee;
  console.log(`- Product ${id} (${s.name}): ${s.count} orders x Rp ${s.affiliateFee.toLocaleString('id-ID')} = Rp ${calcCommission.toLocaleString('id-ID')}`);
});

const totalCalc = Object.values(productStats).reduce((sum, s) => sum + (s.count * s.affiliateFee), 0);
console.log(`\nTotal COMPLETED: Rp ${totalCalc.toLocaleString('id-ID')}`);
console.log(`Live dashboard: Rp 169,595,000`);
console.log(`Difference: Rp ${(169595000 - totalCalc).toLocaleString('id-ID')}`);

console.log('\n\n=== TOP 20 AFFILIATES (COMPLETED ONLY) ===');

// Hitung semua affiliate
const affiliateStats = new Map();
completedWithAffiliate.forEach(o => {
  const affId = o.affiliate_id;
  const affName = o.affiliate_name || 'Unknown';
  
  let commission = 0;
  if (o.product?.affiliate) {
    const setting = o.product.affiliate['1'] || o.product.affiliate;
    commission = Number(setting?.fee) || 0;
  }
  
  if (!affiliateStats.has(affId)) {
    affiliateStats.set(affId, { name: affName, total: 0, count: 0 });
  }
  affiliateStats.get(affId).total += commission;
  affiliateStats.get(affId).count++;
});

const sorted = [...affiliateStats.entries()].sort((a, b) => b[1].total - a[1].total);
sorted.slice(0, 20).forEach(([id, s], i) => {
  console.log(`${i+1}. ${s.name} (ID:${id}) | ${s.count} orders | Rp ${s.total.toLocaleString('id-ID')}`);
});

// Bandingkan dengan screenshot user
console.log('\n\n=== PERBANDINGAN DENGAN LIVE ===');
console.log('Live Screenshot:');
console.log('1. Rahmat Al Fianto = Rp 169,595,000');
console.log('2. Asep Abdurrahman Wahid = Rp 165,015,000');
console.log('3. Sutisna = Rp 132,825,000');
console.log('4. Hamid Baidowi = Rp 131,610,000');
console.log('5. Yoga Andrian = Rp 93,610,000');

