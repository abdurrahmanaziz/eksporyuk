const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

const orders = data.orders || [];
const users = data.users || [];

// Create user lookup
const userLookup = {};
users.forEach(u => {
  userLookup[u.ID] = u.display_name || u.user_email || `User ${u.ID}`;
});

// Commission mapping dari PRD
const commissionMap = {
  28: 0, 93: 0, 179: 250000, 1529: 0, 3840: 300000, 4684: 0, 6068: 0, 6810: 0,
  11207: 0, 13401: 325000, 15234: 0, 16956: 0, 17920: 250000, 19296: 0, 20852: 280000,
  8683: 300000, 13399: 250000, 8684: 250000, 13400: 200000,
  8910: 0, 8914: 0, 8915: 0,
  397: 0, 488: 0, 12994: 0, 13039: 0, 13045: 0, 16130: 0, 16860: 0, 16963: 0,
  17227: 0, 17322: 0, 17767: 100000, 18358: 0, 18528: 20000, 18705: 0, 18893: 0,
  19042: 50000, 20130: 50000, 20336: 0, 21476: 50000,
  2910: 0, 3764: 0, 4220: 0, 8686: 85000,
  5928: 0, 5932: 0, 5935: 0, 16581: 0, 16587: 0, 16592: 150000,
  300: 0, 16826: 0
};

// Calculate per affiliate
const affiliateData = {};

for (const order of orders) {
  if (order.status !== 'completed') continue;
  
  const affiliateId = order.affiliate_id;
  if (!affiliateId || affiliateId === 0) continue;
  
  const grandTotal = parseFloat(order.grand_total) || 0;
  const productId = order.product_id;
  const commission = commissionMap[productId] || 0;
  
  if (!affiliateData[affiliateId]) {
    affiliateData[affiliateId] = {
      id: affiliateId,
      name: userLookup[affiliateId] || `Affiliate ${affiliateId}`,
      omsetKotor: 0,  // Total penjualan yang dia bawa
      komisi: 0,       // Komisi yang dia dapat
      orderCount: 0
    };
  }
  
  affiliateData[affiliateId].omsetKotor += grandTotal;
  affiliateData[affiliateId].komisi += commission;
  affiliateData[affiliateId].orderCount++;
}

// Sort by omset
const sorted = Object.values(affiliateData).sort((a,b) => b.omsetKotor - a.omsetKotor);

console.log('📊 DETAIL AFFILIATE - OMSET & KOMISI (Completed Orders Only)');
console.log('='.repeat(100));
console.log(`${'No'.padEnd(4)} ${'Affiliate ID'.padEnd(12)} ${'Nama'.padEnd(30)} ${'Orders'.padEnd(8)} ${'Omset Kotor'.padStart(20)} ${'Komisi'.padStart(18)}`);
console.log('-'.repeat(100));

sorted.forEach((aff, i) => {
  // Calculate omset bersih (omset - komisi)
  const omsetBersih = aff.omsetKotor - aff.komisi;
  console.log(`${(i+1).toString().padEnd(4)} ${aff.id.toString().padEnd(12)} ${aff.name.substring(0,28).padEnd(30)} ${aff.orderCount.toString().padEnd(8)} Rp ${aff.omsetKotor.toLocaleString().padStart(16)} Rp ${aff.komisi.toLocaleString().padStart(14)}`);
});

// Summary
const totalOmsetKotor = sorted.reduce((s,a) => s + a.omsetKotor, 0);
const totalKomisi = sorted.reduce((s,a) => s + a.komisi, 0);
const totalOrders = sorted.reduce((s,a) => s + a.orderCount, 0);

console.log('\n' + '='.repeat(100));
console.log('📈 GRAND TOTAL');
console.log('='.repeat(100));
console.log(`  Total Affiliates:        ${sorted.length}`);
console.log(`  Total Orders:            ${totalOrders.toLocaleString()}`);
console.log(`  Total Omset Kotor:       Rp ${totalOmsetKotor.toLocaleString()}`);
console.log(`  Total Komisi Affiliate:  Rp ${totalKomisi.toLocaleString()}`);
console.log(`  Omset Bersih (- Komisi): Rp ${(totalOmsetKotor - totalKomisi).toLocaleString()}`);

// Top 10 dengan detail lengkap
console.log('\n' + '='.repeat(100));
console.log('🏆 TOP 10 AFFILIATES - DETAIL LENGKAP');
console.log('='.repeat(100));

sorted.slice(0, 10).forEach((aff, i) => {
  const omsetBersih = aff.omsetKotor - aff.komisi;
  console.log(`\n${i+1}. ${aff.name} (ID: ${aff.id})`);
  console.log(`   Orders:        ${aff.orderCount}`);
  console.log(`   Omset Kotor:   Rp ${aff.omsetKotor.toLocaleString()}`);
  console.log(`   Komisi:        Rp ${aff.komisi.toLocaleString()}`);
  console.log(`   Omset Bersih:  Rp ${omsetBersih.toLocaleString()}`);
});

console.log('\n✅ Analisis selesai!');
