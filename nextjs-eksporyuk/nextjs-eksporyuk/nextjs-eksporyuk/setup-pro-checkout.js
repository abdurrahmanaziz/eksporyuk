const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupProCheckout() {
  console.log('🚀 Setting up /checkout/pro...\n');

  try {
    // 1. Buat atau update paket "Pro" sebagai general checkout
    console.log('1️⃣ Creating/Updating Pro membership (General Checkout)...');
    
    const proMembership = await prisma.membership.upsert({
      where: { slug: 'pro' },
      update: {
        name: 'Paket Pro',
        description: 'Pilih paket membership yang sesuai dengan kebutuhan Anda',
        features: [], // ✅ EMPTY ARRAY = General Checkout
        duration: 'LIFETIME',
        price: 0,
        originalPrice: 0,
        discount: 0,
        affiliateCommissionRate: 30,
        isActive: true,
        isBestSeller: false,
        isPopular: false,
        isMostPopular: false,
        showInGeneralCheckout: false, // Pro itself tidak muncul di listing
        checkoutSlug: 'pro',
        checkoutTemplate: 'modern',
        formLogo: null,
        formBanner: null,
      },
      create: {
        name: 'Paket Pro',
        slug: 'pro',
        checkoutSlug: 'pro',
        checkoutTemplate: 'modern',
        description: 'Pilih paket membership yang sesuai dengan kebutuhan Anda',
        features: [], // ✅ EMPTY ARRAY = General Checkout
        duration: 'LIFETIME',
        price: 0,
        originalPrice: 0,
        discount: 0,
        affiliateCommissionRate: 30,
        isActive: true,
        isBestSeller: false,
        isPopular: false,
        isMostPopular: false,
        showInGeneralCheckout: false,
        formLogo: null,
        formBanner: null,
      },
    });

    console.log('✅ Pro membership created:', proMembership.id);
    console.log('   - Slug: pro');
    console.log('   - Features: [] (empty = general checkout)');
    console.log('   - Active:', proMembership.isActive);
    console.log('');

    // 2. Buat paket-paket individual yang akan muncul di checkout/pro
    console.log('2️⃣ Creating individual membership packages...\n');

    const packages = [
      {
        name: 'Paket 1 Bulan',
        slug: 'paket-1-bulan',
        checkoutSlug: '1-month',
        description: 'Akses penuh selama 1 bulan',
        duration: 'ONE_MONTH',
        price: 100000,
        originalPrice: 150000,
        discount: 33,
        features: [
          'Akses semua kelas dan materi',
          'Grup WhatsApp eksklusif',
          'Update materi terbaru',
          'Sertifikat digital',
          'Konsultasi dengan mentor'
        ],
        isBestSeller: false,
        isPopular: true,
        isMostPopular: false,
        showInGeneralCheckout: true,
      },
      {
        name: 'Paket 3 Bulan',
        slug: 'paket-3-bulan',
        checkoutSlug: '3-months',
        description: 'Akses penuh selama 3 bulan',
        duration: 'THREE_MONTHS',
        price: 250000,
        originalPrice: 400000,
        discount: 38,
        features: [
          'Semua benefit paket 1 bulan',
          'Akses bonus materi eksklusif',
          'Priority support',
          'Webinar bulanan gratis',
          '1x konsultasi private'
        ],
        isBestSeller: true,
        isPopular: true,
        isMostPopular: true,
        showInGeneralCheckout: true,
      },
      {
        name: 'Paket 6 Bulan',
        slug: 'paket-6-bulan',
        checkoutSlug: '6-months',
        description: 'Akses penuh selama 6 bulan',
        duration: 'SIX_MONTHS',
        price: 450000,
        originalPrice: 750000,
        discount: 40,
        features: [
          'Semua benefit paket 3 bulan',
          'Akses semua template premium',
          'VIP support 24/7',
          '3x konsultasi private',
          'Bonus ebook eksklusif'
        ],
        isBestSeller: false,
        isPopular: true,
        isMostPopular: false,
        showInGeneralCheckout: true,
      },
      {
        name: 'Paket Lifetime',
        slug: 'paket-lifetime',
        checkoutSlug: 'lifetime',
        description: 'Akses selamanya tanpa batas waktu',
        duration: 'LIFETIME',
        price: 997000,
        originalPrice: 2000000,
        discount: 50,
        features: [
          'Semua benefit paket 6 bulan',
          'Akses LIFETIME tanpa perpanjangan',
          'Update materi selamanya',
          'Konsultasi unlimited',
          'Bonus semua produk baru',
          'Join komunitas VIP eksklusif'
        ],
        isBestSeller: false,
        isPopular: false,
        isMostPopular: false,
        showInGeneralCheckout: true,
      },
    ];

    for (const pkg of packages) {
      const membership = await prisma.membership.upsert({
        where: { slug: pkg.slug },
        update: {
          name: pkg.name,
          description: pkg.description,
          features: pkg.features,
          duration: pkg.duration,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          discount: pkg.discount,
          affiliateCommissionRate: 30,
          isActive: true,
          isBestSeller: pkg.isBestSeller,
          isPopular: pkg.isPopular,
          isMostPopular: pkg.isMostPopular,
          showInGeneralCheckout: pkg.showInGeneralCheckout,
          checkoutSlug: pkg.checkoutSlug,
          checkoutTemplate: 'modern',
        },
        create: {
          name: pkg.name,
          slug: pkg.slug,
          checkoutSlug: pkg.checkoutSlug,
          checkoutTemplate: 'modern',
          description: pkg.description,
          features: pkg.features,
          duration: pkg.duration,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          discount: pkg.discount,
          affiliateCommissionRate: 30,
          isActive: true,
          isBestSeller: pkg.isBestSeller,
          isPopular: pkg.isPopular,
          isMostPopular: pkg.isMostPopular,
          showInGeneralCheckout: pkg.showInGeneralCheckout,
        },
      });

      const badges = [];
      if (membership.isBestSeller) badges.push('🔥 Best Seller');
      if (membership.isMostPopular) badges.push('⭐ Most Popular');
      if (membership.isPopular) badges.push('✨ Popular');

      console.log(`✅ ${membership.name}`);
      console.log(`   - Slug: ${membership.slug}`);
      console.log(`   - Price: Rp ${membership.price.toLocaleString('id-ID')}`);
      console.log(`   - Discount: ${membership.discount}%`);
      console.log(`   - Duration: ${membership.duration}`);
      console.log(`   - Badges: ${badges.join(', ') || 'None'}`);
      console.log(`   - Show in checkout: ${membership.showInGeneralCheckout}`);
      console.log('');
    }

    // 3. Verify setup
    console.log('3️⃣ Verifying setup...\n');

    const allMemberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        features: true,
        showInGeneralCheckout: true,
        isActive: true,
      },
    });

    console.log('📊 Active Memberships:');
    for (const m of allMemberships) {
      const featuresCount = Array.isArray(m.features) ? m.features.length : 0;
      const isGeneralCheckout = featuresCount === 0;
      
      console.log(`   - ${m.name} (${m.slug})`);
      console.log(`     Features: ${isGeneralCheckout ? '[] (GENERAL CHECKOUT)' : featuresCount + ' items'}`);
      console.log(`     Show in general: ${m.showInGeneralCheckout}`);
    }

    console.log('\n✅ Setup completed successfully!\n');
    console.log('🎯 Test URLs:');
    console.log('   - General Checkout: http://localhost:3001/checkout/pro');
    console.log('   - Membership List: http://localhost:3001/membership');
    console.log('   - Individual: http://localhost:3001/checkout/paket-1-bulan');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up pro checkout:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupProCheckout()
  .then(() => {
    console.log('✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
