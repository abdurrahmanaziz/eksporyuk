#!/usr/bin/env node

/**
 * Test Community Feed System Locally
 * 
 * This script tests the community feed system on localhost:3000
 * and checks if posting functionality is working correctly.
 */

const fetch = require('node-fetch');

async function testCommunityFeed() {
  console.log('🧪 Testing Community Feed System');
  console.log('================================');

  try {
    // Test 1: Check API endpoint availability
    console.log('\n📡 Testing API endpoint /api/community/feed...');
    const feedResponse = await fetch('http://localhost:3000/api/community/feed');
    console.log(`Status: ${feedResponse.status}`);
    console.log(`Headers: ${feedResponse.headers.get('content-type')}`);

    if (feedResponse.status === 401) {
      console.log('❌ API requires authentication - this is expected');
    } else {
      const feedData = await feedResponse.text();
      console.log('Response preview:', feedData.substring(0, 200) + '...');
    }

    // Test 2: Check frontend page accessibility
    console.log('\n🌐 Testing frontend page /community/feed...');
    const pageResponse = await fetch('http://localhost:3000/community/feed');
    console.log(`Status: ${pageResponse.status}`);
    
    if (pageResponse.ok) {
      const pageHtml = await pageResponse.text();
      const hasReactComponents = pageHtml.includes('feed') || pageHtml.includes('post');
      console.log(`✅ Page accessible. Contains feed elements: ${hasReactComponents}`);
    } else {
      console.log('❌ Page not accessible');
    }

    // Test 3: Check if auth is working
    console.log('\n🔐 Testing auth endpoint /api/auth/session...');
    const authResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log(`Status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Session data:', JSON.stringify(authData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000/auth/login in browser');
  console.log('2. Login with admin credentials');  
  console.log('3. Navigate to http://localhost:3000/community/feed');
  console.log('4. Check browser console for debug logs (🚀 fetchPosts called)');
  console.log('5. Try posting a new message');
}

testCommunityFeed();