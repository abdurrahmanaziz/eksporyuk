/**
 * Fetch COMPLETE Users & Orders from Sejoli API
 * Handles pagination untuk ambil semua data (18k users + 19k orders)
 */

const fs = require('fs');
const path = require('path');

const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.log(`❌ Retry ${i + 1}/${maxRetries} for ${url}: ${error.message}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

async function fetchAllUsers() {
  console.log('\n📥 FETCHING ALL USERS FROM SEJOLI...');
  console.log('='.repeat(60));
  
  let allUsers = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${SEJOLI_API_BASE}/users?page=${page}&per_page=100`;
      console.log(`\n🔄 Fetching page ${page}...`);
      
      const response = await fetchWithRetry(url);
      
      if (response.success && response.data && response.data.length > 0) {
        allUsers = allUsers.concat(response.data);
        console.log(`✅ Page ${page}: ${response.data.length} users (Total: ${allUsers.length})`);
        page++;
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        hasMore = false;
        console.log(`\n✅ No more users. Total fetched: ${allUsers.length}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      hasMore = false;
    }
  }
  
  // Save to file
  const filePath = path.join(__dirname, 'sejoli-users-complete.json');
  fs.writeFileSync(filePath, JSON.stringify(allUsers, null, 2));
  console.log(`\n💾 Saved ${allUsers.length} users to sejoli-users-complete.json`);
  console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  
  return allUsers;
}

async function fetchAllOrders() {
  console.log('\n📥 FETCHING ALL ORDERS FROM SEJOLI...');
  console.log('='.repeat(60));
  
  let allOrders = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${SEJOLI_API_BASE}/orders?page=${page}&per_page=100`;
      console.log(`\n🔄 Fetching page ${page}...`);
      
      const response = await fetchWithRetry(url);
      
      if (response.success && response.data && response.data.length > 0) {
        allOrders = allOrders.concat(response.data);
        console.log(`✅ Page ${page}: ${response.data.length} orders (Total: ${allOrders.length})`);
        page++;
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        hasMore = false;
        console.log(`\n✅ No more orders. Total fetched: ${allOrders.length}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      hasMore = false;
    }
  }
  
  // Save to file
  const filePath = path.join(__dirname, 'sejoli-orders-complete.json');
  fs.writeFileSync(filePath, JSON.stringify(allOrders, null, 2));
  console.log(`\n💾 Saved ${allOrders.length} orders to sejoli-orders-complete.json`);
  console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  
  return allOrders;
}

async function main() {
  console.log('🚀 SEJOLI DATA FETCH - COMPLETE VERSION');
  console.log('='.repeat(60));
  console.log('Target: ~18,000 users + ~19,000 orders');
  console.log('Source: Sejoli REST API');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Fetch users
    const users = await fetchAllUsers();
    
    // Fetch orders
    const orders = await fetchAllOrders();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n');
    console.log('='.repeat(60));
    console.log('✅ FETCH COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Users fetched: ${users.length.toLocaleString()}`);
    console.log(`📊 Orders fetched: ${orders.length.toLocaleString()}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log('='.repeat(60));
    
    // Summary
    const completedOrders = orders.filter(o => o.status === 'completed');
    console.log('\n📈 ORDER SUMMARY:');
    console.log(`   - Completed: ${completedOrders.length.toLocaleString()}`);
    console.log(`   - Other statuses: ${(orders.length - completedOrders.length).toLocaleString()}`);
    
    const uniqueEmails = new Set(users.map(u => u.user_email));
    console.log('\n👥 USER SUMMARY:');
    console.log(`   - Total users: ${users.length.toLocaleString()}`);
    console.log(`   - Unique emails: ${uniqueEmails.size.toLocaleString()}`);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
