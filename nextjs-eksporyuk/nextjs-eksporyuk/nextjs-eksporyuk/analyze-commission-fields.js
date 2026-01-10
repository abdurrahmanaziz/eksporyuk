const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));

// Ambil order dengan affiliate dan cek SEMUA field
const ordersWithAffiliate = data.orders.filter(o => o.affiliate_id && o.affiliate_id > 0);

console.log('=== Sample 5 Orders - SEMUA FIELD ===\n');

ordersWithAffiliate.slice(0, 5).forEach((o, i) => {
  console.log(`\n--- ORDER #${o.ID} ---`);
  
  // List semua top-level keys
  const keys = Object.keys(o);
  console.log(`All keys: ${keys.join(', ')}`);
  
  // Cek meta_data lebih detail
  if (o.meta_data) {
    console.log(`meta_data keys: ${Object.keys(o.meta_data).join(', ')}`);
  }
  
  // Cek apakah ada field commission/komisi di top level
  ['commission', 'affiliate_commission', 'komisi', 'fee', 'affiliate_fee', 'aff_commission'].forEach(key => {
    if (o[key] !== undefined) {
      console.log(`Found "${key}": ${o[key]}`);
    }
  });
  
  // Cek product affiliate field
  console.log(`\nproduct.affiliate:`);
  console.log(JSON.stringify(o.product?.affiliate, null, 2));
});

// Cari order dari Rahmat Al Fianto untuk analisis
console.log('\n\n=== ANALISIS KHUSUS: Rahmat Al Fianto (ID: 1637) ===');
const rahmatOrders = ordersWithAffiliate.filter(o => o.affiliate_id === 1637);
console.log(`Total orders: ${rahmatOrders.length}`);

// Group by product
const productStats = {};
rahmatOrders.forEach(o => {
  const productId = o.product_id;
  const productName = o.product_name;
  if (!productStats[productId]) {
    productStats[productId] = {
      name: productName,
      count: 0,
      totalSales: 0,
      affiliateFee: 0
    };
  }
  productStats[productId].count++;
  productStats[productId].totalSales += Number(o.grand_total) || 0;
  
  // Get affiliate fee
  if (o.product?.affiliate) {
    const setting = o.product.affiliate['1'] || o.product.affiliate;
    productStats[productId].affiliateFee = setting?.fee || 0;
  }
});

console.log('\nBreakdown by product:');
Object.entries(productStats).forEach(([id, s]) => {
  const calcCommission = s.count * s.affiliateFee;
  console.log(`- Product ${id} (${s.name}): ${s.count} orders x Rp ${s.affiliateFee.toLocaleString('id-ID')} = Rp ${calcCommission.toLocaleString('id-ID')}`);
});

// Total calculated
const totalCalc = Object.values(productStats).reduce((sum, s) => sum + (s.count * s.affiliateFee), 0);
console.log(`\nTotal calculated: Rp ${totalCalc.toLocaleString('id-ID')}`);
console.log(`Live dashboard shows: Rp 169,595,000`);
console.log(`Difference: Rp ${(169595000 - totalCalc).toLocaleString('id-ID')}`);

