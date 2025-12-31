/**
 * Test coupon generation logic directly with Prisma
 * Bypasses API layer to isolate issue
 */

const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

async function testLocalCouponGeneration() {
  console.log('\n🚀 Testing Coupon Generation (Local Prisma)...\n');
  
  try {
    // Check if template exists
    const template = await prisma.coupon.findUnique({
      where: { id: '4aa8da9681fe25fe637d44e1a46a7145' }
    });
    
    if (!template) {
      console.log('❌ Template not found');
      return;
    }
    
    console.log('✅ Template found:', template.code);
    console.log('  - Discount Value (type):', typeof template.discountValue, template.discountValue);
    console.log('  - Min Purchase (type):', typeof template.minPurchase, template.minPurchase);
    console.log('  - Is Active:', template.isActive);
    console.log('  - Is Affiliate Enabled:', template.isAffiliateEnabled);
    
    // Try to create coupon
    const customCode = 'TESTLOCAL' + Math.random().toString(36).substring(7);
    console.log(`\n📋 Creating coupon with code: ${customCode}`);
    
    const newCoupon = await prisma.coupon.create({
      data: {
        id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        code: customCode.toUpperCase(),
        description: `Kupon diskon ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'}`,
        discountType: template.discountType,
        discountValue: new Decimal(String(template.discountValue)),
        usageLimit: template.maxUsagePerCoupon || null,
        usageCount: 0,
        validUntil: template.validUntil || null,
        expiresAt: template.expiresAt || null,
        isActive: true,
        minPurchase: template.minPurchase ? new Decimal(String(template.minPurchase)) : null,
        productIds: template.productIds || null,
        membershipIds: template.membershipIds || null,
        courseIds: template.courseIds || null,
        isAffiliateEnabled: false,
        basedOnCouponId: template.id,
        createdBy: 'cmjmtotzh001eitz0kq029lk5', // User azizbiasa@gmail.com
      }
    });
    
    console.log('\n✅ Coupon created successfully!');
    console.log('  - ID:', newCoupon.id);
    console.log('  - Code:', newCoupon.code);
    console.log('  - Discount Value:', newCoupon.discountValue.toString());
    console.log('  - Min Purchase:', newCoupon.minPurchase?.toString() || null);
    
    // Test response serialization
    console.log('\n📦 Testing JSON serialization...');
    const response = {
      id: newCoupon.id,
      code: newCoupon.code,
      description: newCoupon.description,
      discountType: newCoupon.discountType,
      discountValue: newCoupon.discountValue.toString(),
      usageLimit: newCoupon.usageLimit,
      usageCount: newCoupon.usageCount,
      validUntil: newCoupon.validUntil?.toISOString() || null,
      expiresAt: newCoupon.expiresAt?.toISOString() || null,
      isActive: newCoupon.isActive,
      minPurchase: newCoupon.minPurchase?.toString() || null,
      validFrom: newCoupon.validFrom?.toISOString() || null,
      productIds: newCoupon.productIds,
      membershipIds: newCoupon.membershipIds,
      courseIds: newCoupon.courseIds,
      isAffiliateEnabled: newCoupon.isAffiliateEnabled,
      isForRenewal: newCoupon.isForRenewal,
      maxGeneratePerAffiliate: newCoupon.maxGeneratePerAffiliate,
      maxUsagePerCoupon: newCoupon.maxUsagePerCoupon,
      basedOnCouponId: newCoupon.basedOnCouponId,
      createdBy: newCoupon.createdBy,
      createdAt: newCoupon.createdAt.toISOString(),
      updatedAt: newCoupon.updatedAt.toISOString(),
      affiliateId: newCoupon.affiliateId,
      generatedBy: newCoupon.generatedBy,
    };
    
    const serialized = JSON.stringify(response);
    console.log('✅ Serialization successful! Length:', serialized.length);
    console.log('\n📄 Response object:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalCouponGeneration();
