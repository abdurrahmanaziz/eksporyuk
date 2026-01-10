const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import correct commission mapping
const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

async function fixCommissionAmounts() {
  console.log('🔧 FIX COMMISSION AMOUNTS - Using Correct Mapping from prd.md');
  console.log('==============================================================\n');

  try {
    // 1. Load sejoli data untuk mendapat product_id per order
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    console.log(`📊 Loaded ${sejoli.orders.length} orders from Sejoli`);
    
    // 2. Create order lookup by amount + user for matching
    const orderLookup = new Map();
    for (const order of sejoli.orders) {
      const key = `${parseFloat(order.grand_total)}`; // Use amount as key
      if (!orderLookup.has(key)) {
        orderLookup.set(key, []);
      }
      orderLookup.get(key).push(order);
    }
    
    // 3. Get all AffiliateConversions
    const conversions = await prisma.affiliateConversion.findMany({
      include: {
        transaction: true
      }
    });
    
    console.log(`📋 Found ${conversions.length} AffiliateConversions to check\n`);
    
    // 4. Analyze and fix each conversion
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let totalOldCommission = 0;
    let totalNewCommission = 0;
    
    // Track changes by product for reporting
    const changes = [];
    
    for (const conv of conversions) {
      const tx = conv.transaction;
      if (!tx) {
        skipped++;
        continue;
      }
      
      // Find matching Sejoli order by amount
      const possibleOrders = orderLookup.get(`${tx.amount}`) || [];
      
      if (possibleOrders.length === 0) {
        // Fallback: calculate commission from mapping by product price ranges
        const correctCommission = getCommissionByPrice(tx.amount);
        
        if (correctCommission !== conv.commissionAmount) {
          totalOldCommission += conv.commissionAmount;
          totalNewCommission += correctCommission;
          
          await prisma.affiliateConversion.update({
            where: { id: conv.id },
            data: { commissionAmount: correctCommission }
          });
          
          changes.push({
            txAmount: tx.amount,
            oldCommission: conv.commissionAmount,
            newCommission: correctCommission,
            source: 'price-mapping'
          });
          
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
      
      // Find order with product_id
      const orderWithProduct = possibleOrders.find(o => o.product_id);
      
      if (orderWithProduct) {
        const wpProductId = parseInt(orderWithProduct.product_id);
        const correctCommission = getCommissionForProduct(wpProductId);
        
        if (correctCommission !== conv.commissionAmount) {
          totalOldCommission += conv.commissionAmount;
          totalNewCommission += correctCommission;
          
          await prisma.affiliateConversion.update({
            where: { id: conv.id },
            data: { commissionAmount: correctCommission }
          });
          
          const productInfo = PRODUCT_MEMBERSHIP_MAPPING[wpProductId];
          changes.push({
            txAmount: tx.amount,
            productName: productInfo?.name || `Unknown (${wpProductId})`,
            wpProductId,
            oldCommission: conv.commissionAmount,
            newCommission: correctCommission,
            source: 'product-mapping'
          });
          
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Use price-based fallback
        const correctCommission = getCommissionByPrice(tx.amount);
        
        if (correctCommission !== conv.commissionAmount) {
          totalOldCommission += conv.commissionAmount;
          totalNewCommission += correctCommission;
          
          await prisma.affiliateConversion.update({
            where: { id: conv.id },
            data: { commissionAmount: correctCommission }
          });
          
          changes.push({
            txAmount: tx.amount,
            oldCommission: conv.commissionAmount,
            newCommission: correctCommission,
            source: 'price-fallback'
          });
          
          updated++;
        } else {
          skipped++;
        }
      }
      
      if ((updated + skipped) % 500 === 0) {
        console.log(`   Processing... ${updated + skipped}/${conversions.length}`);
      }
    }
    
    console.log('\n📊 HASIL UPDATE KOMISI:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already correct): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    console.log('\n💰 PERUBAHAN TOTAL:');
    console.log(`   Old Total: Rp ${totalOldCommission.toLocaleString('id-ID')}`);
    console.log(`   New Total: Rp ${totalNewCommission.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(totalNewCommission - totalOldCommission).toLocaleString('id-ID')}`);
    
    // Show sample changes
    console.log('\n📝 SAMPLE PERUBAHAN (10 first):');
    changes.slice(0, 10).forEach(c => {
      console.log(`   Amount: Rp ${c.txAmount?.toLocaleString('id-ID')} | Old: Rp ${c.oldCommission?.toLocaleString('id-ID')} → New: Rp ${c.newCommission?.toLocaleString('id-ID')} | ${c.productName || c.source}`);
    });
    
    // Final stats
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('\n🎉 FINAL TOTAL COMMISSION:');
    console.log(`   💵 Rp ${totalCommission._sum.commissionAmount?.toLocaleString('id-ID') || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get commission by price when we don't have product_id
 * These are CORRECT values from prd.md and product-membership-mapping.js
 */
function getCommissionByPrice(price) {
  // Exact matches first - based on product-membership-mapping.js commissionFlat
  const priceCommissionMap = {
    // Webinar/Event prices
    35000: 20000,   // Webinar 35k → komisi 20k
    100000: 50000,  // Webinar 100k → komisi 50k
    150000: 50000,  // Kopdar → komisi 50k
    200000: 50000,  // Event → komisi 50k
    
    // Lifetime membership variants
    999000: 325000,   // Paket Lifetime → 325k (13401)
    899000: 210000,   // Promo THR → 210k (15234)
    949000: 210000,   // Promo MEI → 210k (16956)
    849000: 250000,   // Promo Tahun Baru Islam → 250k (17920)
    799000: 225000,   // Promo Merdeka 80 → 225k (19296)
    879000: 280000,   // Promo 10.10 → 280k max (20852)
    
    // 12 bulan
    799000: 250000,   // Paket 12 bulan → 250k (13399)
    699000: 300000,   // Kelas 12 bulan → 300k (8683)
    
    // 6 bulan  
    599000: 200000,   // Paket 6 bulan → 200k (13400)
    499000: 250000,   // Kelas 6 bulan → 250k (8684)
    
    // Bundling
    1499000: 300000,  // Bundling Kelas + EYA → 300k (3840)
    
    // Tools/EYA
    249000: 75000,    // EYA Automation → 75k (3764)
    299000: 85000,    // EYA Automation v2 → 85k (8686)
    
    // Jasa
    50000: 20000,     // Legalitas Ekspor → 20k (5932)
    500000: 30000,    // Jasa Katalog → 30k (16587)
    1500000: 150000,  // Jasa Website Bisnis → 150k (5935)
    750000: 100000,   // Titip Barang TEI → 100k (20336)
  };
  
  // Check exact match
  if (priceCommissionMap[price]) {
    return priceCommissionMap[price];
  }
  
  // Range-based fallback for unknown prices
  if (price <= 50000) return 20000;       // Small event/webinar
  if (price <= 100000) return 50000;      // Event
  if (price <= 200000) return 50000;      // Kopdar/Event
  if (price <= 400000) return 100000;     // EYA/Tool
  if (price <= 600000) return 200000;     // 6 bulan membership
  if (price <= 800000) return 250000;     // 12 bulan membership
  if (price <= 1100000) return 325000;    // Lifetime membership
  if (price <= 1600000) return 300000;    // Bundling
  if (price <= 2500000) return 500000;    // Premium package
  
  // Default: 25% for unknown high-value products
  return Math.round(price * 0.25);
}

fixCommissionAmounts().catch(console.error);
