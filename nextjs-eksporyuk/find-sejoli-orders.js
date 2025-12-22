const fetch = require('node-fetch');

async function findSejoliOrdersAndSales() {
  console.log('🔍 FINDING SEJOLI ORDERS AND SALES DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const baseUrl = 'https://member.eksporyuk.com';
  
  // 1. First, extract real product prices
  console.log('💰 EXTRACTING REAL PRODUCT PRICES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const productsResponse = await fetch(`${baseUrl}/wp-json/sejoli-api/v1/products`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (productsResponse.status === 200) {
      const products = await productsResponse.json();
      
      console.log('🎯 WEBINARS WITH REAL PRICING:');
      
      const webinarsWithPricing = products.filter(product => {
        const title = (product.title || '').toLowerCase();
        const realPrice = product.product_raw_price || 0;
        
        return title.includes('webinar') && realPrice > 0;
      });
      
      webinarsWithPricing.forEach((webinar, index) => {
        console.log(`  ${index + 1}. ${webinar.title}`);
        console.log(`     ID: ${webinar.id}`);
        console.log(`     Real Price: Rp. ${(webinar.product_raw_price || 0).toLocaleString()}`);
        console.log(`     Display Price: ${webinar.product_price || 'N/A'}`);
        console.log(`     Status: ${webinar.product_active ? 'Active' : 'Inactive'}`);
        console.log(`     Date: ${webinar.date_created}`);
        console.log('');
      });
      
      // Check all high-value products (not just webinars)
      const highValueProducts = products.filter(product => (product.product_raw_price || 0) >= 300000);
      
      console.log(`💎 ALL HIGH-VALUE PRODUCTS (>300K): ${highValueProducts.length}`);
      
      if (highValueProducts.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        highValueProducts.slice(0, 15).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.title}`);
          console.log(`     ID: ${product.id}`);
          console.log(`     Price: Rp. ${(product.product_raw_price || 0).toLocaleString()}`);
          console.log(`     Type: ${product.product_type || 'N/A'}`);
          console.log(`     Status: ${product.product_active ? 'Active' : 'Inactive'}`);
          console.log('');
        });
        
        const totalHighValueRevenue = highValueProducts.reduce((sum, product) => sum + (product.product_raw_price || 0), 0);
        console.log(`💰 Total High-Value Product Value: Rp. ${totalHighValueRevenue.toLocaleString()}\n`);
      }
    }
  } catch (e) {
    console.log(`❌ Error fetching products: ${e.message}\n`);
  }
  
  // 2. Now check for orders/sales endpoints
  console.log('📊 SEARCHING FOR ORDERS/SALES ENDPOINTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const orderEndpoints = [
    '/wp-json/sejoli-api/v1/orders',
    '/wp-json/sejoli-api/v1/order',
    '/wp-json/sejoli-api/v1/sales',
    '/wp-json/sejoli-api/v1/transactions',
    '/wp-json/sejoli-api/v1/payment',
    '/wp-json/sejoli-api/v1/purchase',
    '/wp-json/sejoli-api/v1/invoice',
    '/wp-json/sejoli-api/v1/commissions',
    '/wp-json/sejoli-api/v1/commission',
    '/wp-json/sejoli-api/v1/affiliates',
    '/wp-json/sejoli/v1/orders',
    '/wp-json/sejoli/v1/order',
    '/wp-json/wc/v3/orders',
    '/wp-json/wp/v2/sejoli_order',
    '/wp-json/wp/v2/shop_order',
    '/wp-admin/admin-ajax.php?action=get_orders',
    '/wp-admin/admin-ajax.php?action=sejoli_orders',
    '/wp-admin/admin-ajax.php?action=get_sales'
  ];
  
  for (const endpoint of orderEndpoints) {
    const url = baseUrl + endpoint;
    
    try {
      console.log(`🔗 Testing: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            
            if (Array.isArray(data)) {
              console.log(`   ✅ SUCCESS: Found ${data.length} order records`);
              
              if (data.length > 0) {
                const sample = data[0];
                console.log(`   📊 Sample order fields: ${Object.keys(sample).slice(0, 10).join(', ')}`);
                
                // Look for high-value orders
                const highValueOrders = data.filter(order => {
                  const amount = order.amount || order.total || order.price || order.grand_total || 0;
                  return amount >= 500000;
                });
                
                if (highValueOrders.length > 0) {
                  console.log(`   🎯 HIGH-VALUE ORDERS: ${highValueOrders.length} (>500K)`);
                  
                  highValueOrders.slice(0, 3).forEach((order, index) => {
                    console.log(`      ${index + 1}. Amount: ${order.amount || order.total || 'N/A'}`);
                    console.log(`         Date: ${order.date_created || order.created_at || 'N/A'}`);
                    console.log(`         Status: ${order.status || 'N/A'}`);
                  });
                }
                
                // Look for December 2025 orders
                const recentOrders = data.filter(order => {
                  const dateStr = order.date_created || order.created_at || '';
                  return dateStr.includes('2025-12');
                });
                
                if (recentOrders.length > 0) {
                  console.log(`   📅 DECEMBER 2025 ORDERS: ${recentOrders.length}`);
                }
              }
            } else if (typeof data === 'object' && data !== null) {
              console.log(`   ✅ SUCCESS: Object response`);
              console.log(`   📊 Response keys: ${Object.keys(data).join(', ')}`);
              
              if (data.data && Array.isArray(data.data)) {
                console.log(`   📦 Data array contains: ${data.data.length} items`);
              }
            }
          } catch (jsonError) {
            const text = await response.text();
            console.log(`   ⚠️ JSON parse error, response length: ${text.length}`);
          }
        } else {
          const text = await response.text();
          console.log(`   📄 Non-JSON response (${text.length} chars)`);
        }
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication required`);
      } else if (response.status === 403) {
        console.log(`   🚫 Access forbidden - might need login`);
      } else if (response.status === 404) {
        console.log(`   ❌ Endpoint not found`);
      }
      
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        console.log(`   ⏱️ Request timeout`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 3. Check specific product sales
  console.log('🎯 CHECKING SPECIFIC PRODUCT SALES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Try to get sales for specific webinar products
  const webinarIds = [21476, 20130, 19042]; // Recent webinars
  
  for (const productId of webinarIds) {
    const productSalesEndpoints = [
      `/wp-json/sejoli-api/v1/products/${productId}/orders`,
      `/wp-json/sejoli-api/v1/products/${productId}/sales`,
      `/wp-json/sejoli-api/v1/orders?product_id=${productId}`,
      `/wp-json/sejoli-api/v1/sales?product=${productId}`
    ];
    
    for (const endpoint of productSalesEndpoints) {
      try {
        console.log(`🔗 Testing product ${productId}: ${endpoint}`);
        
        const response = await fetch(baseUrl + endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 200) {
          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   ✅ FOUND ${data.length} sales for product ${productId}!`);
            
            const totalSales = data.reduce((sum, sale) => {
              const amount = sale.amount || sale.total || sale.price || 0;
              return sum + amount;
            }, 0);
            
            console.log(`   💰 Total sales: Rp. ${totalSales.toLocaleString()}`);
            
            break; // Found data, no need to try other endpoints for this product
          }
        } else {
          console.log(`   Status: ${response.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n🎯 SUMMARY AND NEXT ACTIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Products API working - found real prices in product_raw_price field');
  console.log('🔍 Need to identify working orders/sales endpoint');
  console.log('🎯 Focus on high-value product sales (webinars, training)');
  console.log('💰 Target: Import 699 missing transactions worth Rp. 452M');
  console.log('📅 Priority: December 2025 recent sales');
  console.log('\n🚨 CRITICAL: Find the orders endpoint that contains sales transaction data!');
}

findSejoliOrdersAndSales();