const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyIntegration() {
  console.log('=== VERIFIKASI INTEGRASI LENGKAP MEMBERSHIP ===\n');
  
  const memberships = await prisma.membership.findMany({
    orderBy: { price: 'desc' }
  });
  
  console.log('1️⃣ DATABASE STATUS:\n');
  memberships.forEach((m, i) => {
    console.log(`${i+1}. ${m.name}`);
    console.log(`   ✅ isActive: ${m.isActive}`);
    console.log(`   ✅ status: ${m.status}`);
    console.log(`   ✅ slug: ${m.slug}`);
    console.log(`   ✅ checkoutSlug: ${m.checkoutSlug || 'NOT SET'}`);
    console.log(`   ✅ showInGeneralCheckout: ${m.showInGeneralCheckout}`);
    console.log('');
  });
  
  console.log('2️⃣ KUPON AFFILIATE (EKSPORYUK):\n');
  const coupon = await prisma.coupon.findFirst({
    where: { 
      code: 'EKSPORYUK',
      isAffiliateEnabled: true 
    }
  });
  
  if (coupon) {
    console.log(`✅ Kupon: ${coupon.code}`);
    console.log(`✅ isActive: ${coupon.isActive}`);
    console.log(`✅ isAffiliateEnabled: ${coupon.isAffiliateEnabled}`);
    console.log(`✅ Discount: ${coupon.discountType} ${coupon.discountValue}%`);
    console.log(`✅ Total membership terhubung: ${coupon.membershipIds?.length || 0}`);
    console.log('');
    
    if (coupon.membershipIds) {
      console.log('   Berlaku untuk:');
      coupon.membershipIds.forEach(id => {
        const m = memberships.find(mem => mem.id === id);
        if (m) {
          console.log(`   ✅ ${m.name} (${m.isActive ? 'AKTIF' : 'NONAKTIF'})`);
        }
      });
    }
  } else {
    console.log('❌ Kupon EKSPORYUK tidak ditemukan!');
  }
  
  console.log('\n3️⃣ MISSING INTEGRATIONS:\n');
  
  const missingCheckoutSlug = memberships.filter(m => !m.checkoutSlug);
  if (missingCheckoutSlug.length > 0) {
    console.log('⚠️ Membership tanpa checkoutSlug:');
    missingCheckoutSlug.forEach(m => console.log(`   - ${m.name}`));
  } else {
    console.log('✅ Semua membership punya checkoutSlug');
  }
  
  const notInCoupon = memberships.filter(m => 
    m.isActive && !coupon?.membershipIds?.includes(m.id)
  );
  if (notInCoupon.length > 0) {
    console.log('\n⚠️ Membership aktif TIDAK ada di kupon:');
    notInCoupon.forEach(m => console.log(`   - ${m.name}`));
  } else {
    console.log('\n✅ Semua membership aktif ada di kupon EKSPORYUK');
  }
  
  console.log('\n4️⃣ SUMMARY:\n');
  console.log(`✅ Total membership: ${memberships.length}`);
  console.log(`✅ Membership aktif: ${memberships.filter(m => m.isActive).length}`);
  console.log(`✅ Membership di kupon: ${coupon?.membershipIds?.length || 0}`);
  console.log(`✅ Status: ${notInCoupon.length === 0 && missingCheckoutSlug.length === 0 ? 'FULLY INTEGRATED ✨' : 'NEEDS FIX ⚠️'}`);
  
  await prisma.$disconnect();
}

verifyIntegration();
