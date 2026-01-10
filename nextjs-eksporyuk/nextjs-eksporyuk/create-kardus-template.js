const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createKARDUSTemplate() {
  try {
    console.log('🔍 Creating KARDUS coupon template...\n')
    
    // Check if KARDUS template already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: 'KARDUS' }
    })
    
    if (existing) {
      console.log('✅ KARDUS template already exists:')
      console.log(`   ID: ${existing.id}`)
      console.log(`   Code: ${existing.code}`)
      console.log(`   Discount: ${existing.discountValue}${existing.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`)
      console.log(`   Affiliate Enabled: ${existing.isAffiliateEnabled}`)
      console.log(`   BasedOn: ${existing.basedOnCouponId || 'TEMPLATE'}\n`)
      return
    }
    
    // Create KARDUS template
    const template = await prisma.coupon.create({
      data: {
        id: `coupon-kardus-${Date.now()}`,
        code: 'KARDUS',
        description: 'Kupon diskon khusus KARDUS untuk affiliate',
        discountType: 'PERCENTAGE',
        discountValue: 25, // 25% discount
        isActive: true,
        isAffiliateEnabled: true,
        basedOnCouponId: null, // This is a template
        createdBy: 'admin',
        maxGeneratePerAffiliate: 100, // Each affiliate can generate up to 100 codes
      }
    })
    
    console.log('✅ KARDUS template created successfully!')
    console.log(`   ID: ${template.id}`)
    console.log(`   Code: ${template.code}`)
    console.log(`   Discount: ${template.discountValue}% OFF`)
    console.log(`   Affiliate Enabled: ${template.isAffiliateEnabled}`)
    console.log(`   Max Generate Per Affiliate: ${template.maxGeneratePerAffiliate}\n`)
    
    // Now test generating a coupon from this template
    console.log('�� Now generating a coupon from KARDUS template...\n')
    
    const newCode = `KARDUS-${Date.now().toString().slice(-6)}-AZ`
    
    const newCoupon = await prisma.coupon.create({
      data: {
        id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        code: newCode,
        description: `Generated from KARDUS template for azizbiasa@gmail.com`,
        discountType: template.discountType,
        discountValue: template.discountValue,
        isActive: true,
        basedOnCouponId: template.id, // Reference the template
        createdBy: 'azizbiasa@gmail.com',
      }
    })
    
    console.log('✅ Generated coupon created successfully!')
    console.log(`   ID: ${newCoupon.id}`)
    console.log(`   Code: ${newCoupon.code}`)
    console.log(`   Discount: ${newCoupon.discountValue}%`)
    console.log(`   Based On: KARDUS template`)
    console.log(`   Created By: azizbiasa@gmail.com`)
    console.log(`   CreatedAt: ${newCoupon.createdAt}`)
    console.log(`   UpdatedAt: ${newCoupon.updatedAt}\n`)
    
    // Verify both exist
    console.log('🔍 Verifying in database...\n')
    
    const templates = await prisma.coupon.findMany({
      where: { basedOnCouponId: null, code: 'KARDUS' }
    })
    console.log(`✅ Templates found: ${templates.length}`)
    
    const generated = await prisma.coupon.findMany({
      where: { basedOnCouponId: { not: null }, code: { startsWith: 'KARDUS-' } }
    })
    console.log(`✅ Generated coupons from KARDUS: ${generated.length}`)
    
    if (generated.length > 0) {
      console.log(`   Latest: ${generated[0].code}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.meta) console.error('Details:', error.meta)
  } finally {
    await prisma.$disconnect()
  }
}

createKARDUSTemplate()
