const { PRODUCT_MEMBERSHIP_MAPPING } = require('./scripts/migration/product-membership-mapping.js');

console.log('🔍 CEK APAKAH ADA PRODUK DENGAN KOMISI 335,000:\n');

let found = false;
Object.entries(PRODUCT_MEMBERSHIP_MAPPING).forEach(([productId, data]) => {
  if (data.commissionFlat === 335000) {
    console.log('✅ DITEMUKAN:');
    console.log('Product ID:', productId);
    console.log('Name:', data.name);
    console.log('Commission:', data.commissionFlat.toLocaleString('id-ID'));
    found = true;
  }
});

if (!found) {
  console.log('❌ TIDAK ADA produk dengan komisi Rp 335,000');
  console.log('\n📊 Komisi yang valid dari product mapping:');
  const uniqueCommissions = [...new Set(Object.values(PRODUCT_MEMBERSHIP_MAPPING).map(p => p.commissionFlat))].sort((a,b) => b-a);
  uniqueCommissions.forEach(c => {
    if (c > 0) console.log('  Rp', c.toLocaleString('id-ID'));
  });
}
