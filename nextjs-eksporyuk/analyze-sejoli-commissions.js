const fs = require('fs');

function analyzeSejoliCommissions() {
  try {
    console.log('🔍 ANALYZING SEJOLI PRODUCT COMMISSIONS');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    // Analyze products and their commission structures
    console.log('\n📦 PRODUCTS IN SEJOLI:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    if (sejoliData.products && sejoliData.products.length > 0) {
      for (const product of sejoliData.products) {
        console.log(`\nProduct ID: ${product.id}`);
        console.log(`Name: ${product.name || 'N/A'}`);
        console.log(`Price: Rp ${(product.price || 0).toLocaleString()}`);
        console.log(`Commission Rate: ${product.commission_rate || 'N/A'}`);
        console.log(`Commission Type: ${product.commission_type || 'N/A'}`);
        console.log(`Keys:`, Object.keys(product));
      }
    } else {
      console.log('❌ No products found in Sejoli data');
    }
    
    // Analyze orders with affiliate commissions
    console.log('\n\n💰 AFFILIATE ORDERS ANALYSIS:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && o.affiliate_id > 0 && o.status === 'completed'
    );
    
    console.log(`Total Affiliate Orders (completed): ${affiliateOrders.length}`);
    
    // Group by product_id to see commission patterns
    const ordersByProduct = {};
    const commissionByProduct = {};
    
    for (const order of affiliateOrders) {
      const productId = order.product_id || 'unknown';
      const amount = parseFloat(order.grand_total) || 0;
      
      if (!ordersByProduct[productId]) {
        ordersByProduct[productId] = {
          count: 0,
          totalAmount: 0,
          amounts: []
        };
      }
      
      ordersByProduct[productId].count++;
      ordersByProduct[productId].totalAmount += amount;
      ordersByProduct[productId].amounts.push(amount);
    }
    
    console.log('\n📊 ORDERS BY PRODUCT ID:');
    for (const [productId, data] of Object.entries(ordersByProduct)) {
      console.log(`\nProduct ID ${productId}:`);
      console.log(`  Orders: ${data.count}`);
      console.log(`  Total Revenue: Rp ${data.totalAmount.toLocaleString()}`);
      console.log(`  Avg Amount: Rp ${(data.totalAmount / data.count).toLocaleString()}`);
      console.log(`  Unique Amounts: ${[...new Set(data.amounts)].length}`);
      
      // Show first few unique amounts
      const uniqueAmounts = [...new Set(data.amounts)].sort((a, b) => b - a).slice(0, 5);
      console.log(`  Sample Prices:`, uniqueAmounts.map(a => `Rp ${a.toLocaleString()}`).join(', '));
    }
    
    // Check if orders have commission info
    console.log('\n\n🔍 CHECKING ORDER COMMISSION FIELDS:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const sampleAffiliateOrder = affiliateOrders[0];
    if (sampleAffiliateOrder) {
      console.log('\nSample Affiliate Order:');
      console.log('Order ID:', sampleAffiliateOrder.id);
      console.log('Product ID:', sampleAffiliateOrder.product_id);
      console.log('Grand Total:', sampleAffiliateOrder.grand_total);
      console.log('Affiliate ID:', sampleAffiliateOrder.affiliate_id);
      console.log('All Keys:', Object.keys(sampleAffiliateOrder));
      console.log('\nFull Order Data:');
      console.log(JSON.stringify(sampleAffiliateOrder, null, 2));
    }
    
    // Calculate expected commissions based on common rates
    console.log('\n\n💵 COMMISSION CALCULATIONS (IF RATES ARE):');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const totalAffiliateRevenue = affiliateOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
    
    console.log(`\nTotal Affiliate Revenue: Rp ${totalAffiliateRevenue.toLocaleString()}`);
    console.log(`\nIf commission rates are:`);
    console.log(`  - Rp 200,000 flat per sale: Rp ${(affiliateOrders.length * 200000).toLocaleString()}`);
    console.log(`  - Rp 250,000 flat per sale: Rp ${(affiliateOrders.length * 250000).toLocaleString()}`);
    console.log(`  - Rp 325,000 flat per sale: Rp ${(affiliateOrders.length * 325000).toLocaleString()}`);
    console.log(`  - 30% of revenue: Rp ${(totalAffiliateRevenue * 0.30).toLocaleString()}`);
    
    // Check affiliates data
    console.log('\n\n👥 CHECKING AFFILIATES DATA:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    if (sejoliData.affiliates) {
      console.log(`Total Affiliates: ${sejoliData.affiliates.length}`);
      
      if (sejoliData.affiliates.length > 0) {
        const sampleAffiliate = sejoliData.affiliates[0];
        console.log('\nSample Affiliate:');
        console.log('Keys:', Object.keys(sampleAffiliate));
        console.log('Data:', JSON.stringify(sampleAffiliate, null, 2));
      }
    } else {
      console.log('❌ No affiliates data found');
    }
    
    // Count unique affiliates in orders
    const uniqueAffiliates = new Set(affiliateOrders.map(o => o.affiliate_id));
    console.log(`\nUnique Affiliate IDs in orders: ${uniqueAffiliates.size}`);
    
    // Show affiliate performance
    console.log('\n📊 TOP AFFILIATES BY ORDERS:');
    const affiliateStats = {};
    for (const order of affiliateOrders) {
      const affId = order.affiliate_id;
      if (!affiliateStats[affId]) {
        affiliateStats[affId] = {
          orders: 0,
          revenue: 0
        };
      }
      affiliateStats[affId].orders++;
      affiliateStats[affId].revenue += parseFloat(order.grand_total) || 0;
    }
    
    const topAffiliates = Object.entries(affiliateStats)
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, 10);
    
    for (const [affId, stats] of topAffiliates) {
      console.log(`\nAffiliate ID ${affId}:`);
      console.log(`  Orders: ${stats.orders}`);
      console.log(`  Revenue: Rp ${stats.revenue.toLocaleString()}`);
      console.log(`  Avg per order: Rp ${(stats.revenue / stats.orders).toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeSejoliCommissions();