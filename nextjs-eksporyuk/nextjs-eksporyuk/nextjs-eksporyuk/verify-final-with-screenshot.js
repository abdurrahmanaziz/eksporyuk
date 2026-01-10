const fs = require('fs');

console.log('🔍 VERIFIKASI FINAL DENGAN DATA SCREENSHOT TERBARU');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\n📊 DATA DARI SCREENSHOT (Semua Data):');
console.log('   Total Lead: 19,246');
console.log('   Total Sales: 12,839');
console.log('   Total Omset: Rp 4,122,334,962');
console.log('   Total Komisi: Rp 1,245,421,000');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// User map
const userMap = new Map();
sejoli.users.forEach(u => userMap.set(u.id, u));

// Calculate from Sejoli data - INCLUDING ALL affiliates (including owner)
console.log('\n\n📊 DATA DARI SEJOLI EXPORT:');
console.log('═══════════════════════════════════════════════════════════════');

// All orders
console.log(`Total Orders: ${sejoli.orders.length}`);

// Completed orders (Sales)
const completedOrders = sejoli.orders.filter(o => o.status === 'completed');
console.log(`Completed Orders (Sales): ${completedOrders.length}`);

// Orders with affiliate (Leads)
const ordersWithAffiliate = sejoli.orders.filter(o => o.affiliate_id > 0);
console.log(`Orders with Affiliate (Leads): ${ordersWithAffiliate.length}`);

// Completed orders with affiliate
const completedWithAffiliate = sejoli.orders.filter(o => o.status === 'completed' && o.affiliate_id > 0);
console.log(`Completed Orders with Affiliate: ${completedWithAffiliate.length}`);

// Total Omset from completed orders
const totalOmset = completedOrders.reduce((sum, o) => sum + o.grand_total, 0);
console.log(`\nTotal Omset (all completed): Rp ${totalOmset.toLocaleString('id-ID')}`);

// Omset from completed affiliate orders
const omsetAffiliate = completedWithAffiliate.reduce((sum, o) => sum + o.grand_total, 0);
console.log(`Omset dari Affiliate Orders: Rp ${omsetAffiliate.toLocaleString('id-ID')}`);

// Screenshot shows 12,839 sales - let's check what matches
console.log('\n\n🔍 MENCARI MATCH DENGAN SCREENSHOT:');
console.log('═══════════════════════════════════════════════════════════════');

console.log(`\nScreenshot Total Sales: 12,839`);
console.log(`Sejoli Completed Orders: ${completedOrders.length}`);
console.log(`Sejoli Completed with Affiliate: ${completedWithAffiliate.length}`);

// Maybe there's more data not in our export?
// Let's calculate commission with 34% rate for ALL completed orders (not just with affiliate)

// But wait - screenshot shows Total Lead 19,246 which is higher than our orders with affiliate
// This suggests the data might include more than what's in our export

// Let's calculate what we have
console.log('\n\n💰 KALKULASI KOMISI (34% dari Omset):');
console.log('═══════════════════════════════════════════════════════════════');

// For ALL completed orders with affiliate (including owner)
const totalKomisi34Pct = Math.round(omsetAffiliate * 0.34);
console.log(`Omset Affiliate: Rp ${omsetAffiliate.toLocaleString('id-ID')}`);
console.log(`Komisi 34%: Rp ${totalKomisi34Pct.toLocaleString('id-ID')}`);

// Let's try to match screenshot's Rp 1,245,421,000
const screenshotKomisi = 1245421000;
const screenshotOmset = 4122334962;

console.log(`\n📊 Reverse calculation from screenshot:`);
console.log(`   Screenshot Omset: Rp ${screenshotOmset.toLocaleString('id-ID')}`);
console.log(`   Screenshot Komisi: Rp ${screenshotKomisi.toLocaleString('id-ID')}`);
console.log(`   Implied Commission Rate: ${(screenshotKomisi / screenshotOmset * 100).toFixed(2)}%`);

// The rate is about 30.2%
const impliedRate = screenshotKomisi / screenshotOmset;

// Let's calculate with ALL completed affiliate orders INCLUDING owner
console.log('\n\n🎯 KALKULASI DENGAN SEMUA DATA (TERMASUK OWNER):');
console.log('═══════════════════════════════════════════════════════════════');

const COMMISSION_RATE = 0.302; // ~30.2% based on screenshot

const affiliateResults = {};
let totalOmsetAff = 0;
let totalKomisiAff = 0;

// Include ALL completed orders with affiliate (including owner azizbiasa)
completedWithAffiliate.forEach(o => {
  const user = userMap.get(o.affiliate_id);
  if (!user) return;
  
  const email = user.user_email;
  const commission = o.grand_total > 0 ? Math.round(o.grand_total * COMMISSION_RATE) : 0;
  
  totalOmsetAff += o.grand_total;
  totalKomisiAff += commission;
  
  if (!affiliateResults[email]) {
    affiliateResults[email] = {
      name: user.display_name,
      email: email,
      orders: 0,
      paidOrders: 0,
      freeOrders: 0,
      commission: 0,
      revenue: 0
    };
  }
  
  affiliateResults[email].orders++;
  affiliateResults[email].revenue += o.grand_total;
  affiliateResults[email].commission += commission;
  
  if (o.grand_total > 0) {
    affiliateResults[email].paidOrders++;
  } else {
    affiliateResults[email].freeOrders++;
  }
});

const sortedResults = Object.values(affiliateResults)
  .sort((a, b) => b.commission - a.commission);

console.log('\n👥 TOP 15 AFFILIATES (TERMASUK OWNER):');
sortedResults.slice(0, 15).forEach((aff, i) => {
  console.log(`\n${i+1}. ${aff.name}`);
  console.log(`   Email: ${aff.email}`);
  console.log(`   Orders: ${aff.orders} (${aff.paidOrders} paid, ${aff.freeOrders} free)`);
  console.log(`   Omset: Rp ${aff.revenue.toLocaleString('id-ID')}`);
  console.log(`   💰 Komisi: Rp ${aff.commission.toLocaleString('id-ID')}`);
});

console.log('\n\n💵 GRAND TOTAL (DARI DATA SEJOLI):');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Affiliates: ${sortedResults.length}`);
console.log(`Total Completed Affiliate Orders: ${completedWithAffiliate.length}`);
console.log(`Total Omset: Rp ${totalOmsetAff.toLocaleString('id-ID')}`);
console.log(`Total Komisi (30.2%): Rp ${totalKomisiAff.toLocaleString('id-ID')}`);

console.log('\n📊 PERBANDINGAN DENGAN SCREENSHOT:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`              | Screenshot    | Kalkulasi Saya | Selisih`);
console.log(`Total Sales   | 12,839        | ${completedWithAffiliate.length}          | ${12839 - completedWithAffiliate.length}`);
console.log(`Total Omset   | Rp 4,122,334,962 | Rp ${totalOmsetAff.toLocaleString('id-ID')} | Rp ${(4122334962 - totalOmsetAff).toLocaleString('id-ID')}`);
console.log(`Total Komisi  | Rp 1,245,421,000 | Rp ${totalKomisiAff.toLocaleString('id-ID')} | Rp ${(1245421000 - totalKomisiAff).toLocaleString('id-ID')}`);

// The difference might be because screenshot includes data after our export date
console.log('\n\n📅 CHECK EXPORT DATE VS SCREENSHOT DATE:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Sejoli export date: ${sejoli.exportDate || 'unknown'}`);
console.log(`Screenshot date: December 14, 2025 (17:50)`);

// Check latest order date in our export
const latestOrder = sejoli.orders.reduce((latest, o) => {
  const orderDate = new Date(o.created_at);
  return orderDate > latest ? orderDate : latest;
}, new Date(0));
console.log(`Latest order in export: ${latestOrder.toISOString()}`);

// Check how many orders after a certain date
const dec2025Orders = sejoli.orders.filter(o => {
  const date = new Date(o.created_at);
  return date >= new Date('2025-12-01');
});
console.log(`Orders in December 2025: ${dec2025Orders.length}`);

// Screenshot shows Dec 2025: 147 leads, 100 sales, Rp 88,157,000 omset, Rp 27,325,000 komisi
console.log('\n📊 DATA DECEMBER 2025 DARI SCREENSHOT:');
console.log('   Lead: 147, Sales: 100, Omset: Rp 88,157,000, Komisi: Rp 27,325,000');

const dec2025Completed = dec2025Orders.filter(o => o.status === 'completed' && o.affiliate_id > 0);
const dec2025Omset = dec2025Completed.reduce((sum, o) => sum + o.grand_total, 0);
console.log(`\nDari export: ${dec2025Completed.length} completed affiliate orders in Dec 2025`);
console.log(`Omset Dec 2025: Rp ${dec2025Omset.toLocaleString('id-ID')}`);
