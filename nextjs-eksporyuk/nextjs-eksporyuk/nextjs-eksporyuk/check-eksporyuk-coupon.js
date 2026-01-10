const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: 'EKSPORYUK' }
    });
    
    if (!coupon) {
      console.log('❌ EKSPORYUK coupon not found');
      return;
    }
    
    console.log('EKSPORYUK Coupon:');
    console.log('- ID:', coupon.id);
    console.log('- Active:', coupon.isActive);
    console.log('- Affiliate Enabled:', coupon.isAffiliateEnabled);
    console.log('- MembershipIds:', coupon.membershipIds);
    
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, checkoutSlug: true, status: true },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\nAll Memberships:');
    memberships.forEach(m => {
      const included = coupon.membershipIds && coupon.membershipIds.includes(m.id);
      console.log(`${included ? '✅' : '❌'} ${m.name} (${m.checkoutSlug}) - Status: ${m.status}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();
