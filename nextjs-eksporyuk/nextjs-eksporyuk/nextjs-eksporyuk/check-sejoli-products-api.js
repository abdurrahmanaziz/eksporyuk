const fetch = require('node-fetch');

async function checkSejoliProductsAPI() {
  console.log('🔍 CHECKING SEJOLI API FOR PRODUCTS/WEBINARS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const baseUrl = 'https://eksporyuk.sejoli.co.id';
  
  // Common Sejoli API endpoints to check
  const endpoints = [
    '/wp-json/sejoli-api/v1/products',
    '/wp-json/sejoli-api/v1/product',
    '/wp-json/wc/v3/products',
    '/wp-json/wp/v2/product',
    '/wp-json/sejoli/v1/products',
    '/wp-json/sejoli/v1/webinar',
    '/wp-json/sejoli/v1/events',
    '/wp-json/sejoli-api/v1/webinars',
    '/wp-json/sejoli-api/v1/events',
    '/wp-json/sejoli-api/v1/courses',
    '/wp-json/sejoli-api/v1/training',
    '/wp-json/sejoli-api/v1/seminar',
    '/wp-json/sejoli-api/v1/zoominar',
    '/wp-json/wp/v2/sejoli_product',
    '/wp-json/wp/v2/sejoli_webinar',
    '/wp-json/wp/v2/sejoli_event',
    '/wp-admin/admin-ajax.php?action=get_products',
    '/wp-admin/admin-ajax.php?action=get_webinars',
    '/api/products',
    '/api/webinars',
    '/api/events'
  ];

  console.log('🚀 Testing Sejoli API endpoints for product/webinar data...\n');

  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    
    try {
      console.log(`🔗 Testing: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            
            if (Array.isArray(data)) {
              console.log(`   ✅ SUCCESS: Found ${data.length} items`);
              
              if (data.length > 0) {
                console.log(`   📊 Sample item structure:`);
                const sample = data[0];
                Object.keys(sample).slice(0, 10).forEach(key => {
                  const value = sample[key];
                  const displayValue = typeof value === 'string' && value.length > 50 
                    ? value.substring(0, 50) + '...' 
                    : value;
                  console.log(`      ${key}: ${JSON.stringify(displayValue)}`);
                });
                
                if (Object.keys(sample).length > 10) {
                  console.log(`      ... and ${Object.keys(sample).length - 10} more fields`);
                }
              }
            } else if (typeof data === 'object' && data !== null) {
              console.log(`   ✅ SUCCESS: Object response`);
              
              if (data.data && Array.isArray(data.data)) {
                console.log(`   📊 Found ${data.data.length} items in data array`);
              } else if (data.products && Array.isArray(data.products)) {
                console.log(`   📊 Found ${data.products.length} products`);
              } else {
                console.log(`   📊 Response keys: ${Object.keys(data).join(', ')}`);
              }
            } else {
              console.log(`   📊 Response type: ${typeof data}`);
            }
          } catch (jsonError) {
            const text = await response.text();
            console.log(`   ⚠️ JSON parse error, got text (${text.length} chars): ${text.substring(0, 200)}...`);
          }
        } else {
          const text = await response.text();
          console.log(`   📄 Non-JSON response (${text.length} chars): ${text.substring(0, 100)}...`);
        }
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication required`);
      } else if (response.status === 403) {
        console.log(`   🚫 Access forbidden`);
      } else if (response.status === 404) {
        console.log(`   ❌ Endpoint not found`);
      } else {
        console.log(`   ⚠️ Unexpected status`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ Domain not found`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ⏱️ Request timeout`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 SPECIFIC WEBINAR/EVENT DATA CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check for specific high-value product types
  const webinarEndpoints = [
    '/wp-json/sejoli-api/v1/products?type=webinar',
    '/wp-json/sejoli-api/v1/products?type=event',
    '/wp-json/sejoli-api/v1/products?type=training',
    '/wp-json/sejoli-api/v1/products?price_min=500000',
    '/wp-json/sejoli-api/v1/products?price_min=800000',
    '/wp-json/wc/v3/products?min_price=500000',
    '/wp-json/wc/v3/products?category=webinar',
    '/wp-json/wc/v3/products?category=training',
    '/wp-json/wc/v3/products?category=seminar'
  ];

  for (const endpoint of webinarEndpoints) {
    const url = baseUrl + endpoint;
    
    try {
      console.log(`🔗 Testing webinar filter: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   ✅ FOUND ${data.length} high-value products!`);
          
          data.slice(0, 3).forEach((product, index) => {
            console.log(`   📦 Product ${index + 1}:`);
            console.log(`      Title: ${product.title || product.name || 'N/A'}`);
            console.log(`      Price: ${product.price || product.regular_price || 'N/A'}`);
            console.log(`      Type: ${product.type || product.product_type || 'N/A'}`);
            console.log(`      ID: ${product.id || 'N/A'}`);
          });
          
          if (data.length > 3) {
            console.log(`   ... and ${data.length - 3} more products`);
          }
        } else {
          console.log(`   📊 Response: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } else {
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n💡 ANALYSIS COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Based on the API responses above:');
  console.log('1. Look for endpoints that returned 200 status with product data');
  console.log('2. Check if any high-value products (>500K) were found');
  console.log('3. Identify product types that might be webinars/events');
  console.log('4. Note any authentication requirements for accessing product data');
  console.log('\n🎯 Next step: Use successful endpoints to extract webinar/event data for import');
}

checkSejoliProductsAPI();