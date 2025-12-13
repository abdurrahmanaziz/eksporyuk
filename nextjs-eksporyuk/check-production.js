const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

(async () => {
  try {
    console.log('🔍 Checking PRODUCTION database...\n');
    
    // Get all coupons
    const allCoupons = await prisma.coupon.findMany({
      select: { 
        id: true, 
        code: true, 
        membershipIds: true, 
        isAffiliateEnabled: true,
        createdBy: true 
      }
    });
    
    console.log('📋 All Coupons in DB:', allCoupons.length);
    allCoupons.forEach(c => {
      console.log(`   - ${c.code}:`);
      console.log(`     membershipIds: ${JSON.stringify(c.membershipIds)}`);
      console.log(`     isAffiliateEnabled: ${c.isAffiliateEnabled}`);
      console.log(`     createdBy: ${c.createdBy || 'admin'}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
})();
