const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyProCheckout() {
  console.log('🔍 VERIFYING /checkout/pro SETUP\n');
  console.log('='.repeat(60));

  try {
    // 1. Check Pro membership
    console.log('\n1️⃣ Checking Pro Membership (General Checkout)...\n');
    
    const proMembership = await prisma.membership.findUnique({
      where: { slug: 'pro' }
    });

    if (!proMembership) {
      console.log('❌ Pro membership NOT FOUND!');
      return;
    }

    console.log('✅ Pro Membership Found:');
    console.log(`   - ID: ${proMembership.id}`);
    console.log(`   - Name: ${proMembership.name}`);
    console.log(`   - Slug: ${proMembership.slug}`);
    console.log(`   - Active: ${proMembership.isActive}`);
    
    const proFeatures = Array.isArray(proMembership.features) ? proMembership.features : [];
    console.log(`   - Features: ${proFeatures.length === 0 ? '[] (GENERAL CHECKOUT ✅)' : proFeatures.length + ' items'}`);
    console.log(`   - Show in general: ${proMembership.showInGeneralCheckout}`);

    if (proFeatures.length !== 0) {
      console.log('\n⚠️  WARNING: Pro should have EMPTY features array for general checkout!');
    }

    // 2. Check individual packages
    console.log('\n2️⃣ Checking Individual Packages...\n');
    
    const packages = await prisma.membership.findMany({
      where: {
        isActive: true,
        showInGeneralCheckout: true,
        slug: { not: 'pro' }
      },
      orderBy: { price: 'asc' }
    });

    console.log(`Found ${packages.length} active packages for checkout:\n`);

    for (const pkg of packages) {
      const features = Array.isArray(pkg.features) ? pkg.features : [];
      const badges = [];
      
      if (pkg.isBestSeller) badges.push('🔥');
      if (pkg.isMostPopular) badges.push('⭐');
      if (pkg.isPopular) badges.push('✨');

      console.log(`${badges.join(' ')} ${pkg.name}`);
      console.log(`   - Slug: ${pkg.slug}`);
      console.log(`   - CheckoutSlug: ${pkg.checkoutSlug || 'N/A'}`);
      console.log(`   - Price: Rp ${Number(pkg.price).toLocaleString('id-ID')}`);
      console.log(`   - Original: Rp ${Number(pkg.originalPrice || pkg.price).toLocaleString('id-ID')}`);
      console.log(`   - Discount: ${pkg.discount}%`);
      console.log(`   - Duration: ${pkg.duration}`);
      console.log(`   - Features: ${features.length} items`);
      console.log(`   - Active: ${pkg.isActive}`);
      console.log(`   - Show in checkout: ${pkg.showInGeneralCheckout}`);
      console.log('');
    }

    // 3. Summary
    console.log('='.repeat(60));
    console.log('\n📊 SUMMARY:\n');
    console.log(`✅ Pro membership: ${proMembership ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`✅ General checkout: ${proFeatures.length === 0 ? 'ENABLED' : 'DISABLED'}`);
    console.log(`✅ Individual packages: ${packages.length} available`);
    console.log(`✅ Active memberships: ${packages.filter(p => p.isActive).length}`);
    console.log(`✅ Show in general: ${packages.filter(p => p.showInGeneralCheckout).length}`);

    console.log('\n🎯 TEST URLs:\n');
    console.log('   General Checkout:');
    console.log('   → http://localhost:3000/checkout/pro\n');
    console.log('   Membership List:');
    console.log('   → http://localhost:3000/membership\n');
    console.log('   Individual Checkouts:');
    for (const pkg of packages.slice(0, 4)) {
      console.log(`   → http://localhost:3000/checkout/${pkg.slug}`);
    }

    console.log('\n✅ VERIFICATION COMPLETE!\n');
    console.log('='.repeat(60));

    // 4. Check API simulation
    console.log('\n4️⃣ Simulating API Response for /checkout/pro...\n');
    
    const allMembershipsForPro = await prisma.membership.findMany({
      where: {
        isActive: true,
        slug: { not: 'pro' }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        price: true,
        originalPrice: true,
        discount: true,
        duration: true,
        features: true,
        isBestSeller: true,
        isPopular: true,
        isMostPopular: true
      },
      orderBy: [
        { isMostPopular: 'desc' },
        { isPopular: 'desc' },
        { price: 'asc' }
      ]
    });

    console.log('Price Options that will be returned by API:\n');
    
    const priceOptions = allMembershipsForPro.map(m => {
      const basePrice = Number(m.price);
      const originalPrice = Number(m.originalPrice || m.price);
      
      let membershipBenefits = [];
      try {
        let membershipFeatures = m.features;
        if (typeof membershipFeatures === 'string') {
          membershipFeatures = JSON.parse(membershipFeatures);
        }
        if (Array.isArray(membershipFeatures)) {
          if (membershipFeatures.length > 0 && typeof membershipFeatures[0] === 'string') {
            membershipBenefits = membershipFeatures;
          }
        }
      } catch (e) {
        // ignore
      }
      
      return {
        duration: m.duration,
        label: m.name,
        price: basePrice,
        originalPrice: originalPrice,
        discount: m.discount,
        benefits: membershipBenefits.slice(0, 3), // Show first 3
        membershipId: m.id,
        membershipSlug: m.checkoutSlug || m.slug,
        isPopular: m.isPopular || m.isMostPopular || m.isBestSeller
      };
    });

    priceOptions.forEach((opt, idx) => {
      console.log(`${idx + 1}. ${opt.label}`);
      console.log(`   - membershipId: ${opt.membershipId.substring(0, 20)}...`);
      console.log(`   - membershipSlug: ${opt.membershipSlug}`);
      console.log(`   - price: ${opt.price}`);
      console.log(`   - benefits: ${opt.benefits.length} items`);
      console.log(`   - isPopular: ${opt.isPopular}`);
      console.log('');
    });

    console.log(`✅ API will return ${priceOptions.length} price options\n`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyProCheckout()
  .then(() => {
    console.log('\n✨ Verification completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
