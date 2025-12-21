/**
 * Check Promo 10.10 2025 Product from Sejoli REST API
 */

const SEJOLI_PRODUCTS_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/products';

async function checkPromo1010Product() {
  console.log('🔍 CHECKING PROMO 10.10 2025 FROM SEJOLI REST API\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    console.log('📡 Fetching products from Sejoli API...');
    const response = await fetch(SEJOLI_PRODUCTS_API);
    const products = await response.json();
    
    console.log(`✅ Fetched ${products.length} products\n`);

    // Search for Promo 10.10 2025
    console.log('🔎 Searching for "Promo 10.10 2025"...\n');
    
    const promo1010 = products.find(p => 
      (p.title || p.name || '').toLowerCase().includes('promo 10.10') ||
      (p.title || p.name || '').toLowerCase().includes('10.10') ||
      (p.title || p.name || '').toLowerCase().includes('1010')
    );

    if (!promo1010) {
      console.log('❌ Product "Promo 10.10 2025" tidak ditemukan\n');
      console.log('📋 Showing all products containing "promo":\n');
      
      const promoProducts = products.filter(p => 
        (p.title || p.name || '').toLowerCase().includes('promo')
      );
      
      if (promoProducts.length > 0) {
        promoProducts.forEach(p => {
          console.log(`\nProduct ID: ${p.id}`);
          console.log(`Name: ${p.title || p.name}`);
          console.log(`Price: Rp ${(parseFloat(p.price || p.product_raw_price) || 0).toLocaleString('id-ID')}`);
          
          // Check affiliate commission
          const aff1 = p.affiliate?.['1'] || p.affiliate?.['0'] || {};
          const commissionAmount = parseFloat(aff1.fee || 0);
          const commissionType = aff1.type || 'N/A';
          
          console.log(`Commission Type: ${commissionType}`);
          console.log(`Commission Amount: Rp ${commissionAmount.toLocaleString('id-ID')}`);
          console.log(`Affiliate Data:`, JSON.stringify(p.affiliate, null, 2));
        });
      } else {
        console.log('No products containing "promo" found\n');
        console.log('Showing first 10 products:\n');
        products.slice(0, 10).forEach(p => {
          console.log(`- ID ${p.id}: ${p.title || p.name}`);
        });
      }
      
      return;
    }

    // Found the product
    console.log('✅ PRODUCT FOUND!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`Product ID: ${promo1010.id}`);
    console.log(`Product Name: ${promo1010.title || promo1010.name}`);
    console.log(`Price: Rp ${(parseFloat(promo1010.price || promo1010.product_raw_price) || 0).toLocaleString('id-ID')}`);
    console.log(`Status: ${promo1010.status || 'N/A'}`);
    console.log(`Type: ${promo1010.type || 'N/A'}`);
    
    console.log('\n💰 COMMISSION INFORMATION:');
    console.log('─────────────────────────────────────────────────────────────\n');
    
    // Check all affiliate tiers
    if (promo1010.affiliate) {
      console.log('Affiliate Tiers Found:', Object.keys(promo1010.affiliate));
      
      Object.entries(promo1010.affiliate).forEach(([tier, data]) => {
        console.log(`\nTier ${tier}:`);
        console.log(`  Type: ${data.type || 'N/A'}`);
        console.log(`  Fee: ${data.fee || 0}`);
        console.log(`  Commission: Rp ${(parseFloat(data.fee || 0)).toLocaleString('id-ID')}`);
      });
      
      console.log('\n📊 Full Affiliate Data:');
      console.log(JSON.stringify(promo1010.affiliate, null, 2));
    } else {
      console.log('⚠️  NO AFFILIATE DATA FOUND - Commission is 0 (kosong)');
    }
    
    // Check tier 1 commission (most common)
    const tier1 = promo1010.affiliate?.['1'] || promo1010.affiliate?.['0'] || {};
    const commissionAmount = parseFloat(tier1.fee || 0);
    const commissionType = tier1.type || 'none';
    
    console.log('\n🎯 PRIMARY COMMISSION (Tier 1):');
    console.log(`   Type: ${commissionType}`);
    console.log(`   Amount: Rp ${commissionAmount.toLocaleString('id-ID')}`);
    
    if (commissionAmount === 0) {
      console.log('\n❌ KONFIRMASI: KOMISI KOSONG (Rp 0)');
    } else {
      console.log('\n✅ Product has commission configured');
    }
    
    console.log('\n\n📋 FULL PRODUCT DATA:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(promo1010, null, 2));

  } catch (error) {
    console.error('❌ Error fetching Sejoli data:', error);
    throw error;
  }
}

// Run
checkPromo1010Product()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
