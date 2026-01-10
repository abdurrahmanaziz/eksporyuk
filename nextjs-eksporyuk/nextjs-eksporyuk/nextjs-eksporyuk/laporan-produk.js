const { PRODUCT_MEMBERSHIP_MAPPING } = require('./scripts/migration/product-membership-mapping.js');

console.log('=== KATEGORI PRODUK SEJOLI ===\n');

// Group by type
const grouped = {};
for (const [id, product] of Object.entries(PRODUCT_MEMBERSHIP_MAPPING)) {
  const type = product.type;
  if (!grouped[type]) grouped[type] = [];
  grouped[type].push({ id: parseInt(id), ...product });
}

// LIFETIME
console.log('📦 LIFETIME MEMBERSHIP (user dapat membership lifetime):');
console.log('Total:', grouped.membership?.filter(p => p.duration === null && p.type === 'membership').length || 0);
grouped.membership?.filter(p => p.duration === null && p.type === 'membership').forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// 12 BULAN
console.log('\n📅 12 BULAN MEMBERSHIP (user dapat 12 bulan):');
const m12 = grouped.membership?.filter(p => p.duration === 365) || [];
console.log('Total:', m12.length);
m12.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// 6 BULAN
console.log('\n📅 6 BULAN MEMBERSHIP (user dapat 6 bulan):');
const m6 = grouped.membership?.filter(p => p.duration === 180) || [];
console.log('Total:', m6.length);
m6.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// RENEWAL
console.log('\n🔄 RENEWAL (perpanjangan membership existing):');
console.log('Total:', grouped.renewal?.length || 0);
grouped.renewal?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// EVENT/WEBINAR
console.log('\n🎤 EVENT/WEBINAR/ZOOMINAR (user FREE di web baru):');
console.log('Total:', grouped.event?.length || 0);
grouped.event?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// TOOL
console.log('\n🛠️  TOOL/APLIKASI (tidak dapat membership):');
console.log('Total:', grouped.tool?.length || 0);
grouped.tool?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// SERVICE
console.log('\n💼 JASA (tidak dapat membership):');
console.log('Total:', grouped.service?.length || 0);
grouped.service?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// FREE
console.log('\n🆓 GRATIS (tidak dapat membership):');
console.log('Total:', grouped.free?.length || 0);
grouped.free?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

// OTHER
console.log('\n🎯 LAINNYA:');
console.log('Total:', grouped.other?.length || 0);
grouped.other?.forEach(p => {
  console.log(`  ${p.id}: ${p.name} → komisi Rp ${p.commissionFlat.toLocaleString('id-ID')}`);
});

console.log('\n=== RINGKASAN ===');
console.log('Total produk terdaftar:', Object.keys(PRODUCT_MEMBERSHIP_MAPPING).length);
