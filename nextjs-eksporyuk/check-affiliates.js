const fs=require('fs');
const d=JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json','utf8'));

console.log('=== Cek Data Affiliate di Users ===\n');

// Cek user yang punya affiliate_code
const usersWithAffCode = d.users.filter(u => u.affiliate_code && u.affiliate_code.trim() !== '');
console.log(`Users dengan affiliate_code: ${usersWithAffCode.length} / ${d.users.length}`);
console.log('\nSample user dengan affiliate code:');
if(usersWithAffCode.length > 0) {
  console.log(JSON.stringify(usersWithAffCode[0], null, 2));
}

// Cek order yang punya affiliate_id
const ordersWithAff = d.orders.filter(o => o.affiliate_id && o.affiliate_id > 0);
console.log(`\nOrders dengan affiliate: ${ordersWithAff.length} / ${d.orders.length}`);

// Unique affiliates
const uniqueAffiliates = new Set();
ordersWithAff.forEach(o => uniqueAffiliates.add(o.affiliate_id));
console.log(`Unique affiliate IDs: ${uniqueAffiliates.size}`);

// Orders completed dengan affiliate
const completedWithAff = ordersWithAff.filter(o => o.status === 'completed');
console.log(`Completed orders dengan affiliate: ${completedWithAff.length}`);

// Cek apakah affiliate_id match dengan user ID
console.log('\n=== Verifikasi Affiliate IDs ===');
const affIds = Array.from(uniqueAffiliates).slice(0, 10);
affIds.forEach(aid => {
  const user = d.users.find(u => u.id === aid);
  const orders = ordersWithAff.filter(o => o.affiliate_id === aid && o.status === 'completed');
  console.log(`Affiliate ID ${aid}: ${user ? 'User exists' : 'NO USER'}, Completed orders: ${orders.length}`);
});

// Total transaksi per affiliate (yang completed)
console.log('\n=== Top 10 Affiliates by Completed Orders ===');
const affStats = {};
completedWithAff.forEach(o => {
  if(!affStats[o.affiliate_id]) affStats[o.affiliate_id] = {count: 0, totalAmount: 0};
  affStats[o.affiliate_id].count++;
  affStats[o.affiliate_id].totalAmount += o.grand_total || 0;
});

Object.keys(affStats)
  .sort((a,b) => affStats[b].count - affStats[a].count)
  .slice(0, 10)
  .forEach(aid => {
    const user = d.users.find(u => u.id === parseInt(aid));
    console.log(`Affiliate ${aid} (${user ? user.user_email : 'unknown'}): ${affStats[aid].count} orders, Total: Rp ${affStats[aid].totalAmount.toLocaleString()}`);
  });
