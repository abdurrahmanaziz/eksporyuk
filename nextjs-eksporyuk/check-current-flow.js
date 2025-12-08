const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentFlow() {
  console.log('='.repeat(80));
  console.log('🔍 CEK ALUR SISTEM LINK & KUPON SAAT INI');
  console.log('='.repeat(80));

  try {
    // 1. CEK DATABASE - Affiliate Links
    console.log('\n📊 STEP 1: DATABASE - AFFILIATE LINKS');
    console.log('-'.repeat(80));
    const links = await prisma.affiliateLink.findMany({
      where: { isActive: true, isArchived: false },
      include: {
        membership: {
          select: { id: true, name: true, slug: true }
        }
      },
      take: 3
    });

    links.forEach(link => {
      console.log(`\n🔗 Link Code: ${link.code}`);
      console.log(`   Short Code: ${link.shortCode || 'TIDAK ADA'}`);
      console.log(`   Membership: ${link.membership?.name || 'TIDAK ADA'}`);
      console.log(`   Slug: ${link.membership?.slug || 'TIDAK ADA'}`);
      console.log(`   ⚠️  CouponCode di DB: ${link.couponCode || 'NULL (TIDAK ADA)'}`);
    });

    // 2. CEK DATABASE - Coupons
    console.log('\n\n📊 STEP 2: DATABASE - COUPONS (YANG SUDAH GENERATE)');
    console.log('-'.repeat(80));
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true },
      take: 5
    });

    if (coupons.length === 0) {
      console.log('❌ TIDAK ADA KUPON YANG DI-GENERATE DI DATABASE');
    } else {
      coupons.forEach(coupon => {
        console.log(`\n💳 Coupon: ${coupon.code}`);
        console.log(`   Type: ${coupon.type}`);
        console.log(`   Discount: ${coupon.discount}${coupon.type === 'percentage' ? '%' : ''}`);
        console.log(`   IsActive: ${coupon.isActive}`);
      });
    }

    // 3. SIMULASI ALUR
    console.log('\n\n🎯 STEP 3: SIMULASI ALUR LINK & KUPON');
    console.log('='.repeat(80));

    const testLink = links[0];
    if (testLink) {
      console.log(`\n📌 TEST CASE: Link ${testLink.shortCode}`);
      console.log('-'.repeat(80));

      // Step 3a: User klik link
      console.log('\n[USER ACTION] User klik: http://localhost:3000/go/' + testLink.shortCode + '/checkout');
      
      // Step 3b: Route handler redirect
      console.log('\n[ROUTE HANDLER] /go/[shortCode]/[[...slug]]/route.ts');
      console.log('   → Cari affiliate link di DB by shortCode');
      console.log('   → Track click (increment counter)');
      console.log('   → Set cookie: affiliate_ref = ' + testLink.code);
      console.log('   → ❌ TIDAK set cookie affiliate_coupon (sudah dihapus)');
      const redirectUrl = `/checkout-unified?ref=${testLink.code}&package=${testLink.membership?.slug || testLink.membershipId}`;
      console.log('   → Redirect ke: ' + redirectUrl);

      // Step 3c: Checkout page load
      console.log('\n[CHECKOUT PAGE] /checkout-unified/page.tsx - useEffect()');
      console.log('   → Ambil ref dari URL: ' + testLink.code);
      console.log('   → Set affiliateRef state = ' + testLink.code);
      
      // Step 3d: Auto-apply coupon logic
      console.log('\n[AUTO-APPLY LOGIC] fetchAndApplyCouponFromRef()');
      console.log('   → Fetch affiliate link via API: /api/affiliate/by-code?code=' + testLink.code);
      console.log('   → Cek field couponCode di affiliate link');
      console.log('   → CouponCode di DB: ' + (testLink.couponCode || 'NULL'));
      
      if (testLink.couponCode) {
        console.log('   → ✅ Ada couponCode: ' + testLink.couponCode);
        console.log('   → Validate via API: /api/coupons/validate?code=' + testLink.couponCode);
        
        const couponExists = coupons.find(c => c.code === testLink.couponCode);
        if (couponExists) {
          console.log('   → ✅ Coupon VALID - Ada di table Coupon');
          console.log('   → Auto-apply coupon ke checkout');
        } else {
          console.log('   → ❌ Coupon TIDAK VALID - Tidak ada di table Coupon');
          console.log('   → TIDAK auto-apply (SOP: Hanya apply jika sudah generate)');
        }
      } else {
        console.log('   → ❌ TIDAK ada couponCode (NULL)');
        console.log('   → TIDAK auto-apply coupon');
      }

      // Step 3e: Manual input
      console.log('\n[MANUAL INPUT] User bisa input kupon manual');
      console.log('   → Ada form input di checkout page');
      console.log('   → User ketik kode kupon');
      console.log('   → Click "Apply Coupon"');
      console.log('   → Validate via API: /api/coupons/validate');
      console.log('   → Jika valid → Apply discount');
    }

    // 4. KESIMPULAN
    console.log('\n\n📋 STEP 4: KESIMPULAN ALUR SAAT INI');
    console.log('='.repeat(80));
    
    const hasAnyLinkWithCoupon = links.some(l => l.couponCode !== null);
    
    console.log('\n✅ YANG SUDAH BENAR:');
    console.log('   1. Short link system (44% lebih pendek)');
    console.log('   2. Slug system (paket-1bulan, paket-6bulan, dll)');
    console.log('   3. Cookie affiliate_coupon SUDAH DIHAPUS');
    console.log('   4. Tracking via ref parameter');
    console.log('   5. Manual coupon input tersedia');

    console.log('\n⚠️  STATUS KUPON AUTO-APPLY:');
    if (!hasAnyLinkWithCoupon) {
      console.log('   ✅ SEMUA link couponCode = NULL');
      console.log('   ✅ TIDAK ADA kupon yang auto-apply');
      console.log('   ✅ SESUAI permintaan: Bersih tanpa kupon');
    } else {
      console.log('   ⚠️  Ada ' + links.filter(l => l.couponCode).length + ' link dengan couponCode');
      console.log('   ⚠️  Link ini AKAN auto-apply jika kupon ada di table Coupon');
    }

    console.log('\n🎯 FUNGSI AUTO-APPLY:');
    console.log('   ✅ Fungsi fetchAndApplyCouponFromRef() ADA');
    console.log('   ✅ Fungsi applyCouponAutomatically() ADA');
    console.log('   📌 Logic: IF link.couponCode != NULL AND coupon exists → auto-apply');
    console.log('   📌 Sekarang: Semua link.couponCode = NULL → TIDAK auto-apply');

    console.log('\n🔐 SOP KUPON:');
    console.log('   1. Affiliate link punya field couponCode (bisa NULL)');
    console.log('   2. Jika couponCode != NULL → cek di table Coupon');
    console.log('   3. Jika kupon exist di table Coupon → auto-apply');
    console.log('   4. Jika couponCode = NULL → TIDAK auto-apply');
    console.log('   5. User tetap bisa input manual');

    console.log('\n💡 CARA KERJA SEKARANG:');
    console.log('   Link: /go/3BEC0Z/checkout');
    console.log('   → Redirect ke: /checkout-unified?ref=TEST5ENIFJ&package=paket-1bulan');
    console.log('   → Cek couponCode di link (saat ini NULL)');
    console.log('   → TIDAK ada auto-apply');
    console.log('   → User bisa input kupon manual jika mau');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ SELESAI CEK ALUR');
  console.log('='.repeat(80) + '\n');
}

checkCurrentFlow();
