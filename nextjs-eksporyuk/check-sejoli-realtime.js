const fetch = require('node-fetch');

const SEJOLI_API_URL = 'https://member.eksporyuk.com/wp-json/sejoli/v1';
const SEJOLI_API_KEY = 'sk_qfW7jLjI9gHXNFuL';

async function checkSejoli() {
  console.log('=== CEK SEJOLI API REALTIME ===\n');
  
  try {
    // Try different endpoints
    console.log('Testing Sejoli API endpoints...\n');
    
    // Test 1: Orders endpoint
    console.log('1. Testing /order endpoint...');
    let ordersResponse = await fetch(`${SEJOLI_API_URL}/order`, {
      headers: {
        'Authorization': `Bearer ${SEJOLI_API_KEY}`
      }
    });
    
    console.log(`   Status: ${ordersResponse.status}`);
    
    if (ordersResponse.status === 404) {
      // Try alternative endpoint
      console.log('\n2. Testing /orders endpoint (plural)...');
      ordersResponse = await fetch(`${SEJOLI_API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${SEJOLI_API_KEY}`
        }
      });
      console.log(`   Status: ${ordersResponse.status}`);
    }
    
    if (ordersResponse.status === 404) {
      // Try users endpoint to see what's available
      console.log('\n3. Testing /user endpoint...');
      const userResponse = await fetch(`${SEJOLI_API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${SEJOLI_API_KEY}`
        }
      });
      console.log(`   Status: ${userResponse.status}`);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(`   Users found: ${userData.users?.length || 0}`);
      }
    }
    
    if (!ordersResponse.ok) {
      console.log('\n❌ Cannot access orders endpoint');
      console.log('Available data: Check /tmp/sales.json file instead');
      return;
    }
    
    const ordersData = await ordersResponse.json();
    
    console.log(`\n📊 TOTAL ORDERS: ${ordersData.orders?.length || 0}`);
    
    // Group by status
    const statusCount = {};
    const productCount = {};
    
    ordersData.orders?.forEach(order => {
      // Count status
      const status = order.status || 'UNKNOWN';
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      // Count products for completed orders
      if (status === 'completed') {
        const productId = order.product_id;
        const productName = order.product_name || `Product ${productId}`;
        if (!productCount[productId]) {
          productCount[productId] = {
            name: productName,
            count: 0,
            price: order.grand_total
          };
        }
        productCount[productId].count++;
      }
    });
    
    console.log('\n📈 ORDERS BY STATUS:');
    Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n✅ TOP 10 PRODUK (COMPLETED ORDERS):');
    Object.entries(productCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([productId, data]) => {
        console.log(`  Product ${productId}: ${data.name}`);
        console.log(`    Orders: ${data.count}`);
        console.log(`    Price: Rp ${Number(data.price).toLocaleString('id-ID')}`);
        console.log();
      });
    
    // Check completed orders detail
    const completedOrders = ordersData.orders?.filter(o => o.status === 'completed') || [];
    console.log(`\n🎯 COMPLETED ORDERS: ${completedOrders.length}`);
    
    // Group by product categories
    const membershipOrders = completedOrders.filter(o => {
      const name = (o.product_name || '').toLowerCase();
      return name.includes('membership') || 
             name.includes('member') || 
             name.includes('bulan') || 
             name.includes('lifetime') ||
             name.includes('tahun');
    });
    
    const webinarOrders = completedOrders.filter(o => {
      const name = (o.product_name || '').toLowerCase();
      return name.includes('webinar') || name.includes('workshop');
    });
    
    console.log(`\n📦 BREAKDOWN BY CATEGORY:`);
    console.log(`  Membership-related: ${membershipOrders.length}`);
    console.log(`  Webinar/Workshop: ${webinarOrders.length}`);
    console.log(`  Others: ${completedOrders.length - membershipOrders.length - webinarOrders.length}`);
    
    // Sample completed orders
    console.log(`\n📋 SAMPLE COMPLETED ORDERS (first 5):`);
    completedOrders.slice(0, 5).forEach(order => {
      console.log(`  Order #${order.id}:`);
      console.log(`    Product: ${order.product_name}`);
      console.log(`    User: ${order.user_data?.display_name || order.user_data?.user_email}`);
      console.log(`    Price: Rp ${Number(order.grand_total).toLocaleString('id-ID')}`);
      console.log(`    Date: ${order.created_at}`);
      console.log();
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSejoli();
