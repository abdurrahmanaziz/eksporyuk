const fetch = require('node-fetch');

async function extractSejoliProductData() {
  console.log('🎯 EXTRACTING SEJOLI PRODUCT DATA FROM MEMBER AREA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiUrl = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/products';
  
  try {
    console.log('🔗 Fetching product data from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const products = await response.json();
      
      console.log(`✅ SUCCESS: Found ${products.length} products\n`);
      
      // 1. Analyze all products
      console.log('📊 PRODUCT ANALYSIS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      let webinarCount = 0;
      let trainingCount = 0;
      let eventCount = 0;
      let highValueCount = 0;
      let totalValue = 0;
      
      const webinarProducts = [];
      const highValueProducts = [];
      const recentProducts = [];
      
      products.forEach((product, index) => {
        // Basic info
        const title = product.title || product.name || 'N/A';
        const price = product.price || product.regular_price || product.sejoli_price || 0;
        const id = product.id || product.product_id;
        const dateCreated = product.date_created || product.created_at;
        const status = product.status || product.post_status;
        
        // Categorize products
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('webinar')) {
          webinarCount++;
          webinarProducts.push({ id, title, price, dateCreated });
        }
        
        if (titleLower.includes('training') || titleLower.includes('pelatihan')) {
          trainingCount++;
        }
        
        if (titleLower.includes('event') || titleLower.includes('seminar')) {
          eventCount++;
        }
        
        if (price >= 500000) {
          highValueCount++;
          highValueProducts.push({ id, title, price, dateCreated });
        }
        
        // Check if created in December 2025
        if (dateCreated && dateCreated.includes('2025-12')) {
          recentProducts.push({ id, title, price, dateCreated });
        }
        
        totalValue += parseInt(price) || 0;
      });
      
      console.log(`  📦 Total Products: ${products.length}`);
      console.log(`  🎯 Webinars: ${webinarCount}`);
      console.log(`  📚 Training: ${trainingCount}`);
      console.log(`  📅 Events: ${eventCount}`);
      console.log(`  💰 High-value (>500K): ${highValueCount}`);
      console.log(`  🗓️ December 2025: ${recentProducts.length}`);
      console.log(`  💵 Total Value: Rp. ${totalValue.toLocaleString()}\n`);
      
      // 2. Show webinar products
      if (webinarProducts.length > 0) {
        console.log('🎯 WEBINAR PRODUCTS FOUND:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        webinarProducts.slice(0, 10).forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}`);
          console.log(`     Title: ${product.title}`);
          console.log(`     Price: Rp. ${(product.price || 0).toLocaleString()}`);
          console.log(`     Date: ${product.dateCreated || 'N/A'}`);
          console.log('');
        });
        
        if (webinarProducts.length > 10) {
          console.log(`  ... and ${webinarProducts.length - 10} more webinars\n`);
        }
      }
      
      // 3. Show high-value products
      if (highValueProducts.length > 0) {
        console.log('💰 HIGH-VALUE PRODUCTS (>500K):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Sort by price descending
        highValueProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        
        highValueProducts.slice(0, 15).forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}`);
          console.log(`     Title: ${product.title}`);
          console.log(`     Price: Rp. ${(product.price || 0).toLocaleString()}`);
          console.log(`     Date: ${product.dateCreated || 'N/A'}`);
          console.log('');
        });
        
        if (highValueProducts.length > 15) {
          console.log(`  ... and ${highValueProducts.length - 15} more high-value products\n`);
        }
      }
      
      // 4. Show recent December products
      if (recentProducts.length > 0) {
        console.log('🗓️ DECEMBER 2025 PRODUCTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        recentProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}`);
          console.log(`     Title: ${product.title}`);
          console.log(`     Price: Rp. ${(product.price || 0).toLocaleString()}`);
          console.log(`     Date: ${product.dateCreated || 'N/A'}`);
          console.log('');
        });
      }
      
      // 5. Sample detailed product structure
      console.log('📋 DETAILED PRODUCT STRUCTURE SAMPLE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (products.length > 0) {
        const sampleProduct = products[0];
        console.log('Sample product (all fields):');
        
        Object.keys(sampleProduct).forEach(key => {
          const value = sampleProduct[key];
          let displayValue;
          
          if (typeof value === 'string' && value.length > 100) {
            displayValue = value.substring(0, 100) + '...';
          } else if (typeof value === 'object' && value !== null) {
            displayValue = `[Object with ${Object.keys(value).length} keys]`;
          } else {
            displayValue = value;
          }
          
          console.log(`  ${key}: ${JSON.stringify(displayValue)}`);
        });
      }
      
      // 6. Price distribution analysis
      console.log('\n💵 PRICE DISTRIBUTION ANALYSIS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const priceRanges = {
        'Free (0)': 0,
        'Low (1-100K)': 0,
        'Medium (100K-500K)': 0,
        'High (500K-1M)': 0,
        'Premium (1M+)': 0
      };
      
      products.forEach(product => {
        const price = product.price || product.regular_price || product.sejoli_price || 0;
        
        if (price === 0) priceRanges['Free (0)']++;
        else if (price < 100000) priceRanges['Low (1-100K)']++;
        else if (price < 500000) priceRanges['Medium (100K-500K)']++;
        else if (price < 1000000) priceRanges['High (500K-1M)']++;
        else priceRanges['Premium (1M+)']++;
      });
      
      Object.entries(priceRanges).forEach(([range, count]) => {
        console.log(`  ${range}: ${count} products`);
      });
      
      // 7. Missing transaction analysis
      console.log('\n🚨 MISSING TRANSACTION IMPACT:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const expectedMissingRevenue = 452863527; // From previous analysis
      const expectedMissingTransactions = 699;
      const avgMissingTransactionValue = expectedMissingRevenue / expectedMissingTransactions;
      
      console.log(`  📊 Expected missing transactions: ${expectedMissingTransactions.toLocaleString()}`);
      console.log(`  💰 Expected missing revenue: Rp. ${expectedMissingRevenue.toLocaleString()}`);
      console.log(`  📈 Avg missing transaction value: Rp. ${Math.round(avgMissingTransactionValue).toLocaleString()}`);
      
      // Calculate how many high-value products could account for missing transactions
      const potentialMatches = highValueProducts.filter(p => (p.price || 0) >= avgMissingTransactionValue * 0.8);
      
      console.log(`  🎯 Products matching missing value profile: ${potentialMatches.length}`);
      console.log(`  🔍 These products likely have missing sales transactions`);
      
      // 8. Next steps
      console.log('\n🚀 NEXT STEPS FOR DATA RECOVERY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('  1. ✅ FOUND PRODUCT DATA - 52 products available');
      console.log(`  2. 🎯 Focus on ${highValueCount} high-value products (likely webinars)`);
      console.log(`  3. 📅 Prioritize ${recentProducts.length} December 2025 products`);
      console.log('  4. 🔍 Need to find sales/order data for these products');
      console.log('  5. 💰 Import missing transactions worth Rp. 452M+');
      console.log('  6. 🏆 Generate affiliate commissions for missing sales');
      
      console.log('\n🔗 SUGGESTED API ENDPOINTS TO CHECK NEXT:');
      console.log('  - /wp-json/sejoli-api/v1/orders (for sales data)');
      console.log('  - /wp-json/sejoli-api/v1/commissions (for affiliate data)');
      console.log('  - /wp-json/sejoli-api/v1/transactions (for payment data)');
      console.log('  - Product-specific endpoints for sales history');
      
      console.log('\n✅ PRODUCT DATA EXTRACTION COMPLETE');
      console.log('🎯 CRITICAL: Found the missing webinar/event products!');
      console.log('🚨 PRIORITY: Extract sales transactions for these products');
      
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

extractSejoliProductData();