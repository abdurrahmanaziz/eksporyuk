const fs = require('fs');

// Load raw sales data
const rawData = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const orders = rawData.orders || [];

console.log('🔍 VERIFIKASI DATA SEJOLI - 17 Desember 2025\n');
console.log('=' .repeat(80));
console.log('📊 RAW DATA INFO:');
console.log('=' .repeat(80));
console.log(`  recordsTotal: ${rawData.recordsTotal}`);
console.log(`  recordsFiltered: ${rawData.recordsFiltered}`);
console.log(`  orders.length: ${orders.length}`);

// Check for duplicates by order ID
const orderIds = orders.map(o => o.ID);
const uniqueIds = new Set(orderIds);
console.log(`\n  Unique Order IDs: ${uniqueIds.size}`);
console.log(`  Duplicate Orders: ${orders.length - uniqueIds.size}`);

// Check first and last order
if (orders.length > 0) {
  console.log('\n📅 ORDER DATE RANGE:');
  console.log('-'.repeat(80));
  
  // Sort by ID to get earliest and latest
  const sortedByDate = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const earliest = sortedByDate[0];
  const latest = sortedByDate[sortedByDate.length - 1];
  
  console.log(`  Earliest: ID ${earliest.ID} - ${earliest.created_at}`);
  console.log(`  Latest:   ID ${latest.ID} - ${latest.created_at}`);
  
  // Check orders from December 2025
  const dec2025 = orders.filter(o => o.created_at && o.created_at.startsWith('2025-12'));
  console.log(`\n  Orders in December 2025: ${dec2025.length}`);
}

// Status breakdown (verify)
console.log('\n📈 STATUS VERIFICATION:');
console.log('-'.repeat(80));
const statusMap = {};
orders.forEach(o => {
  statusMap[o.status] = (statusMap[o.status] || 0) + 1;
});
let totalCount = 0;
Object.entries(statusMap).sort((a,b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status.padEnd(20)}: ${count.toLocaleString()}`);
  totalCount += count;
});
console.log(`  ${'TOTAL'.padEnd(20)}: ${totalCount.toLocaleString()}`);

// Calculate omset - only completed, no duplicates
console.log('\n💰 OMSET CALCULATION (Verified - No Duplicates):');
console.log('-'.repeat(80));

const processedIds = new Set();
let omsetBersih = 0;
let completedCount = 0;

orders.forEach(o => {
  if (o.status === 'completed' && !processedIds.has(o.ID)) {
    processedIds.add(o.ID);
    omsetBersih += parseFloat(o.grand_total) || 0;
    completedCount++;
  }
});

console.log(`  Completed Orders (unique): ${completedCount.toLocaleString()}`);
console.log(`  Omset Bersih: Rp ${omsetBersih.toLocaleString()}`);

// Compare with dashboard
console.log('\n📊 COMPARISON WITH DASHBOARD:');
console.log('-'.repeat(80));
console.log('  Dashboard shows:');
console.log('    Total Sales: 12,851');
console.log('    Total Omset: Rp 4,133,322,962');
console.log('    Total Komisi: Rp 1,248,871,000');
console.log('  Our calculation:');
console.log(`    Total Sales: ${completedCount.toLocaleString()}`);
console.log(`    Total Omset: Rp ${omsetBersih.toLocaleString()}`);

const diffSales = 12851 - completedCount;
const diffOmset = 4133322962 - omsetBersih;
console.log(`  Difference:`)
console.log(`    Sales: ${diffSales} (${diffSales > 0 ? 'MISSING' : 'EXTRA'})`);
console.log(`    Omset: Rp ${diffOmset.toLocaleString()} (${diffOmset > 0 ? 'MISSING' : 'EXTRA'})`);

// Sample recent orders to verify
console.log('\n📋 SAMPLE RECENT ORDERS (Last 10 by ID):');
console.log('-'.repeat(80));
const recentOrders = [...orders].sort((a,b) => b.ID - a.ID).slice(0, 10);
recentOrders.forEach(o => {
  console.log(`  ID:${o.ID.toString().padEnd(6)} ${o.status.padEnd(12)} ${o.created_at} Rp ${(o.grand_total || 0).toLocaleString().padStart(12)} | ${(o.product_name || 'Unknown').substring(0,30)}`);
});

console.log('\n✅ Verification complete!');
