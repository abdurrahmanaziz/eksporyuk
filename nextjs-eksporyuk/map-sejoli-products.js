const fs = require('fs');

// Parse orders to get unique product IDs
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').trim().split('\n').slice(1);

const productCounts = {};
ordersRaw.forEach(line => {
  const p = line.split('\t');
  if (p.length >= 10 && p[7] === 'completed') {
    const productId = p[1];
    const amount = parseFloat(p[6]) || 0;
    
    if (!productCounts[productId]) {
      productCounts[productId] = { count: 0, totalAmount: 0, amounts: [] };
    }
    productCounts[productId].count++;
    productCounts[productId].totalAmount += amount;
    productCounts[productId].amounts.push(amount);
  }
});

console.log('📊 SEJOLI PRODUCTS (Completed Orders Only):');
console.log('═'.repeat(80));
console.log('Product ID | Orders | Total Revenue | Avg Price | Prices');
console.log('═'.repeat(80));

Object.entries(productCounts)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([id, data]) => {
    const uniquePrices = [...new Set(data.amounts)].sort((a, b) => b - a);
    const avgPrice = Math.round(data.totalAmount / data.count);
    console.log(
      `${id.padEnd(11)} | ${String(data.count).padEnd(6)} | Rp ${data.totalAmount.toLocaleString('id-ID').padEnd(13)} | Rp ${avgPrice.toLocaleString('id-ID').padEnd(9)} | ${uniquePrices.slice(0, 3).map(p => 'Rp ' + p.toLocaleString('id-ID')).join(', ')}`
    );
  });

console.log('\n💡 Perlu info dari Anda:');
console.log('Product ID mana yang:');
console.log('- 6 bulan?');
console.log('- 12 bulan?');
console.log('- Lifetime?');
