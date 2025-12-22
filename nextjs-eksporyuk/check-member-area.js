const fetch = require('node-fetch');

async function checkMemberAreaSite() {
  console.log('🔍 CHECKING MEMBER AREA SITE FOR PRODUCT DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const memberAreaUrl = 'https://member.eksporyuk.com';
  
  // Test various endpoints on member area
  const endpoints = [
    '/member-area/login',
    '/',
    '/wp-json/sejoli-api/v1/products',
    '/wp-json/sejoli-api/v1/orders',
    '/wp-json/sejoli-api/v1/webinars',
    '/wp-json/sejoli-api/v1/events',
    '/wp-json/wc/v3/products',
    '/wp-json/wp/v2/products',
    '/wp-json/wp/v2/product',
    '/wp-json/sejoli/v1/products',
    '/wp-json/sejoli/v1/webinar',
    '/wp-json/sejoli/v1/events',
    '/api/products',
    '/api/webinars',
    '/api/events',
    '/member-area/products',
    '/member-area/webinars',
    '/member-area/events'
  ];

  console.log('🚀 Testing Member Area endpoints...\n');

  for (const endpoint of endpoints) {
    const url = memberAreaUrl + endpoint;
    
    try {
      console.log(`🔗 Testing: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*',
          'Content-Type': 'application/json'
        },
        timeout: 15000
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
                Object.keys(sample).slice(0, 8).forEach(key => {
                  const value = sample[key];
                  const displayValue = typeof value === 'string' && value.length > 50 
                    ? value.substring(0, 50) + '...' 
                    : value;
                  console.log(`      ${key}: ${JSON.stringify(displayValue)}`);
                });
                
                // Check for webinar/high-value products
                const highValueItems = data.filter(item => {
                  const price = item.price || item.regular_price || item.amount || 0;
                  return price >= 500000;
                });
                
                if (highValueItems.length > 0) {
                  console.log(`   🎯 HIGH-VALUE PRODUCTS FOUND: ${highValueItems.length}`);
                  highValueItems.slice(0, 3).forEach((item, index) => {
                    console.log(`      ${index + 1}. ${item.title || item.name || 'N/A'} - Rp. ${item.price || item.regular_price || 'N/A'}`);
                  });
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
            console.log(`   ⚠️ JSON parse error, got text (${text.length} chars)`);
            
            // Check if it's a login page
            if (text.includes('login') || text.includes('password') || text.includes('member-area')) {
              console.log(`   🔐 Appears to be a login page`);
              
              // Look for any product/webinar references in HTML
              const webinarRefs = text.match(/webinar|event|training|seminar|zoominar/gi) || [];
              if (webinarRefs.length > 0) {
                console.log(`   🎯 Found ${webinarRefs.length} webinar/event references in page`);
              }
              
              // Look for price patterns
              const priceRefs = text.match(/Rp\s*[\d,.]+(\.?\d{3})+|[0-9]{6,}/g) || [];
              if (priceRefs.length > 0) {
                console.log(`   💰 Found ${priceRefs.length} price references: ${priceRefs.slice(0, 3).join(', ')}`);
              }
            }
          }
        } else if (contentType && contentType.includes('text/html')) {
          const html = await response.text();
          console.log(`   📄 HTML page (${html.length} chars)`);
          
          // Extract useful information from HTML
          if (html.includes('login') || html.includes('password')) {
            console.log(`   🔐 Login page detected`);
          }
          
          // Look for API endpoints in HTML/JS
          const apiRefs = html.match(/\/wp-json\/[^"'\s]+/g) || [];
          if (apiRefs.length > 0) {
            console.log(`   🔗 Found API references: ${[...new Set(apiRefs)].slice(0, 3).join(', ')}`);
          }
          
          // Look for product/webinar mentions
          const productRefs = html.match(/product|webinar|event|training|seminar/gi) || [];
          if (productRefs.length > 0) {
            console.log(`   📦 Found ${productRefs.length} product/webinar mentions`);
          }
          
          // Look for high prices
          const prices = html.match(/Rp\s*[\d,.]+(\.?\d{3})+|[789][0-9]{5,}/g) || [];
          if (prices.length > 0) {
            console.log(`   💰 Price patterns found: ${prices.slice(0, 3).join(', ')}`);
          }
        } else {
          const text = await response.text();
          console.log(`   📄 Other content (${text.length} chars): ${text.substring(0, 100)}...`);
        }
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication required`);
      } else if (response.status === 403) {
        console.log(`   🚫 Access forbidden`);
      } else if (response.status === 404) {
        console.log(`   ❌ Endpoint not found`);
      } else if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location');
        console.log(`   🔀 Redirect to: ${location}`);
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

  console.log('\n🎯 MEMBER AREA LOGIN ACCESS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Try to access login page specifically
  const loginUrl = memberAreaUrl + '/member-area/login';
  
  try {
    console.log(`🔗 Accessing login page: ${loginUrl}`);
    
    const response = await fetch(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (response.status === 200) {
      const html = await response.text();
      console.log(`✅ Login page loaded (${html.length} chars)`);
      
      // Extract login form details
      const formMatch = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi);
      if (formMatch) {
        console.log(`📝 Found ${formMatch.length} form(s) on login page`);
        
        // Look for action URLs
        const actionMatch = html.match(/action=["']([^"']+)["']/gi);
        if (actionMatch) {
          console.log(`🔗 Form actions: ${actionMatch.join(', ')}`);
        }
      }
      
      // Look for API endpoints in the page
      const apiEndpoints = html.match(/["'](\/wp-json\/[^"']+)["']/g) || [];
      const uniqueEndpoints = [...new Set(apiEndpoints.map(ep => ep.replace(/["']/g, '')))];
      
      if (uniqueEndpoints.length > 0) {
        console.log(`🔗 API endpoints found in page:`);
        uniqueEndpoints.slice(0, 10).forEach(endpoint => {
          console.log(`   ${endpoint}`);
        });
      }
      
      // Look for JavaScript that might reveal API calls
      const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
      console.log(`📜 Found ${scriptTags.length} script tags`);
      
      // Look for product/webinar references
      const webinarRefs = html.match(/(webinar|event|training|seminar|zoominar|course)/gi) || [];
      if (webinarRefs.length > 0) {
        console.log(`🎯 Webinar/event mentions: ${webinarRefs.slice(0, 10).join(', ')}`);
      }
      
      // Check for CSRF tokens or other auth mechanisms
      const csrfMatch = html.match(/csrf|nonce|token/gi);
      if (csrfMatch) {
        console.log(`🔐 Security tokens found: ${csrfMatch.length} references`);
      }
      
    } else {
      console.log(`❌ Login page error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Login page access error: ${error.message}`);
  }

  console.log('\n💡 ANALYSIS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Based on the responses above:');
  console.log('1. Check which endpoints returned 200 status with data');
  console.log('2. Look for API endpoints discovered in HTML pages');
  console.log('3. Note any authentication requirements');
  console.log('4. Identify any webinar/product references found');
  console.log('5. Check if login credentials are needed for API access');
  console.log('\n🎯 Next steps:');
  console.log('- If login required: Get credentials to access member area');
  console.log('- If API endpoints found: Test them with proper authentication');
  console.log('- If product data visible: Extract webinar/event information');
}

checkMemberAreaSite();