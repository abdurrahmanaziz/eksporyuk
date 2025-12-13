const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== TESTING COUPON DISPLAY LOGIC ===\n');
    
    // 1. Get EKSPORYUK coupon
    const eksporyuk = await prisma.coupon.findUnique({
      where: { code: 'EKSPORYUK' }
    });
    
    console.log('1️⃣ EKSPORYUK Coupon:');
    console.log('   - ID:', eksporyuk.id);
    console.log('   - Active:', eksporyuk.isActive);
    console.log('   - Affiliate Enabled:', eksporyuk.isAffiliateEnabled);
    console.log('   - MembershipIds:', eksporyuk.membershipIds);
    console.log('');
    
    // 2. Get all memberships
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, checkoutSlug: true },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('2️⃣ All Memberships:');
    memberships.forEach(m => {
      const included = eksporyuk.membershipIds && eksporyuk.membershipIds.includes(m.id);
      console.log(`   ${included ? '✅' : '❌'} ${m.name} (${m.id})`);
    });
    console.log('');
    
    // 3. Simulate filter logic
    console.log('3️⃣ Filter Logic Simulation:');
    memberships.forEach(m => {
      const ids = eksporyuk.membershipIds || [];
      const shouldShow = ids.length === 0 || ids.includes(m.id);
      console.log(`   ${m.name}:`);
      console.log(`      - ids.length: ${ids.length}`);
      console.log(`      - ids.includes(${m.id}): ${ids.includes(m.id)}`);
      console.log(`      - Should show EKSPORYUK? ${shouldShow ? '✅ YES' : '❌ NO'}`);
    });
    console.log('');
    
    // 4. Get affiliate coupons (example with first user)
    const firstAffiliate = await prisma.user.findFirst({
      where: { 
        role: { in: ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER'] }
      }
    });
    
    if (firstAffiliate) {
      const affiliateCoupons = await prisma.coupon.findMany({
        where: { createdBy: firstAffiliate.id },
        select: { id: true, code: true, membershipIds: true, basedOnCouponId: true }
      });
      
      console.log('4️⃣ Affiliate Own Coupons:');
      console.log(`   User: ${firstAffiliate.name} (${firstAffiliate.role})`);
      console.log(`   Total coupons: ${affiliateCoupons.length}`);
      affiliateCoupons.forEach(c => {
        console.log(`   - ${c.code} (membershipIds: ${c.membershipIds?.length || 0}, parent: ${c.basedOnCouponId ? 'EKSPORYUK' : 'none'})`);
      });
      console.log('');
      
      // 5. Simulate API response
      const adminCoupons = await prisma.coupon.findMany({
        where: { isAffiliateEnabled: true, isActive: true }
      });
      
      const allCoupons = [...adminCoupons, ...affiliateCoupons];
      
      console.log('5️⃣ API Response Simulation (/api/affiliate/coupons/all):');
      console.log(`   Admin coupons (isAffiliateEnabled): ${adminCoupons.length}`);
      console.log(`   Affiliate own coupons: ${affiliateCoupons.length}`);
      console.log(`   Total coupons shown: ${allCoupons.length}`);
      console.log('');
      
      // 6. Test filter for each membership
      console.log('6️⃣ Filter Test for Each Membership:');
      memberships.forEach(m => {
        const applicable = allCoupons.filter(coupon => {
          const ids = coupon.membershipIds || [];
          return ids.length === 0 || ids.includes(m.id);
        });
        console.log(`   ${m.name}:`);
        console.log(`      - Applicable coupons: ${applicable.length}`);
        applicable.forEach(c => {
          console.log(`         ✅ ${c.code}`);
        });
      });
    }
    
    console.log('\n✅ All tests completed!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
})();
