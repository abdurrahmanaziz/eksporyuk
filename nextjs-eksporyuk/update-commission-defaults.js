const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateCommissionDefaults() {
  console.log('🔄 Updating existing memberships with default commission values...\n')

  try {
    // Update all memberships - set default values
    const result = await prisma.membership.updateMany({
      data: {
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
      }
    })

    console.log(`✅ Updated ${result.count} memberships with default commission settings`)
    console.log('   - Commission Type: PERCENTAGE')
    console.log('   - Affiliate Commission Rate: 30%\n')

    // Show all memberships with their commission settings
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
      },
      orderBy: { name: 'asc' }
    })

    console.log('📦 Current Memberships:\n')
    memberships.forEach(m => {
      const commissionAmount = m.commissionType === 'FLAT' 
        ? `Rp ${Number(m.affiliateCommissionRate).toLocaleString('id-ID')}`
        : `${Number(m.affiliateCommissionRate)}% = Rp ${(Number(m.price) * Number(m.affiliateCommissionRate) / 100).toLocaleString('id-ID')}`
      
      console.log(`  ${m.name}`)
      console.log(`    Price: Rp ${Number(m.price).toLocaleString('id-ID')}`)
      console.log(`    Commission: ${m.commissionType} - ${commissionAmount}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error updating commission defaults:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCommissionDefaults()
