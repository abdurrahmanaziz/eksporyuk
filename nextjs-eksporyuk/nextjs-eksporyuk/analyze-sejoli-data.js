const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('📊 ANALISIS DATA SEJOLI (Export 9 Dec 2024)');
console.log('='.repeat(70));

// Get orders
const orders = data.orders || [];
console.log(`\nTotal Orders: ${orders.length}`);

// Status breakdown
const statusCounts = {};
let omsetKotor = 0;
let omsetBersih = 0;
const affiliateSales = {};
const affiliateCommissions = {};
const productSales = {};

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

for (const order of orders) {
  const status = order.status || 'unknown';
  const grandTotal = parseFloat(order.grand_total) || 0;
  const affiliateId = order.affiliate_id;
  const productId = order.product_id;
  const productName = order.product_name || 'Unknown';
  
  // Count status
  statusCounts[status] = (statusCounts[status] || 0) + 1;
  
  // Omset kotor (semua status)
  omsetKotor += grandTotal;
  
  if (status === 'completed') {
    omsetBersih += grandTotal;
    
    // Track per product
    if (!productSales[productId]) {
      productSales[productId] = { name: productName, total: 0, count: 0 };
    }
    productSales[productId].total += grandTotal;
    productSales[productId].count++;
    
    // Track affiliate sales & commission
    if (affiliateId && affiliateId > 0) {
      const affKey = affiliateId;
      if (!affiliateSales[affKey]) {
        affiliateSales[affKey] = { id: affiliateId, omsetKotor: 0, orderCount: 0, commission: 0 };
      }
      affiliateSales[affKey].omsetKotor += grandTotal;
      affiliateSales[affKey].orderCount++;
      
      // Calculate commission
      const commission = commissionMap[productId] || 0;
      affiliateSales[affKey].commission += commission;
    }
  }
}

// Print status
console.log('\n📈 STATUS BREAKDOWN:');
for (const [status, count] of Object.entries(statusCounts).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${status.padEnd(20)}: ${count.toLocaleString()} orders`);
}

// Print omset
console.log('\n' + '='.repeat(70));
console.log('💰 OMSET SUMMARY');
console.log('='.repeat(70));
console.log(`  Omset KOTOR (Semua Status):    Rp ${omsetKotor.toLocaleString()}`);
console.log(`  Omset BERSIH (Completed Only): Rp ${omsetBersih.toLocaleString()}`);

// Sort affiliates
const sortedAff = Object.values(affiliateSales).sort((a,b) => b.omsetKotor - a.omsetKotor);

console.log('\n' + '='.repeat(70));
console.log('👥 TOP 30 AFFILIATES (OMSET & KOMISI dari Completed Orders)');
console.log('='.repeat(70));
console.log(`${'No'.padEnd(4)} ${'Aff ID'.padEnd(10)} ${'Orders'.padEnd(8)} ${'Omset Kotor'.padStart(18)} ${'Komisi'.padStart(16)}`);
console.log('-'.repeat(70));

sortedAff.slice(0, 30).forEach((aff, i) => {
  console.log(`${(i+1).toString().padEnd(4)} ${aff.id.toString().padEnd(10)} ${aff.orderCount.toString().padEnd(8)} Rp ${aff.omsetKotor.toLocaleString().padStart(14)} Rp ${aff.commission.toLocaleString().padStart(12)}`);
});

// Summary
const totalAffCount = sortedAff.length;
const totalAffOmset = sortedAff.reduce((s,a) => s + a.omsetKotor, 0);
const totalAffCommission = sortedAff.reduce((s,a) => s + a.commission, 0);
const totalAffOrders = sortedAff.reduce((s,a) => s + a.orderCount, 0);

console.log('\n' + '='.repeat(70));
console.log('📊 AFFILIATE SUMMARY');
console.log('='.repeat(70));
console.log(`  Total Affiliates:              ${totalAffCount}`);
console.log(`  Total Orders via Affiliate:    ${totalAffOrders.toLocaleString()}`);
console.log(`  Total Omset via Affiliate:     Rp ${totalAffOmset.toLocaleString()}`);
console.log(`  Total Komisi Affiliate:        Rp ${totalAffCommission.toLocaleString()}`);
console.log(`  % Omset dari Affiliate:        ${((totalAffOmset/omsetBersih)*100).toFixed(2)}%`);

// Founder/CoFounder calculation
const sisaSetelahKomisi = omsetBersih - totalAffCommission;
const adminFee = Math.round(sisaSetelahKomisi * 0.15);
const sisaUntukFounder = sisaSetelahKomisi - adminFee;
const founderShare = Math.round(sisaUntukFounder * 0.60);
const coFounderShare = Math.round(sisaUntukFounder * 0.40);

console.log('\n' + '='.repeat(70));
console.log('💼 REVENUE SPLIT (Sesuai PRD)');
console.log('='.repeat(70));
console.log(`  Omset Bersih (Completed):      Rp ${omsetBersih.toLocaleString()}`);
console.log(`  - Komisi Affiliate:            Rp ${totalAffCommission.toLocaleString()}`);
console.log(`  = Sisa setelah komisi:         Rp ${sisaSetelahKomisi.toLocaleString()}`);
console.log(`  - Admin Fee (15%):             Rp ${adminFee.toLocaleString()}`);
console.log(`  = Sisa untuk Founder:          Rp ${sisaUntukFounder.toLocaleString()}`);
console.log(`    → Founder (60%):             Rp ${founderShare.toLocaleString()}`);
console.log(`    → Co-Founder (40%):          Rp ${coFounderShare.toLocaleString()}`);

// Top products
console.log('\n' + '='.repeat(70));
console.log('🛍️ TOP 15 PRODUCTS (by Revenue)');
console.log('='.repeat(70));
const sortedProds = Object.entries(productSales).sort((a,b) => b[1].total - a[1].total);
sortedProds.slice(0, 15).forEach(([id, prod], i) => {
  console.log(`  ${(i+1).toString().padEnd(3)} ID:${id.padEnd(6)} ${prod.name.substring(0,25).padEnd(25)} ${prod.count.toString().padEnd(6)} orders  Rp ${prod.total.toLocaleString()}`);
});

console.log('\n✅ Analisis selesai!');
