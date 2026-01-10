const products = require('./sejoli-products-latest.json');

console.log('📦 ANALISIS PRODUK SEJOLI - KATEGORISASI MEMBERSHIP\n');
console.log('=' .repeat(100));

// Kategorisasi produk
const categories = {
  lifetime: [],
  '12_bulan': [],
  '6_bulan': [],
  renewal: [],
  event_webinar: [],
  jasa: [],
  tool: [],
  gratis: [],
  lainnya: []
};

// Rules untuk kategorisasi
products.forEach(p => {
  const id = p.id;
  const title = (p.title || '').toLowerCase();
  const price = p.product_raw_price || 0;
  const commission = p.affiliate?.['1']?.fee || 0;
  
  // Cek berdasarkan title dan pattern
  if (title.includes('lifetime') || title.includes('promo') && price >= 1500000) {
    categories.lifetime.push(p);
  } else if (title.includes('12 bulan') || title.match(/kelas ekspor.*12/)) {
    categories['12_bulan'].push(p);
  } else if (title.includes('6 bulan') || title.match(/kelas ekspor.*6/)) {
    categories['6_bulan'].push(p);
  } else if (title.includes('re kelas') || title.includes('renewal')) {
    categories.renewal.push(p);
  } else if (title.includes('webinar') || title.includes('zoom') || title.includes('kopdar') || title.includes('workshop') || title.includes('tiket')) {
    categories.event_webinar.push(p);
  } else if (title.includes('jasa') || title.includes('legalitas') || title.includes('katalog') || title.includes('company')) {
    categories.jasa.push(p);
  } else if (title.includes('automation') || title.includes('aplikasi') || title.includes('bundling')) {
    categories.tool.push(p);
  } else if (price === 0 || title.includes('gratis')) {
    categories.gratis.push(p);
  } else {
    categories.lainnya.push(p);
  }
});

// Print hasil
const catNames = {
  lifetime: '🏆 LIFETIME MEMBERSHIP (Web Baru: Premium Lifetime)',
  '12_bulan': '📅 12 BULAN MEMBERSHIP (Web Baru: Premium 12 Bulan)',
  '6_bulan': '📅 6 BULAN MEMBERSHIP (Web Baru: Premium 6 Bulan)',
  renewal: '🔄 RENEWAL (Perpanjangan)',
  event_webinar: '🎤 EVENT/WEBINAR/KOPDAR (Web Baru: User FREE)',
  jasa: '💼 JASA (Web Baru: User FREE)',
  tool: '🛠️ TOOL/APLIKASI (Web Baru: User FREE)',
  gratis: '🆓 GRATIS (Web Baru: User FREE)',
  lainnya: '❓ LAINNYA (Perlu review manual)'
};

Object.entries(categories).forEach(([key, prods]) => {
  console.log(`\n${catNames[key]}`);
  console.log('-'.repeat(100));
  if (prods.length === 0) {
    console.log('   (Tidak ada produk)');
  } else {
    prods.forEach(p => {
      const comm = p.affiliate?.['1']?.fee || 0;
      const commType = p.affiliate?.['1']?.type || 'none';
      console.log(`   ID:${p.id.toString().padEnd(6)} ${p.title.substring(0,45).padEnd(47)} Harga: Rp ${(p.product_raw_price || 0).toLocaleString().padStart(12)} | Komisi: ${commType} Rp ${comm.toLocaleString()}`);
    });
  }
});

// Summary untuk mapping ke NextJS
console.log('\n' + '=' .repeat(100));
console.log('📋 MAPPING UNTUK DATABASE NEXTJS:');
console.log('=' .repeat(100));

const mapping = {
  LIFETIME: categories.lifetime.map(p => p.id),
  MONTH_12: categories['12_bulan'].map(p => p.id),
  MONTH_6: categories['6_bulan'].map(p => p.id),
  RENEWAL: categories.renewal.map(p => p.id),
  FREE_USER: [
    ...categories.event_webinar.map(p => p.id),
    ...categories.jasa.map(p => p.id),
    ...categories.tool.map(p => p.id),
    ...categories.gratis.map(p => p.id)
  ],
  MANUAL_CHECK: categories.lainnya.map(p => p.id)
};

Object.entries(mapping).forEach(([key, ids]) => {
  console.log(`\n${key}: [${ids.join(', ')}]`);
});

// Export mapping
const fs = require('fs');
fs.writeFileSync('product-membership-mapping-latest.json', JSON.stringify(mapping, null, 2));
console.log('\n💾 Saved mapping to product-membership-mapping-latest.json');
