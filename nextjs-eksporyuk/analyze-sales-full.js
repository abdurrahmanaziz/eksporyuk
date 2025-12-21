const fs = require('fs');

// Load raw data yang sudah di-download
const rawData = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));

console.log('📊 ANALISIS DATA SALES SEJOLI TERBARU (17 Desember 2025)\n');
console.log('Response keys:', Object.keys(rawData));
console.log('Records Total:', rawData.recordsTotal);
console.log('Records Filtered:', rawData.recordsFiltered);

// Get orders from correct key
const orders = rawData.orders || rawData.data || [];
console.log(`\nTotal Orders in data: ${orders.length}`);

if (orders.length === 0) {
  console.log('❌ No orders found in data!');
  process.exit(1);
}

// Load product mapping
const productMapping = JSON.parse(fs.readFileSync('product-membership-mapping-latest.json', 'utf8'));

// Load products for commission lookup
const products = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));
const productCommissions = {};
products.forEach(p => {
  const fee = p.affiliate?.['1']?.fee || 0;
  const type = p.affiliate?.['1']?.type || 'none';
  productCommissions[p.id] = { fee, type };
});

// Analyze
const statusCount = {};
let omsetKotor = 0;
let omsetBersih = 0;
const affiliates = {};
const productRevenue = {};

orders.forEach(order => {
  const status = order.status || 'unknown';
  const grandTotal = parseFloat(order.grand_total) || 0;
  const productId = order.product_id;
  const productName = order.product_name || `Product ${productId}`;
  const affiliateId = order.affiliate_id;
  const affiliateName = order.affiliate_name;
  
  statusCount[status] = (statusCount[status] || 0) + 1;
  omsetKotor += grandTotal;
  
  if (status === 'completed') {
    omsetBersih += grandTotal;
    
    // Track products
    if (productId) {
      if (!productRevenue[productId]) {
        productRevenue[productId] = { id: productId, name: productName, revenue: 0, count: 0 };
      }
      productRevenue[productId].revenue += grandTotal;
      productRevenue[productId].count++;
    }
    
    // Track affiliates with commission calculation
    if (affiliateId && affiliateId > 0) {
      if (!affiliates[affiliateId]) {
        affiliates[affiliateId] = {
          id: affiliateId,
          name: affiliateName || `Affiliate ${affiliateId}`,
          omsetKotor: 0,
          komisi: 0,
          count: 0
        };
      }
      affiliates[affiliateId].omsetKotor += grandTotal;
      affiliates[affiliateId].count++;
      
      // Calculate commission based on product
      const commInfo = productCommissions[productId];
      if (commInfo) {
        if (commInfo.type === 'fixed') {
          affiliates[affiliateId].komisi += commInfo.fee;
        } else if (commInfo.type === 'percentage') {
          affiliates[affiliateId].komisi += Math.round(grandTotal * commInfo.fee / 100);
        }
      }
    }
  }
});

// Print results
console.log('\n' + '='.repeat(100));
console.log('📈 STATUS BREAKDOWN');
console.log('='.repeat(100));
Object.entries(statusCount).sort((a,b) => b[1]-a[1]).forEach(([s, c]) => {
  console.log(`  ${s.padEnd(20)}: ${c.toLocaleString()}`);
});

console.log('\n' + '='.repeat(100));
console.log('💰 OMSET SUMMARY');
console.log('='.repeat(100));
console.log(`  Omset KOTOR (Semua Status):    Rp ${omsetKotor.toLocaleString()}`);
console.log(`  Omset BERSIH (Completed Only): Rp ${omsetBersih.toLocaleString()}`);

// Top affiliates
const sortedAff = Object.values(affiliates).sort((a,b) => b.omsetKotor - a.omsetKotor);
const totalKomisi = sortedAff.reduce((s, a) => s + a.komisi, 0);
const totalAffOmset = sortedAff.reduce((s, a) => s + a.omsetKotor, 0);

console.log('\n' + '='.repeat(100));
console.log('👥 TOP 20 AFFILIATES (OMSET & KOMISI)');
console.log('='.repeat(100));
console.log(`${'No'.padEnd(4)} ${'Nama Affiliate'.padEnd(35)} ${'Orders'.padEnd(8)} ${'Omset Kotor'.padStart(20)} ${'Komisi'.padStart(18)}`);
console.log('-'.repeat(100));

sortedAff.slice(0, 20).forEach((a, i) => {
  const omsetBersihAff = a.omsetKotor - a.komisi;
  console.log(`${(i+1).toString().padEnd(4)} ${(a.name || 'Unknown').substring(0,33).padEnd(35)} ${a.count.toString().padEnd(8)} Rp ${a.omsetKotor.toLocaleString().padStart(16)} Rp ${a.komisi.toLocaleString().padStart(14)}`);
});

console.log('\n' + '='.repeat(100));
console.log('📊 AFFILIATE SUMMARY');
console.log('='.repeat(100));
console.log(`  Total Affiliates:              ${sortedAff.length}`);
console.log(`  Total Orders via Affiliate:    ${sortedAff.reduce((s,a) => s + a.count, 0).toLocaleString()}`);
console.log(`  Total Omset via Affiliate:     Rp ${totalAffOmset.toLocaleString()}`);
console.log(`  Total Komisi Affiliate:        Rp ${totalKomisi.toLocaleString()}`);
console.log(`  % Omset dari Affiliate:        ${((totalAffOmset/omsetBersih)*100).toFixed(2)}%`);

// Revenue split calculation
const sisaSetelahKomisi = omsetBersih - totalKomisi;
const adminFee = Math.round(sisaSetelahKomisi * 0.15);
const sisaUntukFounder = sisaSetelahKomisi - adminFee;
const founderShare = Math.round(sisaUntukFounder * 0.60);
const coFounderShare = Math.round(sisaUntukFounder * 0.40);

console.log('\n' + '='.repeat(100));
console.log('💼 REVENUE SPLIT (Sesuai PRD)');
console.log('='.repeat(100));
console.log(`  Omset Bersih (Completed):      Rp ${omsetBersih.toLocaleString()}`);
console.log(`  - Komisi Affiliate:            Rp ${totalKomisi.toLocaleString()}`);
console.log(`  = Sisa setelah komisi:         Rp ${sisaSetelahKomisi.toLocaleString()}`);
console.log(`  - Admin Fee (15%):             Rp ${adminFee.toLocaleString()}`);
console.log(`  = Sisa untuk Founder:          Rp ${sisaUntukFounder.toLocaleString()}`);
console.log(`    → Founder (60%):             Rp ${founderShare.toLocaleString()}`);
console.log(`    → Co-Founder (40%):          Rp ${coFounderShare.toLocaleString()}`);

// Top products
const sortedProd = Object.values(productRevenue).sort((a,b) => b.revenue - a.revenue);
console.log('\n' + '='.repeat(100));
console.log('🛍️ TOP 15 PRODUCTS (by Revenue)');
console.log('='.repeat(100));
sortedProd.slice(0, 15).forEach((p, i) => {
  const commInfo = productCommissions[p.id] || { fee: 0, type: 'none' };
  console.log(`  ${(i+1).toString().padEnd(3)} ID:${p.id.toString().padEnd(6)} ${(p.name || 'Unknown').substring(0,35).padEnd(37)} ${p.count.toString().padEnd(6)} orders  Rp ${p.revenue.toLocaleString()}`);
});

// Save all data
fs.writeFileSync('analysis-affiliates-full.json', JSON.stringify(sortedAff, null, 2));
fs.writeFileSync('analysis-products-revenue.json', JSON.stringify(sortedProd, null, 2));

console.log('\n💾 Data saved to:');
console.log('   - analysis-affiliates-full.json');
console.log('   - analysis-products-revenue.json');
console.log('\n✅ Analisis selesai!');
