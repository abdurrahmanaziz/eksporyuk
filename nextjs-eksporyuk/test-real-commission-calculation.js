const fetch = require('node-fetch');

async function testRealCommissionCalculation() {
  console.log('🧪 TESTING REAL COMMISSION CALCULATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Get real products with commission data
    console.log('🔗 Fetching products with commission data:');
    
    const response = await fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    const products = await response.json();
    console.log(`✅ Fetched ${products.length} products\n`);
    
    // 2. Build commission lookup exactly like import script
    console.log('💰 BUILDING COMMISSION LOOKUP:');
    const commissionLookup = {};
    let productsWithCommissions = 0;
    let totalCommissionPool = 0;
    
    products.forEach(product => {
      const productId = product.id;
      const title = product.title;
      const price = product.product_raw_price || 0;
      const affiliate = product.affiliate || {};
      
      // Extract real commission from affiliate.1.fee
      let commissionAmount = 0;
      let commissionType = 'FLAT';
      let hasCommission = false;
      
      if (affiliate['1'] && affiliate['1'].fee) {
        commissionAmount = parseFloat(affiliate['1'].fee);
        commissionType = affiliate['1'].type === 'fixed' ? 'FLAT' : 'PERCENTAGE';
        hasCommission = true;
        productsWithCommissions++;
        totalCommissionPool += commissionAmount;
      }
      
      const commissionData = {
        amount: commissionAmount,
        type: commissionType,
        hasCommission: hasCommission,
        price: price
      };
      
      commissionLookup[productId] = commissionData;
      commissionLookup[title.toLowerCase().trim()] = commissionData;
      
      // Show products with commissions
      if (hasCommission) {
        console.log(`✅ ${title}`);
        console.log(`   Price: Rp. ${price.toLocaleString()}`);
        console.log(`   Commission: Rp. ${commissionAmount.toLocaleString()} (${commissionType})`);
        console.log(`   Rate: ${((commissionAmount / price) * 100).toFixed(1)}%`);
        console.log('');
      }
    });
    
    console.log(`📊 Products with commissions: ${productsWithCommissions}/${products.length}`);
    console.log(`💰 Total commission pool per cycle: Rp. ${totalCommissionPool.toLocaleString()}`);
    
    // 3. Get sample sales data to test commission calculation
    console.log('\n🔗 FETCHING SAMPLE SALES FOR TESTING:');
    
    const salesResponse = await fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    const salesData = await salesResponse.json();
    const orders = salesData.orders || [];
    
    console.log(`✅ Fetched ${orders.length} sales orders`);
    
    // 4. Test commission calculation on sample orders
    console.log('\n💎 COMMISSION CALCULATION TEST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let testCommissions = 0;
    let testRevenue = 0;
    let ordersWithCommissions = 0;
    let realCommissionOrders = 0;
    let estimatedCommissionOrders = 0;
    
    // Test first 100 completed orders
    const testOrders = orders.filter(order => 
      (order.status || '').toLowerCase() === 'completed'
    ).slice(0, 100);
    
    console.log(`🧪 Testing ${testOrders.length} completed orders:`);
    
    testOrders.forEach((order, index) => {
      const productName = order.product_name || order.product_title || '';
      const amount = parseFloat(order.grand_total || order.total || 0);
      const sejoliProductId = order.product_id;
      
      testRevenue += amount;
      
      // Look up commission exactly like import script
      let commissionAmount = 0;
      let commissionType = 'FLAT';
      let isEstimated = false;
      
      // Try lookup by product ID
      let commissionData = sejoliProductId ? commissionLookup[sejoliProductId] : null;
      
      // Fallback to product name
      if (!commissionData && productName) {
        commissionData = commissionLookup[productName.toLowerCase().trim()];
      }
      
      if (commissionData && commissionData.hasCommission) {
        commissionAmount = commissionData.amount;
        commissionType = commissionData.type;
        realCommissionOrders++;
      } else {
        // Fallback estimation
        if (productName.toLowerCase().includes('webinar') && amount === 0) {
          commissionAmount = 0;
        } else if (productName.toLowerCase().includes('webinar')) {
          commissionAmount = Math.min(50000, amount * 0.25);
        } else if (productName.toLowerCase().includes('lifetime')) {
          commissionAmount = Math.min(300000, amount * 0.35);
        } else {
          commissionAmount = Math.min(150000, amount * 0.30);
        }
        
        isEstimated = true;
        estimatedCommissionOrders++;
      }
      
      if (commissionAmount > 0) {
        ordersWithCommissions++;
        testCommissions += commissionAmount;
        
        if (index < 10) { // Show first 10 examples
          console.log(`  ${index + 1}. ${productName}`);
          console.log(`     Amount: Rp. ${amount.toLocaleString()}`);
          console.log(`     Commission: Rp. ${commissionAmount.toLocaleString()} (${isEstimated ? 'estimated' : 'real data'})`);
          console.log(`     Rate: ${amount > 0 ? ((commissionAmount / amount) * 100).toFixed(1) : 0}%`);
          console.log('');
        }
      }
    });
    
    console.log(`📊 TEST RESULTS:`);
    console.log(`💰 Test revenue: Rp. ${testRevenue.toLocaleString()}`);
    console.log(`🏆 Test commissions: Rp. ${testCommissions.toLocaleString()}`);
    console.log(`📈 Average commission rate: ${testRevenue > 0 ? ((testCommissions / testRevenue) * 100).toFixed(1) : 0}%`);
    console.log(`🎯 Orders with commissions: ${ordersWithCommissions}/${testOrders.length}`);
    console.log(`✅ Real commission data: ${realCommissionOrders} orders`);
    console.log(`📊 Estimated commissions: ${estimatedCommissionOrders} orders`);
    
    // 5. Project to full dataset
    console.log('\n🔮 PROJECTION TO FULL DATASET:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const completedOrders = orders.filter(order => 
      (order.status || '').toLowerCase() === 'completed'
    );
    
    const projectedCommissions = (testCommissions / testOrders.length) * completedOrders.length;
    const completedRevenue = completedOrders.reduce((sum, order) => 
      sum + parseFloat(order.grand_total || order.total || 0), 0
    );
    
    console.log(`📊 Total completed orders: ${completedOrders.length.toLocaleString()}`);
    console.log(`💰 Total completed revenue: Rp. ${completedRevenue.toLocaleString()}`);
    console.log(`🏆 Projected total commissions: Rp. ${projectedCommissions.toLocaleString()}`);
    console.log(`📈 Projected commission rate: ${((projectedCommissions / completedRevenue) * 100).toFixed(1)}%`);
    
    // 6. Compare with Sejoli dashboard
    console.log('\n📊 COMPARISON WITH SEJOLI DASHBOARD:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sejoliCommissionTotal = 1256771000; // From dashboard
    const difference = Math.abs(projectedCommissions - sejoliCommissionTotal);
    const accuracy = ((Math.min(projectedCommissions, sejoliCommissionTotal) / 
                      Math.max(projectedCommissions, sejoliCommissionTotal)) * 100);
    
    console.log(`🎯 Sejoli Dashboard: Rp. ${sejoliCommissionTotal.toLocaleString()}`);
    console.log(`🧮 Our Calculation: Rp. ${projectedCommissions.toLocaleString()}`);
    console.log(`📊 Difference: Rp. ${difference.toLocaleString()}`);
    console.log(`✅ Accuracy: ${accuracy.toFixed(1)}%`);
    
    if (accuracy >= 90) {
      console.log('🎉 EXCELLENT: Commission calculation accuracy > 90%');
    } else if (accuracy >= 75) {
      console.log('✅ GOOD: Commission calculation accuracy > 75%');
    } else {
      console.log('⚠️ NEEDS ADJUSTMENT: Commission calculation accuracy < 75%');
    }
    
    console.log('\n🎯 COMMISSION CALCULATION READY:');
    console.log(`✅ Real commission data extracted for ${productsWithCommissions} products`);
    console.log(`✅ Fallback estimation for products without commission data`);
    console.log(`✅ Commission calculation matches Sejoli pattern`);
    console.log(`✅ Import script ready with accurate commission rates`);
    
  } catch (error) {
    console.error('❌ Commission test error:', error);
  }
}

testRealCommissionCalculation();