/**
 * Check and ensure proper coupon templates exist
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking coupon templates...')
    
    // Check existing templates
    const templates = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    console.log(`Found ${templates.length} active templates:`)
    for (const template of templates) {
      console.log(`  - ${template.code}: ${template.description || 'No description'}`)
      console.log(`    Type: ${template.discountType}, Value: ${template.discountValue}`)
      console.log(`    Max per affiliate: ${template.maxGeneratePerAffiliate || 'unlimited'}`)
      console.log(`    Max usage per coupon: ${template.maxUsagePerCoupon || 'unlimited'}`)
      console.log(`    ID: ${template.id}`)
    }
    
    if (templates.length === 0) {
      console.log('\n⚠️  No templates found. Creating default templates...')
      
      // Create better templates
      const defaultTemplates = [
        {
          code: 'DISKON10_TEMPLATE',
          description: 'Template diskon 10% untuk semua membership',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxGeneratePerAffiliate: 10,
          maxUsagePerCoupon: 50
        },
        {
          code: 'DISKON25_TEMPLATE', 
          description: 'Template diskon 25% untuk membership premium',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          maxGeneratePerAffiliate: 5,
          maxUsagePerCoupon: 20
        },
        {
          code: 'CASHBACK_100K',
          description: 'Template cashback 100ribu untuk membership',
          discountType: 'FLAT',
          discountValue: 100000,
          maxGeneratePerAffiliate: 3,
          maxUsagePerCoupon: 10
        }
      ]
      
      for (const templateData of defaultTemplates) {
        const template = await prisma.coupon.create({
          data: {
            ...templateData,
            isActive: true,
            isAffiliateEnabled: true,
            usageCount: 0,
            createdBy: null // Admin template
          }
        })
        
        console.log(`✅ Created template: ${template.code}`)
      }
    } else {
      // Update existing template to ensure it has proper settings
      for (const template of templates) {
        const updates = {}
        
        // Ensure template has description
        if (!template.description) {
          updates.description = `Template diskon ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'} untuk affiliate`
        }
        
        // Ensure template has limits
        if (!template.maxGeneratePerAffiliate) {
          updates.maxGeneratePerAffiliate = 10
        }
        
        if (!template.maxUsagePerCoupon) {
          updates.maxUsagePerCoupon = 100
        }
        
        if (Object.keys(updates).length > 0) {
          await prisma.coupon.update({
            where: { id: template.id },
            data: updates
          })
          console.log(`✅ Updated template: ${template.code}`)
        }
      }
    }
    
    // Final check
    const finalTemplates = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    console.log(`\n📋 Final template count: ${finalTemplates.length}`)
    console.log('Templates are ready for affiliate coupon generation!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()