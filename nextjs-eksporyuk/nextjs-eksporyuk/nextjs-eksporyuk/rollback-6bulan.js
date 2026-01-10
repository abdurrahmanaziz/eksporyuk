const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function rollback() {
  try {
    console.log('🔄 Rolling back showInGeneralCheckout to true...\n')
    
    const result = await prisma.membership.update({
      where: {
        checkoutSlug: '6bulan-ekspor'
      },
      data: {
        showInGeneralCheckout: true // Kembalikan ke true
      }
    })
    
    console.log('✅ Rollback success!')
    console.log('  Name:', result.name)
    console.log('  showInGeneralCheckout:', result.showInGeneralCheckout)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

rollback()
