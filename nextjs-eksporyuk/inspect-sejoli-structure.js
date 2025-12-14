const fs = require('fs');

// Load and inspect Sejoli data structure
console.log('🔍 INSPECTING SEJOLI DATA STRUCTURE');
console.log('═════════════════════════════════════════════════════════════════════════════════════');

const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('📂 SEJOLI DATA OVERVIEW:');
console.log(`- Total Users: ${sejoliData.users.length}`);
console.log(`- Total Orders: ${sejoliData.orders.length}`);

console.log('\n📋 SAMPLE ORDER STRUCTURE:');
console.log('─────────────────────────────────────────────────────────────────────────────────────');

const sampleOrder = sejoliData.orders[0];
console.log('Sample Order Fields:');
console.log(JSON.stringify(sampleOrder, null, 2));

console.log('\n📊 ORDER STATUS DISTRIBUTION:');
console.log('─────────────────────────────────────────────────────────────────────────────────────');

const statusCounts = {};
for (const order of sejoliData.orders) {
  const status = order.status || order.order_status || 'unknown';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
}

console.log('Status distribution:');
for (const [status, count] of Object.entries(statusCounts)) {
  console.log(`${status}: ${count} orders`);
}

console.log('\n💰 SAMPLE ORDER AMOUNTS:');
console.log('─────────────────────────────────────────────────────────────────────────────────────');

for (let i = 0; i < 10; i++) {
  const order = sejoliData.orders[i];
  console.log(`Order ${i + 1}:`);
  console.log(`  Status: ${order.status || order.order_status}`);
  console.log(`  Amount: ${order.total || order.order_total || order.amount}`);
  console.log(`  Date: ${order.date || order.order_date || order.created_at}`);
  console.log('');
}

console.log('\n🏷️  CHECKING AVAILABLE FIELDS:');
console.log('─────────────────────────────────────────────────────────────────────────────────────');

const allFields = new Set();
for (let i = 0; i < 10; i++) {
  const order = sejoliData.orders[i];
  Object.keys(order).forEach(key => allFields.add(key));
}

console.log('Available fields in orders:');
console.log(Array.from(allFields).sort());