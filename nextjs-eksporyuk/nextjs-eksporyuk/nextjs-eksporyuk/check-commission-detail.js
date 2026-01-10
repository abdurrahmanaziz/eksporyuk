const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('=== CEK SEMUA ROOT LEVEL DATA ===\n');

console.log('Keys di root:', Object.keys(data));

// Cek stats
console.log('\n=== STATS OBJECT ===');
console.log(JSON.stringify(data.stats, null, 2));

// Cek commissions lebih detail
console.log('\n=== COMMISSIONS ===');
console.log('Type:', typeof data.commissions);
console.log('Is Array:', Array.isArray(data.commissions));
console.log('Length:', data.commissions ? data.commissions.length : 'N/A');

if (data.commissions && data.commissions.length > 0) {
  console.log('\n=== SAMPLE COMMISSION DATA ===');
  console.log(JSON.stringify(data.commissions[0], null, 2));
}

// Cek apakah ada field commission di stats
if (data.stats && data.stats.commissions) {
  console.log('\n=== STATS.COMMISSIONS ===');
  console.log(JSON.stringify(data.stats.commissions, null, 2));
}

// Cek apakah affiliate punya total komisi
console.log('\n=== CEK AFFILIATE DATA (5 SAMPLE) ===');
for (let i = 0; i < 5; i++) {
  const aff = data.affiliates[i];
  console.log(`\nAffiliate ${i+1}:`);
  console.log(JSON.stringify(aff, null, 2));
}

// Hitung total grand_total untuk transaksi dengan affiliate
const completedWithAff = data.orders.filter(o => o.status === 'completed' && o.affiliate_id);
const totalSales = completedWithAff.reduce((sum, o) => sum + o.grand_total, 0);

console.log('\n=== STATISTIK TRANSAKSI AFFILIATE ===');
console.log('Total transaksi completed dengan affiliate:', completedWithAff.length);
console.log('Total sales (grand_total):', totalSales.toLocaleString('id-ID'));

// Group by affiliate untuk lihat komisi per affiliate
const affGroups = {};
completedWithAff.forEach(o => {
  if (!affGroups[o.affiliate_id]) {
    affGroups[o.affiliate_id] = {
      count: 0,
      totalSales: 0
    };
  }
  affGroups[o.affiliate_id].count++;
  affGroups[o.affiliate_id].totalSales += o.grand_total;
});

console.log('\n=== SAMPLE 5 AFFILIATE DENGAN TRANSAKSI ===');
const affIds = Object.keys(affGroups).slice(0, 5);
for (const affId of affIds) {
  const aff = data.affiliates.find(a => a.user_id == affId);
  console.log({
    affiliate_id: affId,
    name: aff?.display_name || 'N/A',
    total_orders: affGroups[affId].count,
    total_sales: affGroups[affId].totalSales
  });
}
