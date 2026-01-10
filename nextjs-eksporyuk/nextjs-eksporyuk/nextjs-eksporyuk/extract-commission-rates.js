const fetch = require('node-fetch');

async function extractProductCommissionRates() {
  console.log('💰 EXTRACTING REAL COMMISSION RATES FROM SEJOLI PRODUCTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Get all products with commission data
    console.log('🔗 Fetching products with commission data:');
    
    const response = await fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Products API error: ${response.status}`);
    }
    
    const products = await response.json();
    console.log(`✅ Fetched ${products.length} products\n`);
    
    // 2. Analyze commission structures
    console.log('📊 COMMISSION ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const commissionData = [];
    const commissionTypes = {};
    const commissionRanges = {
      'no_commission': 0,
      'under_100k': 0,
      '100k_500k': 0,
      'over_500k': 0,
      'percentage': 0,
      'flat': 0
    };
    
    products.forEach((product, index) => {
      const productId = product.id;
      const title = product.title;
      const price = product.product_raw_price || 0;
      const affiliate = product.affiliate || {};
      
      // Extract commission data
      let commissionType = 'NONE';
      let commissionRate = 0;
      let commissionAmount = 0;
      let hasCommission = false;
      
      // Check affiliate object structure
      if (affiliate && typeof affiliate === 'object') {
        // Common commission fields in Sejoli
        const commissionSettings = affiliate.commission || affiliate.rate || affiliate;
        
        if (commissionSettings) {
          if (typeof commissionSettings === 'number') {
            // Direct number - could be percentage or flat
            if (commissionSettings <= 100) {
              commissionType = 'PERCENTAGE';
              commissionRate = commissionSettings;
              commissionAmount = (price * commissionSettings) / 100;
            } else {
              commissionType = 'FLAT';
              commissionAmount = commissionSettings;
              commissionRate = (commissionSettings / price) * 100;
            }
            hasCommission = true;
          } else if (typeof commissionSettings === 'object') {
            // Object with commission details
            const rate = commissionSettings.rate || commissionSettings.amount || commissionSettings.value;
            const type = commissionSettings.type || (rate <= 100 ? 'percentage' : 'flat');
            
            if (rate > 0) {
              if (type === 'percentage' || rate <= 100) {
                commissionType = 'PERCENTAGE';
                commissionRate = rate;
                commissionAmount = (price * rate) / 100;
              } else {
                commissionType = 'FLAT';
                commissionAmount = rate;
                commissionRate = price > 0 ? (rate / price) * 100 : 0;
              }
              hasCommission = true;
            }
          }
        }
      }
      
      // Fallback: check other possible commission fields
      if (!hasCommission) {
        // Check direct product fields
        const directCommission = product.commission_rate || product.affiliate_commission || product.commission;
        
        if (directCommission && directCommission > 0) {
          if (directCommission <= 100) {
            commissionType = 'PERCENTAGE';
            commissionRate = directCommission;
            commissionAmount = (price * directCommission) / 100;
          } else {
            commissionType = 'FLAT';
            commissionAmount = directCommission;
            commissionRate = price > 0 ? (directCommission / price) * 100 : 0;
          }
          hasCommission = true;
        }
      }
      
      // Store commission data
      const commissionInfo = {
        productId,
        title,
        price,
        commissionType,
        commissionRate: Math.round(commissionRate * 100) / 100,
        commissionAmount: Math.round(commissionAmount),
        hasCommission,
        originalAffiliate: affiliate
      };
      
      commissionData.push(commissionInfo);
      
      // Statistics
      commissionTypes[commissionType] = (commissionTypes[commissionType] || 0) + 1;
      
      if (!hasCommission) {
        commissionRanges.no_commission++;
      } else {
        if (commissionType === 'PERCENTAGE') commissionRanges.percentage++;
        if (commissionType === 'FLAT') commissionRanges.flat++;
        
        if (commissionAmount < 100000) commissionRanges.under_100k++;
        else if (commissionAmount < 500000) commissionRanges['100k_500k']++;
        else commissionRanges.over_500k++;
      }
    });
    
    console.log('📊 Commission type distribution:');
    Object.entries(commissionTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} products`);
    });
    
    console.log('\n💰 Commission amount ranges:');
    Object.entries(commissionRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} products`);
    });
    
    // 3. Show products WITH commissions
    const withCommissions = commissionData.filter(p => p.hasCommission);
    
    console.log(`\n✅ PRODUCTS WITH COMMISSIONS (${withCommissions.length}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (withCommissions.length > 0) {
      // Sort by commission amount descending
      withCommissions.sort((a, b) => b.commissionAmount - a.commissionAmount);
      
      withCommissions.slice(0, 15).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   ID: ${product.productId}`);
        console.log(`   Price: Rp. ${product.price.toLocaleString()}`);
        console.log(`   Commission: ${product.commissionType}`);
        
        if (product.commissionType === 'PERCENTAGE') {
          console.log(`   Rate: ${product.commissionRate}% = Rp. ${product.commissionAmount.toLocaleString()}`);
        } else {
          console.log(`   Amount: Rp. ${product.commissionAmount.toLocaleString()} (${product.commissionRate.toFixed(1)}%)`);
        }
        console.log('');
      });
      
      if (withCommissions.length > 15) {
        console.log(`  ... and ${withCommissions.length - 15} more products with commissions`);
      }
    }
    
    // 4. Show products WITHOUT commissions
    const withoutCommissions = commissionData.filter(p => !p.hasCommission);
    
    console.log(`\n❌ PRODUCTS WITHOUT COMMISSIONS (${withoutCommissions.length}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (withoutCommissions.length > 0) {
      withoutCommissions.slice(0, 10).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} (ID: ${product.productId})`);
        console.log(`   Price: Rp. ${product.price.toLocaleString()}`);
        console.log('');
      });
      
      if (withoutCommissions.length > 10) {
        console.log(`  ... and ${withoutCommissions.length - 10} more products without commissions`);
      }
    }
    
    // 5. Create commission lookup table
    console.log('\n🗂️ CREATING COMMISSION LOOKUP TABLE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const commissionLookup = {};
    
    commissionData.forEach(product => {
      commissionLookup[product.productId] = {
        type: product.commissionType,
        rate: product.commissionRate,
        amount: product.commissionAmount,
        hasCommission: product.hasCommission
      };
      
      // Also create lookup by title (for matching with orders)
      const titleKey = product.title.toLowerCase().trim();
      commissionLookup[titleKey] = {
        type: product.commissionType,
        rate: product.commissionRate,
        amount: product.commissionAmount,
        hasCommission: product.hasCommission
      };
    });
    
    console.log(`✅ Created lookup table with ${Object.keys(commissionLookup).length} entries`);
    
    // 6. Sample affiliate calculations
    console.log('\n💎 SAMPLE COMMISSION CALCULATIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const highCommissionProducts = withCommissions.filter(p => p.commissionAmount >= 100000);
    
    if (highCommissionProducts.length > 0) {
      console.log('High-value commission examples:');
      
      highCommissionProducts.slice(0, 8).forEach((product, index) => {
        console.log(`  ${index + 1}. "${product.title}"`);
        console.log(`     Sale: Rp. ${product.price.toLocaleString()}`);
        console.log(`     Commission: Rp. ${product.commissionAmount.toLocaleString()}`);
        console.log(`     Type: ${product.commissionType} (${product.commissionRate}${product.commissionType === 'PERCENTAGE' ? '%' : ' fixed'})`);
        console.log('');
      });
    }
    
    // 7. Output lookup data for import script
    console.log('\n📝 COMMISSION LOOKUP FOR IMPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const fs = require('fs');
    
    const lookupData = {
      generated_at: new Date().toISOString(),
      total_products: products.length,
      with_commissions: withCommissions.length,
      without_commissions: withoutCommissions.length,
      lookup: commissionLookup
    };
    
    fs.writeFileSync('commission-lookup.json', JSON.stringify(lookupData, null, 2));
    
    console.log('✅ Commission data saved to commission-lookup.json');
    
    // 8. Statistics summary
    console.log('\n📊 COMMISSION SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalPotentialCommission = withCommissions.reduce((sum, p) => sum + p.commissionAmount, 0);
    const avgCommission = withCommissions.length > 0 ? totalPotentialCommission / withCommissions.length : 0;
    
    console.log(`💰 Products with commissions: ${withCommissions.length}/${products.length} (${((withCommissions.length/products.length)*100).toFixed(1)}%)`);
    console.log(`🎯 Total potential commission per sale cycle: Rp. ${totalPotentialCommission.toLocaleString()}`);
    console.log(`📈 Average commission per product: Rp. ${Math.round(avgCommission).toLocaleString()}`);
    
    const percentageProducts = withCommissions.filter(p => p.commissionType === 'PERCENTAGE');
    const flatProducts = withCommissions.filter(p => p.commissionType === 'FLAT');
    
    if (percentageProducts.length > 0) {
      const avgPercentage = percentageProducts.reduce((sum, p) => sum + p.commissionRate, 0) / percentageProducts.length;
      console.log(`📊 Average percentage rate: ${avgPercentage.toFixed(1)}% (${percentageProducts.length} products)`);
    }
    
    if (flatProducts.length > 0) {
      const avgFlat = flatProducts.reduce((sum, p) => sum + p.commissionAmount, 0) / flatProducts.length;
      console.log(`💵 Average flat commission: Rp. ${Math.round(avgFlat).toLocaleString()} (${flatProducts.length} products)`);
    }
    
    console.log('\n🎯 IMPORT READY:');
    console.log('✅ Real commission rates extracted from Sejoli products');
    console.log('✅ Commission lookup table created for accurate calculations');
    console.log('✅ Both percentage and flat rate commissions supported');
    console.log('✅ Ready to update import script with real commission data');
    
  } catch (error) {
    console.error('❌ Commission extraction error:', error);
  }
}

extractProductCommissionRates();