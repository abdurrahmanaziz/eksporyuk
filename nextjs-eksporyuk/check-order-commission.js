const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('=== TRANSAKSI COMPLETED DENGAN AFFILIATE ===\n');

// Filter transaksi completed dengan affiliate
const completedWithAff = data.orders.filter(o => o.status === 'completed' && o.affiliate_id);
console.log('Total transaksi completed dengan affiliate:', completedWithAff.length);

console.log('\n=== SAMPLE 10 TRANSAKSI ===');
for (let i = 0; i < 10; i++) {
  const o = completedWithAff[i];
  if (!o) break;
  
  // Cari affiliate
  const aff = data.affiliates.find(a => a.user_id == o.affiliate_id);
  
  console.log(`\n--- Order ${i+1} ---`);
  console.log('Order ID:', o.id);
  console.log('Product ID:', o.product_id);
  console.log('Grand Total:', o.grand_total);
  console.log('Affiliate ID:', o.affiliate_id);
  console.log('Affiliate Name:', aff?.display_name || 'N/A');
  console.log('All fields:', Object.keys(o));
}

console.log('\n=== SATU ORDER LENGKAP (JSON) ===');
console.log(JSON.stringify(completedWithAff[0], null, 2));

// Cek apakah ada field tersembunyi atau nested
console.log('\n=== CEK NESTED OBJECT ===');
const sample = completedWithAff[0];
for (const key in sample) {
  if (typeof sample[key] === 'object' && sample[key] !== null) {
    console.log(`${key}:`, sample[key]);
  }
}
