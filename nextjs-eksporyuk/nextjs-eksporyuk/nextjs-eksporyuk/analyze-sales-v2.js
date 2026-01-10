const fs = require('fs');

// Baca file JSON yang sudah di-download
const data = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));

console.log(`Total orders: ${data.orders.length}`);

// Filter orders dengan status completed
const completedOrders = data.orders.filter(o => o.status === 'completed');
console.log(`Completed orders: ${completedOrders.length}`);

// Filter orders dengan affiliate
const ordersWithAffiliate = data.orders.filter(o => o.affiliate_id && o.affiliate_id > 0);
console.log(`Orders dengan affiliate: ${ordersWithAffiliate.length}`);

// Filter completed dengan affiliate
const completedWithAffiliate = completedOrders.filter(o => o.affiliate_id && o.affiliate_id > 0);
console.log(`Completed dengan affiliate: ${completedWithAffiliate.length}`);

// Hitung komisi per affiliate dari completed orders
const affiliateStats = new Map();

completedWithAffiliate.forEach(o => {
  const affId = o.affiliate_id;
  const affName = o.affiliate_name || 'Unknown';
  
  // Get commission from product.affiliate
  let commission = 0;
  if (o.product && o.product.affiliate) {
    const affSetting = o.product.affiliate['1'] || o.product.affiliate;
    if (affSetting && affSetting.fee) {
      commission = Number(affSetting.fee) || 0;
    }
  }
  
  if (!affiliateStats.has(affId)) {
    affiliateStats.set(affId, { 
      name: affName, 
      totalCommission: 0, 
      orderCount: 0,
      totalSales: 0
    });
  }
  
  const stats = affiliateStats.get(affId);
  stats.totalCommission += commission;
  stats.orderCount++;
  stats.totalSales += Number(o.grand_total) || 0;
});

console.log(`\n=== TOP 20 AFFILIATES (berdasarkan product.affiliate.fee) ===`);
const sorted = [...affiliateStats.entries()]
  .sort((a, b) => b[1].totalCommission - a[1].totalCommission);

sorted.slice(0, 20).forEach(([id, stats], i) => {
  console.log(`${i+1}. ${stats.name} (ID:${id}) | Orders: ${stats.orderCount} | Komisi: Rp ${stats.totalCommission.toLocaleString('id-ID')} | Sales: Rp ${stats.totalSales.toLocaleString('id-ID')}`);
});

// Hitung total
const totalCommission = sorted.reduce((sum, [, s]) => sum + s.totalCommission, 0);
const totalSales = sorted.reduce((sum, [, s]) => sum + s.totalSales, 0);
console.log(`\n--- TOTAL ---`);
console.log(`Total Affiliates: ${affiliateStats.size}`);
console.log(`Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
console.log(`Total Sales dari Affiliates: Rp ${totalSales.toLocaleString('id-ID')}`);

// Cek sample order untuk lihat struktur affiliate
console.log('\n=== Sample Order dengan Affiliate ===');
const sample = completedWithAffiliate[0];
if (sample) {
  console.log(`Order ID: ${sample.ID}`);
  console.log(`Status: ${sample.status}`);
  console.log(`Affiliate ID: ${sample.affiliate_id}`);
  console.log(`Affiliate Name: ${sample.affiliate_name}`);
  console.log(`Product ID: ${sample.product_id}`);
  console.log(`Product Name: ${sample.product?.post_title || sample.product_name}`);
  console.log(`Grand Total: ${sample.grand_total}`);
  console.log(`Product Affiliate Setting:`, JSON.stringify(sample.product?.affiliate || {}, null, 2));
}

