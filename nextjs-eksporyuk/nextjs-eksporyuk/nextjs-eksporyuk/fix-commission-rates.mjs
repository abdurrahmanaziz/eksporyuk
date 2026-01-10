/**
 * Fix Commission Rates in Memberships
 * Commission rates should be percentage (10-30), not huge numbers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCommissionRates() {
  console.log('🔧 Fixing Commission Rates in Memberships...\n')
  
  try {
    // Get all memberships with their current rates
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        affiliateCommissionRate: true
      }
    })
    
    console.log('Current commission rates:')
    memberships.forEach(m => {
      console.log(`   ${m.name}: ${m.affiliateCommissionRate}%`)
    })
    
    console.log('\nFixing commission rates to reasonable percentages...')
    
    // Fix each membership to have reasonable commission rates (10-30%)
    const updates = [
      { name: 'Paket 12 Bulan', rate: 25 },      // 25%
      { name: 'Paket 6 Bulan', rate: 20 },       // 20%  
      { name: 'Paket Lifetime', rate: 30 },      // 30%
      { name: 'Promo Akhir Tahun 2025', rate: 15 } // 15%
    ]
    
    for (const update of updates) {
      const membership = memberships.find(m => m.name === update.name)
      if (membership) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { affiliateCommissionRate: update.rate }
        })
        console.log(`   ✅ ${update.name}: Fixed to ${update.rate}%`)
      }
    }
    
    console.log('\n✅ Commission rates fixed successfully!')
    
    // Verify the changes
    console.log('\nVerifying new rates:')
    const updatedMemberships = await prisma.membership.findMany({
      select: {
        name: true,
        price: true,
        affiliateCommissionRate: true
      }
    })
    
    updatedMemberships.forEach(m => {
      const price = parseFloat(m.price.toString())
      const commission = price * (parseFloat(m.affiliateCommissionRate.toString()) / 100)
      console.log(`   💰 ${m.name}: ${m.affiliateCommissionRate}% = Rp ${commission.toLocaleString('id-ID')} commission`)
    })
    
  } catch (error) {
    console.error('❌ Failed to fix commission rates:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixCommissionRates()