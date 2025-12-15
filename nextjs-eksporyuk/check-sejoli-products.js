const fs = require('fs');

// Load orders to see product IDs
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').trim().split('\n').slice(1);

// Count orders by product_id
const productCount = {};
ordersRaw.forEach(line => {
  const p = line.split('\t');
  const productId = p[1];
  const status = p[7];
  
  if (status === 'completed') {
    productCount[productId] = (productCount[productId] || 0) + 1;
  }
});

// Sort by count
const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]);

console.log('📊 Sejoli Products by Completed Orders:');
console.log('═'.repeat(60));
sorted.forEach(([id, count]) => {
  console.log(`Product ID ${id}: ${count} completed orders`);
});

console.log(`\nTotal unique products: ${sorted.length}`);
