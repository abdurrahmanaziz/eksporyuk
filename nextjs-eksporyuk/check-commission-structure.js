/**
 * Check commission data structure in Sejoli backup
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

console.log('🔍 CEK STRUKTUR DATA KOMISI SEJOLI\n');

// Sample order
const sampleOrder = data.orders[0];
console.log('📋 FIELDS di ORDER:');
console.log(Object.keys(sampleOrder).sort().join(', '));

console.log('\n\n📄 SAMPLE ORDER LENGKAP:');
console.log(JSON.stringify(sampleOrder, null, 2));

// Check if there's commission in any order
console.log('\n\n🔎 CEK ADA KOMISI DI ORDERS:');
let hasCommission = 0;
let hasAffiliateId = 0;
const commissionFields = [];

data.orders.forEach(o => {
  if (o.affiliate_id && o.affiliate_id > 0) hasAffiliateId++;
  
  // Check all fields for commission-related data
  Object.keys(o).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('comm') || lowerKey.includes('affiliate')) {
      if (commissionFields.indexOf(key) === -1) {
        commissionFields.push(key);
      }
      if (o[key] && o[key] !== '0' && o[key] !== 0) {
        hasCommission++;
      }
    }
  });
});

console.log('Orders dengan affiliate_id > 0:', hasAffiliateId);
console.log('Orders dengan commission value:', hasCommission);
console.log('Commission-related fields:', commissionFields);

// Check users table for commission data
console.log('\n\n👥 CEK USER FIELDS:');
if (data.users && data.users.length > 0) {
  console.log('Sample user fields:', Object.keys(data.users[0]).sort().join(', '));
}

// Look for affiliate/commission in meta or other tables
console.log('\n\n📊 CEK TABLE LAIN:');
Object.keys(data).forEach(table => {
  if (table !== 'orders' && table !== 'users') {
    console.log(`Table: ${table}, Records: ${Array.isArray(data[table]) ? data[table].length : 'N/A'}`);
    if (Array.isArray(data[table]) && data[table].length > 0) {
      console.log(`  Fields: ${Object.keys(data[table][0]).join(', ')}`);
    }
  }
});
