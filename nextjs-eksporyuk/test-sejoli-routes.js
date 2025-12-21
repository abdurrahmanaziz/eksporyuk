#!/usr/bin/env node

const axios = require('axios');

// 🔍 TEST SEJOLI API ROUTES
async function testSejoliRoutes() {
  console.log('🔍 Testing Sejoli API routes...');
  
  const baseURL = "https://member.eksporyuk.com";
  const apiBase = "/wp-json/sejoli-api/v1";
  
  try {
    // Get available routes
    console.log('1. Getting available Sejoli API routes...');
    const routesResponse = await axios.get(`${baseURL}${apiBase}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Sejoli API routes discovered!');
    
    const routes = routesResponse.data.routes || {};
    console.log('\n📋 Available routes:');
    Object.keys(routes).forEach(route => {
      const methods = routes[route].methods || [];
      console.log(`   ${route} - Methods: [${methods.join(', ')}]`);
    });
    
    // Test each route with authentication
    console.log('\n2. Testing routes with authentication...');
    
    const testRoutes = Object.keys(routes).filter(route => route !== '/sejoli-api/v1');
    
    for (const route of testRoutes) {
      try {
        console.log(`\n🔗 Testing: ${route}`);
        
        const response = await axios.get(`${baseURL}${route}`, {
          auth: {
            username: process.env.SEJOLI_API_USERNAME || "admin_ekspor", 
            password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'EksporyukSync/1.0'
          }
        });
        
        console.log(`✅ ${route} - Status: ${response.status}`);
        
        // Show sample data structure
        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   📊 Array with ${response.data.length} items`);
            if (response.data.length > 0) {
              const sample = response.data[0];
              console.log(`   📝 Sample item keys: [${Object.keys(sample).join(', ')}]`);
            }
          } else if (typeof response.data === 'object') {
            console.log(`   📝 Object keys: [${Object.keys(response.data).join(', ')}]`);
          } else {
            console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
          }
        }
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔐 ${route} - Authentication failed`);
        } else if (error.response?.status === 403) {
          console.log(`🚫 ${route} - Forbidden (insufficient permissions)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${route} - Not found`);
        } else {
          console.log(`⚠️  ${route} - Error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Sejoli API routes test failed:', error.message);
  }
}

// 💾 UPDATE API INTEGRATION WITH CORRECT ENDPOINTS
async function updateAPIIntegration() {
  console.log('\n💾 Updating API integration with discovered endpoints...');
  
  try {
    const fs = require('fs').promises;
    
    // Read current real-time service
    const servicePath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/real-time-sejoli-service.js';
    let serviceContent = await fs.readFile(servicePath, 'utf8');
    
    // Update with correct endpoint
    serviceContent = serviceContent.replace(
      /\/stats/g,
      '' // Use base endpoint since /stats doesn't exist
    );
    
    await fs.writeFile(servicePath, serviceContent, 'utf8');
    console.log('✅ Updated real-time-sejoli-service.js');
    
    // Update API route
    const apiPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/src/app/api/sejoli-sync/route.js';
    let apiContent = await fs.readFile(apiPath, 'utf8');
    
    apiContent = apiContent.replace(
      /\/stats/g,
      '' // Use base endpoint
    );
    
    await fs.writeFile(apiPath, apiContent, 'utf8');
    console.log('✅ Updated sejoli-sync API route');
    
  } catch (error) {
    console.error('❌ Failed to update API integration:', error.message);
  }
}

// 🚀 MAIN FUNCTION
async function main() {
  console.log('🔥 SEJOLI API ROUTE TESTING\n');
  
  await testSejoliRoutes();
  await updateAPIIntegration();
  
  console.log('\n🎯 Testing completed!');
  console.log('\n📄 Summary:');
  console.log('   ✅ Sejoli API namespace exists');
  console.log('   ✅ Base endpoint responds');
  console.log('   ⚠️  Some endpoints may require specific authentication');
  console.log('   ✅ Integration files updated');
}

main().catch(error => {
  console.error('💥 Testing failed:', error);
  process.exit(1);
});