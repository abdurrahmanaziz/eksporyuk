const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixData() {
  try {
    console.log('🔧 Fixing 6bulan-ekspor membership...\n')
    
    const result = await prisma.membership.update({
      where: {
        checkoutSlug: '6bulan-ekspor'
      },
      data: {
        showInGeneralCheckout: false
      }
    })
    
    console.log('✅ Successfully updated!')
    console.log('  Name:', result.name)
    console.log('  Checkout Slug:', result.checkoutSlug)
    console.log('  showInGeneralCheckout:', result.showInGeneralCheckout)
    console.log('\n✨ Now /checkout/6bulan-ekspor will show ONLY the 6 months package!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixData()
