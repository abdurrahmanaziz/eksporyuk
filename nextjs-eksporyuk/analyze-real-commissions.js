const fs = require('fs');

const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
const sejoli = JSON.parse(sejoliFull);

console.log('📊 ANALISIS KOMISI DARI DATA SEJOLI (Real Data Only)');
console.log('=====================================================\n');

// Group by price and commission from REAL transactions
const priceCommissionMap = new Map();

sejoli.orders.forEach(order => {
  if (order.status === 'completed' && order.affiliate_id && order.affiliate_id !== '0') {
    const price = parseFloat(order.grand_total);
    const commission = parseFloat(order.affiliate_amount || 0);
    const productId = order.product_id;
    
    const key = price;
    if (!priceCommissionMap.has(key)) {
      priceCommissionMap.set(key, {
        price: price,
        commissions: new Set(),
        productIds: new Set(),
        count: 0,
        samples: []
      });
    }
    
    const data = priceCommissionMap.get(key);
    data.commissions.add(commission);
    data.productIds.add(productId);
    data.count++;
    
    if (data.samples.length < 3) {
      data.samples.push({
        orderId: order.id,
        productId: productId,
        commission: commission
      });
    }
  }
});

// Sort by price and show
const sorted = Array.from(priceCommissionMap.values()).sort((a, b) => a.price - b.price);

console.log('Format: Harga → Komisi (jumlah transaksi)\n');

sorted.forEach(data => {
  const commissions = Array.from(data.commissions);
  const products = Array.from(data.productIds);
  
  console.log(`Rp ${data.price.toLocaleString('id-ID')}:`);
  commissions.forEach(comm => {
    console.log(`  → Komisi: Rp ${comm.toLocaleString('id-ID')} (${data.count} transaksi)`);
  });
  console.log(`  Product IDs: ${products.join(', ')}`);
  console.log('');
});

console.log(`\nTotal unique prices: ${sorted.length}`);
console.log('\n📋 CREATING EXACT MAPPING FROM REAL DATA...\n');

// Create exact price → commission mapping
const exactMapping = {};
sorted.forEach(data => {
  const commissions = Array.from(data.commissions);
  if (commissions.length === 1) {
    exactMapping[data.price] = commissions[0];
  } else {
    // Multiple commissions for same price - take the most common or highest
    console.log(`⚠️  Multiple commissions for Rp ${data.price.toLocaleString('id-ID')}: ${commissions.map(c => 'Rp ' + c.toLocaleString('id-ID')).join(', ')}`);
    exactMapping[data.price] = Math.max(...commissions);
  }
});

console.log('\n✅ EXACT PRICE → COMMISSION MAPPING:');
console.log(JSON.stringify(exactMapping, null, 2));
