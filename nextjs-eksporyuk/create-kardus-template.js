const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

async function createKardusTemplate() {
  try {
    console.log('📝 Creating KARDUS template...\n')
    
    // Check if KARDUS already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: 'KARDUS' }
    })
    
    if (existing) {
      console.log('⚠️  KARDUS template already exists')
      console.log(`   ID: ${existing.id}`)
      console.log(`   Discount: ${existing.discountValue}${existing.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`)
      console.log(`   Affiliate Enabled: ${existing.isAffiliateEnabled}`)
      return
    }
    
    // Create KARDUS template
    const kardusTemplate = await prisma.coupon.create({
      data: {
        id: `kardus-template-${Date.now()}`,
        code: 'KARDUS',
        description: 'Kupon diskon khusus untuk packaging/kardus',
        discountType: 'PERCENTAGE',
        discountValue: new Prisma.Decimal('25'), // 25% discount
        isActive: true,
        isAffiliateEnabled: true, // Allow affiliates to generate from this
        usageLimit: null, // No limit
        minPurchase: null,
        basedOnCouponId: null, // This is a template
      }
    })
    
    console.log('✅ KARDUS template created successfully!')
    console.log(`   ID: ${kardusTemplate.id}`)
    console.log(`   Code: ${kardusTemplate.code}`)
    console.log(`   Discount: ${kardusTemplate.discountValue}% OFF`)
    console.log(`   Affiliate Enabled: ${kardusTemplate.isAffiliateEnabled}`)
    console.log(`   CreatedAt: ${kardusTemplate.createdAt}\n`)
    
    // Verify it
    const verify = await prisma.coupon.findUnique({
      where: { code: 'KARDUS' }
    })
    
    if (verify) {
      console.log('✅ Verification: KARDUS template exists in database!')
      return verify.id
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 'P2002') {
      console.error('Error: KARDUS code already exists')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createKardusTemplate()
