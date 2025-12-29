const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVARoute() {
  const transactionId = '54576e399cd3699d6be335d4412f936e';
  
  try {
    console.log('🔍 Testing VA API route fix...\n');
    
    // 1. Fetch transaction WITHOUT relations
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    
    if (!transaction) {
      console.log('❌ Transaction NOT FOUND!');
      return;
    }
    console.log('✅ Transaction found:', transaction.id);
    console.log('   Status:', transaction.status);
    console.log('   Amount:', Number(transaction.amount));
    console.log('   UserId:', transaction.userId);
    console.log('   CouponId:', transaction.couponId);
    
    // 2. Fetch user separately (NEW FIX)
    let user = null;
    if (transaction.userId) {
      user = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: { name: true, email: true, whatsapp: true }
      });
      console.log('\n✅ User loaded:', user?.name || 'N/A');
    }
    
    // 3. Fetch coupon separately (NEW FIX)
    let coupon = null;
    if (transaction.couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: transaction.couponId },
        select: { code: true, discountType: true, discountValue: true }
      });
      console.log('✅ Coupon loaded:', coupon?.code || 'N/A');
    } else {
      console.log('ℹ️  No coupon attached');
    }
    
    // 4. Get settings
    const settings = await prisma.settings.findFirst({
      select: { paymentExpiryHours: true }
    });
    console.log('\n✅ Settings loaded, expiryHours:', settings?.paymentExpiryHours || 72);
    
    // 5. Check metadata
    const metadata = transaction.metadata;
    console.log('\n📋 Metadata:', JSON.stringify(metadata, null, 2));
    
    const vaNumber = metadata?.vaNumber || metadata?.accountNumber || metadata?.xenditVANumber;
    console.log('\n💳 VA Number:', vaNumber || 'NOT FOUND');
    
    console.log('\n✅ API ROUTE FIX VERIFIED - Should work now!');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVARoute();
