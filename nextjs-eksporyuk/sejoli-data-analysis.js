#!/usr/bin/env node
/**
 * SEJOLI DATA MAPPING ANALYSIS
 * Pastikan mapping yang PERSIS dengan database Sejoli
 */

const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

console.log('🔍 SEJOLI DATA MAPPING ANALYSIS');
console.log('=' .repeat(50));

// 1. USERS STRUCTURE ANALYSIS
console.log('\n📊 USERS EXPORT STRUCTURE:');
const usersData = readTSV('users_export.tsv');
const userHeader = usersData[0];
console.log('   Header:', userHeader);
console.log('   Sample data:');
for (let i = 1; i <= 3; i++) {
  if (usersData[i]) {
    console.log(`   Row ${i}:`, usersData[i]);
  }
}

// 2. ORDERS STRUCTURE ANALYSIS  
console.log('\n📊 ORDERS EXPORT STRUCTURE:');
const ordersData = readTSV('orders_export.tsv');
console.log('   Total orders:', ordersData.length - 1);
console.log('   Sample data:');
for (let i = 0; i < 3; i++) {
  if (ordersData[i]) {
    console.log(`   Row ${i}:`, ordersData[i]);
  }
}

// 3. COMMISSIONS STRUCTURE ANALYSIS
console.log('\n📊 COMMISSIONS EXPORT STRUCTURE:');
const commissionsData = readTSV('commissions_export.tsv');
console.log('   Total commissions:', commissionsData.length - 1);
console.log('   Sample data:');
for (let i = 0; i < 3; i++) {
  if (commissionsData[i]) {
    console.log(`   Row ${i}:`, commissionsData[i]);
  }
}

// 4. MAPPING ANALYSIS
console.log('\n🔍 MAPPING REQUIREMENTS:');
console.log('   USERS: Sejoli ID, username, email, display_name, registered');
console.log('   ORDERS: order_id, created_at, product_id, product_name, user_id, user_email, affiliate_id, total, status');
console.log('   COMMISSIONS: commission_id, created_at, order_id, user_id, affiliate_id, product_id, amount, status, approved');

// 5. NAME PRESERVATION CHECK
console.log('\n✅ NAME PRESERVATION REQUIREMENTS:');
const sampleUsers = usersData.slice(1, 6);
sampleUsers.forEach((user, index) => {
  const [sejoliId, username, email, displayName, registered] = user;
  console.log(`   User ${index + 1}:`);
  console.log(`      Sejoli ID: ${sejoliId}`);
  console.log(`      Username: ${username}`);
  console.log(`      Email: ${email}`);
  console.log(`      Display Name: ${displayName}`);
  console.log(`      Registered: ${registered}`);
});

console.log('\n📝 CRITICAL REQUIREMENTS:');
console.log('   ✅ User names must be EXACT from displayName field');
console.log('   ✅ Affiliate relationships must preserve Sejoli IDs');
console.log('   ✅ Commission amounts must be EXACT from Sejoli');
console.log('   ✅ User emails must be EXACT from email field');
console.log('   ✅ Registration dates must be preserved');
console.log('\n🎯 Next: Create import script with EXACT mapping');