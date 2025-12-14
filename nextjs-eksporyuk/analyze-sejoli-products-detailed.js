const fs = require('fs');

function analyzeSejoliProductsDetailed() {
  try {
    console.log('🔍 ANALISIS DETAIL PRODUK & KOMISI SEJOLI');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    console.log(`\n📦 TOTAL DATA:`);
    console.log(`  Orders: ${sejoliData.orders.length}`);
    console.log(`  Users: ${sejoliData.users.length}`);
    
    // Check if products array exists
    if (!sejoliData.products || sejoliData.products.length === 0) {
      console.log(`\n❌ No 'products' array found in Sejoli data`);
      console.log(`\n🔍 Checking what keys are available:`);
      console.log(`Available keys:`, Object.keys(sejoliData));
    } else {
      console.log(`  Products: ${sejoliData.products.length}`);
    }
    
    // Analyze unique product IDs from orders
    console.log(`\n\n📊 ANALYZING PRODUCTS FROM ORDERS:`);
    console.log(`─────────────────────────────────────────────────────────────────────`);
    
    const productOrders = {};
    const productPrices = {};
    
    for (const order of sejoliData.orders) {
      const productId = order.product_id;
      const amount = parseFloat(order.grand_total) || 0;
      const hasAffiliate = order.affiliate_id && order.affiliate_id > 0;
      
      if (!productOrders[productId]) {
        productOrders[productId] = {
          totalOrders: 0,
          completedOrders: 0,
          affiliateOrders: 0,
          completedAffiliateOrders: 0,
          totalRevenue: 0,
          affiliateRevenue: 0,
          prices: new Set()
        };
      }
      
      productOrders[productId].totalOrders++;
      productOrders[productId].prices.add(amount);
      
      if (order.status === 'completed') {
        productOrders[productId].completedOrders++;
        productOrders[productId].totalRevenue += amount;
        
        if (hasAffiliate) {
          productOrders[productId].completedAffiliateOrders++;
          productOrders[productId].affiliateRevenue += amount;
        }
      }
      
      if (hasAffiliate) {
        productOrders[productId].affiliateOrders++;
      }
    }
    
    // Sort by affiliate orders
    const sortedProducts = Object.entries(productOrders)
      .sort((a, b) => b[1].completedAffiliateOrders - a[1].completedAffiliateOrders);
    
    console.log(`\n🎯 PRODUK DENGAN AFFILIATE ORDERS (TOP 20):`);
    console.log(`─────────────────────────────────────────────────────────────────────`);
    
    for (let i = 0; i < Math.min(20, sortedProducts.length); i++) {
      const [productId, data] = sortedProducts[i];
      
      if (data.completedAffiliateOrders === 0) continue;
      
      const uniquePrices = Array.from(data.prices).filter(p => p > 0).sort((a, b) => b - a);
      const avgPrice = data.affiliateRevenue / (data.completedAffiliateOrders || 1);
      
      console.log(`\n📦 Product ID: ${productId}`);
      console.log(`   Total Orders: ${data.totalOrders} (${data.completedOrders} completed)`);
      console.log(`   Affiliate Orders: ${data.affiliateOrders} (${data.completedAffiliateOrders} completed)`);
      console.log(`   Affiliate Revenue: Rp ${data.affiliateRevenue.toLocaleString()}`);
      console.log(`   Avg Price: Rp ${avgPrice.toLocaleString()}`);
      console.log(`   Price Range: ${uniquePrices.length} unique prices`);
      
      // Show top 5 prices
      if (uniquePrices.length > 0) {
        const topPrices = uniquePrices.slice(0, 5).map(p => `Rp ${p.toLocaleString()}`);
        console.log(`   Sample Prices: ${topPrices.join(', ')}`);
      }
      
      // Suggest commission based on avg price
      let suggestedCommission = 0;
      if (avgPrice >= 1000000) suggestedCommission = 325000;
      else if (avgPrice >= 800000) suggestedCommission = 325000;
      else if (avgPrice >= 600000) suggestedCommission = 250000;
      else if (avgPrice >= 300000) suggestedCommission = 200000;
      else if (avgPrice >= 35000) suggestedCommission = 200000;
      
      if (suggestedCommission > 0) {
        const totalCommission = data.completedAffiliateOrders * suggestedCommission;
        console.log(`   💰 Suggested Commission: Rp ${suggestedCommission.toLocaleString()} per sale`);
        console.log(`   💰 Total Commission: Rp ${totalCommission.toLocaleString()}`);
      }
    }
    
    // Check if there's any metadata about products
    console.log(`\n\n🔍 CHECKING SAMPLE ORDER FOR PRODUCT METADATA:`);
    console.log(`─────────────────────────────────────────────────────────────────────`);
    
    const sampleOrders = sejoliData.orders.slice(0, 5);
    for (const order of sampleOrders) {
      console.log(`\nOrder ID ${order.id}:`);
      console.log(`  Product ID: ${order.product_id}`);
      console.log(`  Amount: Rp ${order.grand_total.toLocaleString()}`);
      console.log(`  Has Affiliate: ${order.affiliate_id > 0 ? 'Yes' : 'No'}`);
      console.log(`  All keys:`, Object.keys(order));
      
      // Check for any product-related fields
      const productFields = Object.keys(order).filter(k => 
        k.toLowerCase().includes('product') || 
        k.toLowerCase().includes('commission') ||
        k.toLowerCase().includes('affiliate')
      );
      
      if (productFields.length > 0) {
        console.log(`  Product-related fields:`, productFields);
        for (const field of productFields) {
          console.log(`    ${field}: ${order[field]}`);
        }
      }
    }
    
    // Summary by price ranges
    console.log(`\n\n💰 SUMMARY BY PRICE RANGE (Completed Affiliate Orders):`);
    console.log(`─────────────────────────────────────────────────────────────────────`);
    
    const priceRanges = {
      'Rp 0 - 35K': { orders: 0, revenue: 0, commission: 0 },
      'Rp 35K - 300K': { orders: 0, revenue: 0, commission: 200000 },
      'Rp 300K - 600K': { orders: 0, revenue: 0, commission: 200000 },
      'Rp 600K - 800K': { orders: 0, revenue: 0, commission: 250000 },
      'Rp 800K - 1M': { orders: 0, revenue: 0, commission: 325000 },
      'Rp 1M+': { orders: 0, revenue: 0, commission: 325000 }
    };
    
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && o.affiliate_id > 0 && o.status === 'completed'
    );
    
    for (const order of affiliateOrders) {
      const amount = parseFloat(order.grand_total) || 0;
      
      if (amount < 35000) {
        priceRanges['Rp 0 - 35K'].orders++;
        priceRanges['Rp 0 - 35K'].revenue += amount;
      } else if (amount < 300000) {
        priceRanges['Rp 35K - 300K'].orders++;
        priceRanges['Rp 35K - 300K'].revenue += amount;
      } else if (amount < 600000) {
        priceRanges['Rp 300K - 600K'].orders++;
        priceRanges['Rp 300K - 600K'].revenue += amount;
      } else if (amount < 800000) {
        priceRanges['Rp 600K - 800K'].orders++;
        priceRanges['Rp 600K - 800K'].revenue += amount;
      } else if (amount < 1000000) {
        priceRanges['Rp 800K - 1M'].orders++;
        priceRanges['Rp 800K - 1M'].revenue += amount;
      } else {
        priceRanges['Rp 1M+'].orders++;
        priceRanges['Rp 1M+'].revenue += amount;
      }
    }
    
    let grandTotalCommission = 0;
    
    for (const [range, data] of Object.entries(priceRanges)) {
      const totalCommission = data.orders * data.commission;
      grandTotalCommission += totalCommission;
      
      console.log(`\n${range}:`);
      console.log(`  Orders: ${data.orders}`);
      console.log(`  Revenue: Rp ${data.revenue.toLocaleString()}`);
      console.log(`  Commission per sale: Rp ${data.commission.toLocaleString()}`);
      console.log(`  Total Commission: Rp ${totalCommission.toLocaleString()}`);
    }
    
    console.log(`\n\n📊 GRAND TOTAL:`);
    console.log(`  Total Affiliate Orders: ${affiliateOrders.length}`);
    console.log(`  Total Affiliate Revenue: Rp ${affiliateOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0).toLocaleString()}`);
    console.log(`  💰 TOTAL COMMISSION: Rp ${grandTotalCommission.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeSejoliProductsDetailed();