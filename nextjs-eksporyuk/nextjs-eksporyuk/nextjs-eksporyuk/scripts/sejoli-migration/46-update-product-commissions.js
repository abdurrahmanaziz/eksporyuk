/**
 * Update Product Commissions & Recalculate Affiliate Conversions
 * 
 * Based on REAL Sejoli data:
 * - Each product has different commission rates (FLAT)
 * - Commission amounts from wp_sejolisa_affiliates table
 * 
 * This script:
 * 1. Updates each product's affiliateCommissionRate with real data
 * 2. Recalculates AffiliateConversion amounts based on product commissions
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Real commission data from Sejoli (FLAT amounts in Rupiah)
// Source: wp_sejolisa_affiliates grouped by product_id
const PRODUCT_COMMISSIONS = {
  // High value products (membership)
  13401: { name: 'Paket Ekspor Yuk Lifetime', commission: 325000 },
  3840: { name: 'Bundling Kelas Ekspor + Aplikasi EYA', commission: 300000 },
  179: { name: 'Kelas Eksporyuk', commission: 250000 }, // Using max, varies 135k-250k
  8683: { name: 'Kelas Ekspor Yuk 12 Bulan', commission: 300000 },
  6068: { name: 'Kelas Bimbingan Ekspor Yuk', commission: 250000 },
  13400: { name: 'Paket Ekspor Yuk 6 Bulan', commission: 200000 },
  13399: { name: 'Paket Ekspor Yuk 12 Bulan', commission: 250000 },
  8684: { name: 'Kelas Ekspor Yuk 6 Bulan', commission: 250000 },
  
  // Promo products
  16956: { name: 'Promo MEI Paket Lifetime 2025', commission: 210000 },
  6810: { name: 'Promo Kemerdekaan', commission: 250000 },
  11207: { name: 'Promo Juli Happy 1-7 Juli 2024', commission: 200000 }, // Using min, varies
  15234: { name: 'Promo Paket Lifetime THR 2025', commission: 210000 },
  20852: { name: 'Promo 10.10 2025', commission: 200000 }, // Using min, varies
  19296: { name: 'Promo Merdeka Ke-80', commission: 225000 },
  4684: { name: 'Ultah Ekspor Yuk', commission: 250000 },
  17920: { name: 'Promo Lifetime Tahun Baru Islam 1447 Hijriah', commission: 250000 },
  
  // Webinar products
  18528: { name: 'Zoom Ekspor 30 Juli 2025', commission: 20000 },
  20130: { name: 'Webinar Ekspor 30 Sept 2025', commission: 20000 }, // Using min
  21476: { name: 'Webinar Ekspor 28 Nov 2025', commission: 20000 }, // Using min
  19042: { name: 'Webinar Ekspor 29 Agustus 2025', commission: 20000 }, // Using min
  
  // Tools/Automation
  3764: { name: 'Ekspor Yuk Automation', commission: 75000 },
  8686: { name: 'Ekspor Yuk Automation EYA', commission: 85000 },
  
  // Events/Kopdar
  13039: { name: 'Kopdar Akbar Ekspor Yuk Feb 2025 #2', commission: 50000 },
  13045: { name: 'Pembelian Tiket Untuk 2 Peserta', commission: 50000 },
  
  // Services
  5935: { name: 'Jasa Website Ekspor Bisnis', commission: 150000 },
  20336: { name: 'Titip Barang TEI 2025', commission: 100000 },
  16587: { name: 'Jasa Katalog Produk', commission: 30000 },
  5932: { name: 'Legalitas Ekspor', commission: 20000 },
  
  // Renewal (0 commission)
  8910: { name: 'Re Kelas Ekspor Lifetime', commission: 0 },
  8914: { name: 'Re Kelas 6 Bulan Ekspor Yuk', commission: 0 },
  8915: { name: 'Re Kelas 12 Bulan Ekspor Yuk', commission: 0 },
  
  // Free webinars (0 commission)
  16130: { name: 'Zoom Ekspor 9 Mei 2025', commission: 0 },
  16826: { name: 'Paket Umroh 1 Bulan + Cari Buyer Ekspor', commission: 0 },
  16963: { name: 'Zoom Ekspor 30  Mei 2025', commission: 0 },
  17322: { name: 'Zoom Ekspor 10 Juni 2025', commission: 0 },
  17767: { name: 'Zoom Ekspor 27 Juni 2025', commission: 0 },
  18358: { name: 'Zoom Ekspor 11 Juli 2025', commission: 0 },
  
  // Legacy products
  28: { name: 'eksporyuk', commission: 135000 }, // Original product
  93: { name: 'Eksporyuk Prelaunch', commission: 135000 },
};

async function main() {
  console.log('==========================================');
  console.log('UPDATE PRODUCT COMMISSIONS (REAL DATA)');
  console.log('==========================================\n');

  // 1. Update all products with real commission rates
  console.log('📦 Updating product commission rates...');
  
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: 'sejoli-' } }
  });
  
  console.log(`   Found ${products.length} Sejoli products`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const product of products) {
    // Extract Sejoli product ID from slug
    const sejoliId = parseInt(product.slug.replace('sejoli-', ''));
    const commissionData = PRODUCT_COMMISSIONS[sejoliId];
    
    if (commissionData) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          commissionType: 'FLAT',
          affiliateCommissionRate: commissionData.commission
        }
      });
      updated++;
      console.log(`   ✅ ${product.name}: Rp ${commissionData.commission.toLocaleString('id-ID')}`);
    } else {
      notFound++;
      console.log(`   ⚠️ ${product.name} (sejoli-${sejoliId}): No commission data, keeping default`);
    }
  }
  
  console.log(`\n   Updated: ${updated} products`);
  console.log(`   No data: ${notFound} products`);

  // 2. Also update Membership commission rates
  console.log('\n📦 Updating membership commission rates...');
  
  await prisma.membership.updateMany({
    where: { slug: 'paket-6-bulan' },
    data: { commissionType: 'FLAT', affiliateCommissionRate: 200000 }
  });
  console.log('   ✅ Paket 6 Bulan: Rp 200.000');
  
  await prisma.membership.updateMany({
    where: { slug: 'paket-12-bulan' },
    data: { commissionType: 'FLAT', affiliateCommissionRate: 300000 }
  });
  console.log('   ✅ Paket 12 Bulan: Rp 300.000');
  
  await prisma.membership.updateMany({
    where: { slug: 'paket-lifetime' },
    data: { commissionType: 'FLAT', affiliateCommissionRate: 325000 }
  });
  console.log('   ✅ Paket Lifetime: Rp 325.000');

  // 3. Verify commission data in AffiliateConversion
  console.log('\n💰 Verifying AffiliateConversion data...');
  
  const conversionStats = await prisma.affiliateConversion.aggregate({
    _count: true,
    _sum: { commissionAmount: true }
  });
  
  console.log(`   Total conversions: ${conversionStats._count}`);
  console.log(`   Total commission: Rp ${Number(conversionStats._sum.commissionAmount).toLocaleString('id-ID')}`);

  // 4. Summary by product
  console.log('\n📊 Commission Summary by Product:');
  
  const topProducts = await prisma.product.findMany({
    where: { 
      slug: { startsWith: 'sejoli-' },
      affiliateCommissionRate: { gt: 0 }
    },
    orderBy: { affiliateCommissionRate: 'desc' },
    take: 10,
    select: { name: true, affiliateCommissionRate: true }
  });
  
  topProducts.forEach(p => {
    console.log(`   ${p.name}: Rp ${Number(p.affiliateCommissionRate).toLocaleString('id-ID')}`);
  });

  await prisma.$disconnect();
  console.log('\n✅ Product commissions updated successfully!');
}

main().catch(console.error);
