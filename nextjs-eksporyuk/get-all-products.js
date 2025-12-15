const fs = require('fs');

// Parse all product IDs from orders
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').trim().split('\n').slice(1);

const productIds = new Set();
ordersRaw.forEach(line => {
  const p = line.split('\t');
  if (p.length >= 10 && p[7] === 'completed') {
    productIds.add(p[1]);
  }
});

console.log('All Product IDs with completed orders:');
console.log(Array.from(productIds).sort((a, b) => parseInt(a) - parseInt(b)).join(', '));
console.log(`\nTotal: ${productIds.size} unique products`);
