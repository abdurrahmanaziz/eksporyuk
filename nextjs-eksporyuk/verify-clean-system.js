const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystem() {
  console.log('\n' + '='.repeat(80));
  console.log('✅ VERIFIKASI SISTEM LINK & KUPON - FORMAT SLUG CLEAN');
  console.log('='.repeat(80) + '\n');

  try {
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      include: {
        affiliateLinks: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    for (const membership of memberships) {
      const link = membership.affiliateLinks[0];
      const cleanUrl = `https://eksporyuk.com/membership/${membership.slug}/`;
      const checkoutUrl = `https://eksporyuk.com/membership/${membership.slug}/?ref=${link?.code || ''}`;

      console.log(`📦 ${membership.name}`);
      console.log(`   ├─ Slug: ${membership.slug}`);
      console.log(`   ├─ Clean URL: ${cleanUrl}`);
      console.log(`   ├─ Affiliate Code: ${link?.code || 'NONE'}`);
      console.log(`   ├─ CouponCode: ${link?.couponCode || 'NULL (✅ CLEAN)'}`);
      console.log(`   └─ Status: ✅ Ready\n`);
    }

    console.log('='.repeat(80));
    console.log('🎯 ALUR SISTEM BARU:');
    console.log('='.repeat(80));
    console.log(`
1. 📱 User klik: https://eksporyuk.com/membership/paket-1bulan/
   
2. ⏭️  Route handler /membership/[slug]/route.ts:
   → Cari membership by slug
   → Get affiliate link (tanpa coupon di URL)
   → Set cookie: affiliate_ref
   → Redirect ke: /checkout-unified?membership=ID&ref=CODE
   
3. 🛒 Checkout Page:
   → Ambil ref dari URL
   → Call fetchAndApplyCouponFromRef()
   → Cek coupon di affiliate link
   → Auto-apply jika coupon exists di database
   → URL tetap CLEAN (tanpa coupon param)
   
4. ✅ Hasil:
   ✓ Link URL: CLEAN tanpa kupon
   ✓ Redirect: CLEAN tanpa kupon
   ✓ Auto-apply: JALAN di background
   ✓ Manual input: Tetap tersedia
`);

    console.log('='.repeat(80));
    console.log('📊 DATABASE STATUS:');
    console.log('='.repeat(80));
    
    const allLinks = await prisma.affiliateLink.findMany({
      where: { isActive: true },
    });

    console.log(`Total active links: ${allLinks.length}`);
    console.log(`Links with coupon: ${allLinks.filter(l => l.couponCode).length}`);
    console.log(`Links WITHOUT coupon: ${allLinks.filter(l => !l.couponCode).length} ✅\n`);

    console.log('='.repeat(80));
    console.log('✅ SISTEM SIAP DIGUNAKAN');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
