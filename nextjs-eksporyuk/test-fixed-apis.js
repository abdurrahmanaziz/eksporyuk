#!/usr/bin/env node

/**
 * Test API Endpoints After Fixes
 * 
 * This script tests the fixed API endpoints to verify they're working correctly.
 */

console.log('🧪 Testing Fixed API Endpoints');
console.log('==============================\n');

// Test 1: Dashboard Options API
console.log('📡 Testing /api/user/dashboard-options...');
fetch('http://localhost:3000/api/user/dashboard-options')
  .then(response => {
    console.log(`Status: ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      console.log('✅ Expected 401 (Unauthorized) - requires login');
    } else {
      console.log(`❓ Unexpected status: ${response.status}`);
    }
  })
  .catch(err => console.log('❌ Error:', err.message));

// Test 2: Users Presence API  
setTimeout(() => {
  console.log('\n📡 Testing /api/users/presence...');
  fetch('http://localhost:3000/api/users/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'online', lastSeen: new Date().toISOString() })
  })
    .then(response => {
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log('✅ Expected 401 (Unauthorized) - requires login');
      } else {
        console.log(`❓ Unexpected status: ${response.status}`);
      }
    })
    .catch(err => console.log('❌ Error:', err.message));
}, 1000);

// Test 3: Community Feed API
setTimeout(() => {
  console.log('\n📡 Testing /api/community/feed...');
  fetch('http://localhost:3000/api/community/feed')
    .then(response => {
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log('✅ Expected 401 (Unauthorized) - requires login');
      } else if (response.status === 500) {
        console.log('❌ Still returning 500 - needs further debugging');
      } else {
        console.log(`✅ Status improved: ${response.status}`);
      }
    })
    .catch(err => console.log('❌ Error:', err.message));
}, 2000);

console.log('\n📋 Summary:');
console.log('- All APIs should return 401 (Unauthorized) without login');
console.log('- After login, they should return proper data or 200/403 status');
console.log('- Login at: http://localhost:3000/auth/login');
console.log('- Use admin@eksporyuk.com or any admin from check-admin-users.js');
console.log('\n🔍 Check terminal logs for debug output from APIs...');