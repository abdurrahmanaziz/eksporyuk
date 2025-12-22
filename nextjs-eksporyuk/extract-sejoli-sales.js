const fetch = require('node-fetch');

async function extractSejoliSalesData() {
  console.log('🎯 EXTRACTING SEJOLI SALES DATA FROM API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const salesUrl = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';
  
  try {
    console.log('🔗 Fetching sales data from:', salesUrl);
    
    const response = await fetch(salesUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const salesData = await response.json();
      
      console.log('✅ SALES DATA RESPONSE STRUCTURE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log(`📊 Response keys: ${Object.keys(salesData).join(', ')}`);
      console.log(`✅ Valid: ${salesData.valid || 'N/A'}`);
      console.log(`📦 Records Total: ${salesData.recordsTotal || 'N/A'}`);
      console.log(`📦 Records Filtered: ${salesData.recordsFiltered || 'N/A'}`);
      console.log(`📄 Messages: ${JSON.stringify(salesData.messages || 'N/A')}`);
      
      if (salesData.orders) {
        const orders = salesData.orders;
        console.log(`\n🛍️ ORDERS ARRAY: ${Array.isArray(orders) ? orders.length : 'Not an array'} items`);
        
        if (Array.isArray(orders) && orders.length > 0) {
          console.log('\n📊 SALES ORDER ANALYSIS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // Analyze first few orders
          orders.slice(0, 10).forEach((order, index) => {
            console.log(`\n  📋 ORDER ${index + 1}:`);
            
            // Display all available fields
            Object.keys(order).forEach(key => {
              let value = order[key];
              
              if (typeof value === 'string' && value.length > 100) {
                value = value.substring(0, 100) + '...';
              } else if (typeof value === 'object' && value !== null) {
                value = `[Object with ${Object.keys(value).length} keys]`;
              }
              
              console.log(`    ${key}: ${value}`);
            });
          });
          
          // 1. High-value orders analysis
          console.log('\n💰 HIGH-VALUE ORDERS ANALYSIS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          const highValueOrders = orders.filter(order => {
            const amount = order.grand_total || order.total || order.amount || order.price || 0;
            return parseFloat(amount) >= 500000;
          });
          
          console.log(`🎯 High-value orders (>500K): ${highValueOrders.length}`);
          
          if (highValueOrders.length > 0) {
            highValueOrders.slice(0, 15).forEach((order, index) => {
              const amount = order.grand_total || order.total || order.amount || order.price || 0;
              const date = order.date_created || order.created_at || order.order_date || 'N/A';
              const productTitle = order.product_name || order.product_title || order.product || 'N/A';
              const status = order.status || order.order_status || 'N/A';
              const customerId = order.customer_id || order.user_id || 'N/A';
              
              console.log(`  ${index + 1}. Rp. ${parseFloat(amount).toLocaleString()}`);
              console.log(`     Product: ${productTitle}`);
              console.log(`     Date: ${date}`);
              console.log(`     Status: ${status}`);
              console.log(`     Customer: ${customerId}`);
              console.log('');
            });
          }
          
          // 2. December 2025 orders
          console.log('\n📅 DECEMBER 2025 ORDERS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          const decemberOrders = orders.filter(order => {
            const dateStr = order.date_created || order.created_at || order.order_date || '';
            return dateStr.toString().includes('2025-12');
          });
          
          console.log(`🗓️ December 2025 orders: ${decemberOrders.length}`);
          
          if (decemberOrders.length > 0) {
            let decemberRevenue = 0;
            
            decemberOrders.forEach((order, index) => {
              const amount = parseFloat(order.grand_total || order.total || order.amount || order.price || 0);
              const date = order.date_created || order.created_at || order.order_date || 'N/A';
              const product = order.product_name || order.product_title || order.product || 'N/A';
              
              decemberRevenue += amount;
              
              if (index < 10) {
                console.log(`  ${index + 1}. Rp. ${amount.toLocaleString()}`);
                console.log(`     Product: ${product}`);
                console.log(`     Date: ${date}`);
                console.log('');
              }
            });
            
            console.log(`💰 December 2025 Revenue: Rp. ${decemberRevenue.toLocaleString()}`);
            
            if (decemberOrders.length > 10) {
              console.log(`  ... and ${decemberOrders.length - 10} more December orders`);
            }
          }
          
          // 3. Webinar orders specifically
          console.log('\n🎯 WEBINAR ORDERS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          const webinarOrders = orders.filter(order => {
            const product = (order.product_name || order.product_title || order.product || '').toLowerCase();
            return product.includes('webinar') || product.includes('zoom');
          });
          
          console.log(`📹 Webinar orders found: ${webinarOrders.length}`);
          
          if (webinarOrders.length > 0) {
            let webinarRevenue = 0;
            
            webinarOrders.forEach((order, index) => {
              const amount = parseFloat(order.grand_total || order.total || order.amount || order.price || 0);
              const date = order.date_created || order.created_at || order.order_date || 'N/A';
              const product = order.product_name || order.product_title || order.product || 'N/A';
              const status = order.status || order.order_status || 'N/A';
              
              webinarRevenue += amount;
              
              console.log(`  ${index + 1}. Rp. ${amount.toLocaleString()}`);
              console.log(`     Product: ${product}`);
              console.log(`     Date: ${date}`);
              console.log(`     Status: ${status}`);
              console.log('');
            });
            
            console.log(`💰 Total Webinar Revenue: Rp. ${webinarRevenue.toLocaleString()}`);
          }
          
          // 4. Overall statistics
          console.log('\n📊 OVERALL SALES STATISTICS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          let totalRevenue = 0;
          let successfulOrders = 0;
          const statusCounts = {};
          const monthlyStats = {};
          
          orders.forEach(order => {
            const amount = parseFloat(order.grand_total || order.total || order.amount || order.price || 0);
            const status = order.status || order.order_status || 'unknown';
            const date = order.date_created || order.created_at || order.order_date || '';
            
            // Revenue calculation
            if (status === 'completed' || status === 'success' || status === 'paid') {
              totalRevenue += amount;
              successfulOrders++;
            }
            
            // Status counts
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            
            // Monthly breakdown
            if (date) {
              const monthKey = date.substring(0, 7); // YYYY-MM
              if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { count: 0, revenue: 0 };
              }
              monthlyStats[monthKey].count++;
              if (status === 'completed' || status === 'success' || status === 'paid') {
                monthlyStats[monthKey].revenue += amount;
              }
            }
          });
          
          console.log(`📦 Total Orders: ${orders.length.toLocaleString()}`);
          console.log(`✅ Successful Orders: ${successfulOrders.toLocaleString()}`);
          console.log(`💰 Total Revenue: Rp. ${totalRevenue.toLocaleString()}`);
          console.log(`📈 Average Order Value: Rp. ${Math.round(totalRevenue / successfulOrders).toLocaleString()}`);
          
          console.log('\n📊 Order Status Distribution:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  ${status}: ${count} orders`);
          });
          
          console.log('\n📅 Monthly Statistics (Recent):');
          Object.entries(monthlyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12)
            .forEach(([month, stats]) => {
              console.log(`  ${month}: ${stats.count} orders, Rp. ${stats.revenue.toLocaleString()}`);
            });
          
        } else {
          console.log('❌ No orders found in sales data');
        }
      } else {
        console.log('❌ No orders field in sales response');
      }
      
      console.log('\n🎯 MISSING DATA COMPARISON:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (salesData.recordsTotal) {
        const sejoliTotal = parseInt(salesData.recordsTotal);
        const neonTotal = 12180; // From previous analysis
        const gap = sejoliTotal - neonTotal;
        
        console.log(`📊 Sejoli Total Sales: ${sejoliTotal.toLocaleString()}`);
        console.log(`📊 NEON Total Transactions: ${neonTotal.toLocaleString()}`);
        console.log(`🚨 Missing Transactions: ${gap.toLocaleString()}`);
        console.log(`📈 Data Completeness: ${((neonTotal / sejoliTotal) * 100).toFixed(1)}%`);
      }
      
      console.log('\n✅ SALES DATA EXTRACTION COMPLETE');
      console.log('🎯 FOUND: Complete sales transaction data in Sejoli API');
      console.log('🚨 NEXT: Map this data to NEON Event transactions for import');
      
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

extractSejoliSalesData();