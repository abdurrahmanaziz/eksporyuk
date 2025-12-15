const fs = require('fs');

console.log('📊 ANALYZING SEJOLI AFFILIATE DATA...\n');

const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Ambil completed orders dengan affiliate
const completedOrders = sejoli.orders.filter(o => 
  o.status === 'completed' && o.affiliate_id
);

// Group by affiliate_id
const affiliateOrders = {};
completedOrders.forEach(order => {
  const affId = order.affiliate_id;
  if (!affiliateOrders[affId]) {
    affiliateOrders[affId] = {
      orders: [],
      totalSales: 0
    };
  }
  affiliateOrders[affId].orders.push(order);
  affiliateOrders[affId].totalSales += order.grand_total || 0;
});

console.log('📦 SEJOLI COMPLETED ORDERS WITH AFFILIATE:');
console.log('Total Orders:', completedOrders.length);
console.log('Unique Affiliates:', Object.keys(affiliateOrders).length);

// Top 10 affiliates
const sorted = Object.entries(affiliateOrders)
  .sort((a, b) => b[1].totalSales - a[1].totalSales)
  .slice(0, 10);

console.log('\n🏆 TOP 10 AFFILIATES IN SEJOLI:\n');
sorted.forEach(([affId, data], i) => {
  const aff = sejoli.affiliates.find(a => a.id == affId);
  console.log(`${i+1}. ${aff?.user_email || 'Unknown'}`);
  console.log(`   Name: ${aff?.display_name || 'N/A'}`);
  console.log(`   Orders: ${data.orders.length}`);
  console.log(`   Sales: Rp ${data.totalSales.toLocaleString('id-ID')}`);
  console.log('');
});

// Total sales
const totalSales = Object.values(affiliateOrders).reduce((sum, a) => sum + a.totalSales, 0);
console.log('💰 TOTAL AFFILIATE SALES: Rp', totalSales.toLocaleString('id-ID'));
