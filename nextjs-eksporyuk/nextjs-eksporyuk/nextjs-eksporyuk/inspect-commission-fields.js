const fetch = require('node-fetch');

async function inspectProductCommissionFields() {
  console.log('🔍 INSPECTING ALL PRODUCT FIELDS FOR COMMISSION DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    const products = await response.json();
    console.log(`✅ Analyzing ${products.length} products for commission fields\n`);
    
    // 1. Inspect first product completely
    if (products.length > 0) {
      const sampleProduct = products[0];
      console.log('📋 COMPLETE SAMPLE PRODUCT STRUCTURE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Product: ${sampleProduct.title}`);
      console.log(`ID: ${sampleProduct.id}`);
      console.log('');
      
      console.log('ALL FIELDS:');
      Object.keys(sampleProduct).forEach(key => {
        const value = sampleProduct[key];
        
        if (key.toLowerCase().includes('affiliate') || 
            key.toLowerCase().includes('commission') || 
            key.toLowerCase().includes('rate') ||
            key.toLowerCase().includes('reward') ||
            key.toLowerCase().includes('bonus')) {
          
          console.log(`🎯 ${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          let displayValue;
          if (typeof value === 'string' && value.length > 100) {
            displayValue = value.substring(0, 100) + '...';
          } else if (typeof value === 'object' && value !== null) {
            displayValue = `[Object with ${Object.keys(value).length} keys]`;
          } else {
            displayValue = value;
          }
          console.log(`  ${key}: ${displayValue}`);
        }
      });
    }
    
    // 2. Check for commission-related fields across all products
    console.log('\n🔍 SEARCHING FOR COMMISSION FIELDS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const commissionFields = new Set();
    const allFields = new Set();
    
    products.forEach(product => {
      Object.keys(product).forEach(key => {
        allFields.add(key);
        
        if (key.toLowerCase().includes('affiliate') || 
            key.toLowerCase().includes('commission') || 
            key.toLowerCase().includes('rate') ||
            key.toLowerCase().includes('reward') ||
            key.toLowerCase().includes('bonus') ||
            key.toLowerCase().includes('fee')) {
          commissionFields.add(key);
        }
      });
    });
    
    console.log('🎯 Potential commission fields found:');
    if (commissionFields.size > 0) {
      Array.from(commissionFields).forEach(field => {
        console.log(`  ${field}`);
      });
    } else {
      console.log('  ❌ No obvious commission fields found');
    }
    
    console.log('\n📊 All available fields:');
    console.log(Array.from(allFields).join(', '));
    
    // 3. Deep dive into affiliate object structure
    console.log('\n🔍 DEEP DIVE: AFFILIATE OBJECT ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const affiliateStructures = {};
    
    products.forEach(product => {
      if (product.affiliate && typeof product.affiliate === 'object') {
        const structure = JSON.stringify(Object.keys(product.affiliate).sort());
        
        if (!affiliateStructures[structure]) {
          affiliateStructures[structure] = {
            count: 0,
            sample: product.affiliate,
            productExample: product.title
          };
        }
        affiliateStructures[structure].count++;
      }
    });
    
    Object.entries(affiliateStructures).forEach(([structure, data]) => {
      console.log(`📦 Structure (${data.count} products): ${structure}`);
      console.log(`   Example from: ${data.productExample}`);
      console.log(`   Sample data:`, JSON.stringify(data.sample, null, 2));
      console.log('');
    });
    
    // 4. Check for hidden commission data in specific products
    console.log('\n💰 HIGH-VALUE PRODUCT COMMISSION CHECK:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const highValueProducts = products.filter(p => (p.product_raw_price || 0) >= 500000);
    
    highValueProducts.slice(0, 5).forEach(product => {
      console.log(`\n🎯 Product: ${product.title}`);
      console.log(`   Price: Rp. ${(product.product_raw_price || 0).toLocaleString()}`);
      console.log('   Affiliate data:', JSON.stringify(product.affiliate, null, 2));
      
      // Check other potential commission fields
      const potentialCommissionKeys = Object.keys(product).filter(key => 
        key.toLowerCase().includes('commission') || 
        key.toLowerCase().includes('affiliate') ||
        key.toLowerCase().includes('rate')
      );
      
      if (potentialCommissionKeys.length > 0) {
        console.log('   Potential commission fields:');
        potentialCommissionKeys.forEach(key => {
          console.log(`     ${key}:`, product[key]);
        });
      }
    });
    
    // 5. Check if commission data might be in separate endpoint
    console.log('\n🔗 CHECKING FOR COMMISSION-SPECIFIC ENDPOINTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const commissionEndpoints = [
      '/wp-json/sejoli-api/v1/commissions',
      '/wp-json/sejoli-api/v1/affiliate/commissions',
      '/wp-json/sejoli-api/v1/products/commissions',
      '/wp-json/sejoli-api/v1/commission-rates',
      '/wp-json/sejoli/v1/commissions',
      '/wp-json/wp/v2/sejoli_commission'
    ];
    
    for (const endpoint of commissionEndpoints) {
      try {
        console.log(`🔗 Testing: ${endpoint}`);
        
        const testResponse = await fetch(`https://member.eksporyuk.com${endpoint}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        
        console.log(`   Status: ${testResponse.status}`);
        
        if (testResponse.status === 200) {
          const data = await testResponse.json();
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   ✅ Found ${data.length} commission records!`);
            console.log(`   Sample:`, JSON.stringify(data[0], null, 2));
          } else if (typeof data === 'object') {
            console.log(`   ✅ Commission data object:`, JSON.stringify(data, null, 2));
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // 6. Fallback commission rates based on Sejoli analysis
    console.log('\n📊 FALLBACK COMMISSION STRATEGY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('Since direct commission data not found, using Sejoli dashboard analysis:');
    console.log('  Total Sejoli Commission: Rp. 1,256,771,000');
    console.log('  Total Sejoli Revenue: Rp. 4,158,894,962');
    console.log('  Average Commission Rate: 30.2%');
    console.log('');
    
    // Create realistic commission estimates by product type
    const commissionEstimates = {};
    
    products.forEach(product => {
      const productId = product.id;
      const title = product.title.toLowerCase();
      const price = product.product_raw_price || 0;
      
      let estimatedRate = 0;
      let commissionType = 'PERCENTAGE';
      
      // Estimate based on product type
      if (title.includes('webinar') && price === 0) {
        estimatedRate = 0; // Free webinars typically no commission
      } else if (title.includes('webinar') && price > 0) {
        estimatedRate = 25; // Paid webinars 25%
      } else if (title.includes('lifetime') || title.includes('paket')) {
        estimatedRate = 35; // Lifetime packages 35%
      } else if (title.includes('promo')) {
        estimatedRate = 30; // Promo products 30%
      } else if (price >= 1000000) {
        estimatedRate = 40; // High-value products 40%
      } else if (price >= 500000) {
        estimatedRate = 30; // Medium products 30%
      } else if (price > 0) {
        estimatedRate = 25; // Low-value products 25%
      }
      
      commissionEstimates[productId] = {
        type: commissionType,
        rate: estimatedRate,
        amount: Math.round((price * estimatedRate) / 100),
        estimated: true
      };
    });
    
    console.log('🎯 Estimated commission structure created for', Object.keys(commissionEstimates).length, 'products');
    
    // Save estimated commission data
    const fs = require('fs');
    const commissionData = {
      generated_at: new Date().toISOString(),
      source: 'estimated_from_sejoli_analysis',
      total_commission_pool: 1256771000,
      average_rate: 30.2,
      products: commissionEstimates
    };
    
    fs.writeFileSync('estimated-commissions.json', JSON.stringify(commissionData, null, 2));
    
    console.log('✅ Estimated commission data saved to estimated-commissions.json');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Use estimated commission rates based on product analysis');
    console.log('2. Update import script to use realistic commission calculations');
    console.log('3. Validate commission totals match Sejoli dashboard (1.25B)');
    console.log('4. Consider getting commission data from Sejoli admin panel if API insufficient');
    
  } catch (error) {
    console.error('❌ Commission inspection error:', error);
  }
}

inspectProductCommissionFields();