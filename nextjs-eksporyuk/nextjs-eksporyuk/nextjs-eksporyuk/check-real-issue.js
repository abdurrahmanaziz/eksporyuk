const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: { contains: 'aziz' } },
          { username: { contains: 'aziz' } }
        ]
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User:', user.name, '(' + user.email + ')');
    
    const affiliateCoupons = await prisma.coupon.findMany({
      where: { createdBy: user.id }
    });
    
    console.log('\n📋 Affiliate Own Coupons:', affiliateCoupons.length);
    affiliateCoupons.forEach(c => {
      console.log('   -', c.code, '- membershipIds:', c.membershipIds?.length || 0);
    });
    
    const adminCoupons = await prisma.coupon.findMany({
      where: { isAffiliateEnabled: true, isActive: true }
    });
    
    console.log('\n🏢 Admin Coupons:', adminCoupons.length);
    adminCoupons.forEach(c => {
      console.log('   -', c.code);
    });
    
    console.log('\n🔄 Total should show:', adminCoupons.length + affiliateCoupons.length);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();
