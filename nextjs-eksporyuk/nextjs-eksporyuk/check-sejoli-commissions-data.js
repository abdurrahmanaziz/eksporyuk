const fs = require('fs');

console.log('🔍 MENGECEK DATA KOMISI DARI SEJOLI');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('\n📊 STRUKTUR DATA SEJOLI:');
Object.keys(sejoli).forEach(key => {
  if (Array.isArray(sejoli[key])) {
    console.log(`  ${key}: ${sejoli[key].length} items`);
  } else {
    console.log(`  ${key}: ${typeof sejoli[key]}`);
  }
});

console.log('\n\n💰 MEMERIKSA DATA COMMISSIONS:');
console.log('═══════════════════════════════════════════════════════════════');

if (sejoli.commissions && sejoli.commissions.length > 0) {
  console.log(`\nTotal commission records: ${sejoli.commissions.length}`);
  
  // Show first 10 commissions with full details
  console.log('\n🔍 Sample 10 Commission Records (FULL DATA):');
  console.log('─────────────────────────────────────────────────────────────');
  
  sejoli.commissions.slice(0, 10).forEach((comm, index) => {
    console.log(`\n${index + 1}. Commission Record:`);
    console.log(JSON.stringify(comm, null, 2));
  });
  
  // Group by product_id
  const byProduct = {};
  sejoli.commissions.forEach(comm => {
    const pid = comm.product_id || comm.productId || 'unknown';
    if (!byProduct[pid]) {
      byProduct[pid] = {
        count: 0,
        totalAmount: 0,
        amounts: new Set(),
        sampleRecords: []
      };
    }
    byProduct[pid].count++;
    if (comm.amount || comm.commission_amount) {
      const amount = comm.amount || comm.commission_amount;
      byProduct[pid].totalAmount += amount;
      byProduct[pid].amounts.add(amount);
    }
    if (byProduct[pid].sampleRecords.length < 3) {
      byProduct[pid].sampleRecords.push(comm);
    }
  });
  
  console.log('\n\n📦 COMMISSION BY PRODUCT:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const sortedProducts = Object.entries(byProduct)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);
  
  sortedProducts.forEach(([productId, data]) => {
    console.log(`\n📦 Product ID: ${productId}`);
    console.log(`   Total Commissions: ${data.count}`);
    console.log(`   Total Amount: Rp ${data.totalAmount.toLocaleString('id-ID')}`);
    console.log(`   Unique Amounts: ${Array.from(data.amounts).map(a => `Rp ${a.toLocaleString('id-ID')}`).join(', ')}`);
    console.log(`   Sample Records:`);
    data.sampleRecords.forEach((record, i) => {
      console.log(`     ${i + 1}. ${JSON.stringify(record)}`);
    });
  });
  
  // Check all keys in commission records
  console.log('\n\n🔑 ALL KEYS IN COMMISSION RECORDS:');
  console.log('═══════════════════════════════════════════════════════════════');
  const allKeys = new Set();
  sejoli.commissions.forEach(comm => {
    Object.keys(comm).forEach(key => allKeys.add(key));
  });
  console.log(Array.from(allKeys).sort());
  
} else {
  console.log('\n❌ No commission data found or empty array');
}

console.log('\n\n📊 MEMERIKSA DATA AFFILIATES:');
console.log('═══════════════════════════════════════════════════════════════');

if (sejoli.affiliates && sejoli.affiliates.length > 0) {
  console.log(`\nTotal affiliate records: ${sejoli.affiliates.length}`);
  
  console.log('\n🔍 Sample 5 Affiliate Records (FULL DATA):');
  sejoli.affiliates.slice(0, 5).forEach((aff, index) => {
    console.log(`\n${index + 1}. Affiliate Record:`);
    console.log(JSON.stringify(aff, null, 2));
  });
  
  // Check all keys
  console.log('\n\n🔑 ALL KEYS IN AFFILIATE RECORDS:');
  const allKeys = new Set();
  sejoli.affiliates.forEach(aff => {
    Object.keys(aff).forEach(key => allKeys.add(key));
  });
  console.log(Array.from(allKeys).sort());
}

console.log('\n\n✅ SELESAI');
