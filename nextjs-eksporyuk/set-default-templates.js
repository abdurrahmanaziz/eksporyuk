const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setDefaultCheckoutTemplate() {
  console.log('🔄 Setting default checkout template for memberships...\n')

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        OR: [
          { checkoutTemplate: null },
          { checkoutTemplate: '' }
        ]
      }
    })

    console.log(`📦 Found ${memberships.length} memberships without checkout template`)

    for (const membership of memberships) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { checkoutTemplate: 'modern' }
      })
      console.log(`  ✅ ${membership.name} → modern template`)
    }

    console.log('\n✅ All memberships now have checkout template!')
  } catch (error) {
    console.error('❌ Error setting checkout templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setDefaultCheckoutTemplate()
