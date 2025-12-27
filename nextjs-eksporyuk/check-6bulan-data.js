const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking 6bulan-ekspor membership data...\n')
    
    // Find membership with checkoutSlug or slug containing '6bulan'
    const membership = await prisma.membership.findFirst({
      where: {
        OR: [
          { checkoutSlug: { contains: '6bulan' } },
          { slug: { contains: '6bulan' } }
        ]
      }
    })
    
    if (!membership) {
      console.log('❌ Membership with 6bulan not found!')
      return
    }
    
    console.log('📦 Membership found:')
    console.log('  ID:', membership.id)
    console.log('  Name:', membership.name)
    console.log('  Slug:', membership.slug)
    console.log('  Checkout Slug:', membership.checkoutSlug)
    console.log('  Duration:', membership.duration)
    console.log('  Price:', membership.price)
    console.log('  Original Price:', membership.originalPrice)
    console.log('\n🎯 Critical fields:')
    console.log('  showInGeneralCheckout:', membership.showInGeneralCheckout)
    console.log('  features type:', typeof membership.features)
    console.log('  features value:', membership.features ? JSON.stringify(membership.features, null, 2) : 'null')
    
    // Parse features if string
    let featuresData = membership.features
    if (typeof featuresData === 'string') {
      try {
        featuresData = JSON.parse(featuresData)
      } catch (e) {
        console.log('  ⚠️ Features is not valid JSON')
      }
    }
    
    console.log('\n📊 Analysis:')
    if (Array.isArray(featuresData)) {
      console.log('  ✅ Features is an array with', featuresData.length, 'items')
      if (featuresData.length === 0) {
        console.log('  ✅ Features array is EMPTY')
        if (membership.showInGeneralCheckout === true) {
          console.log('  ❌ PROBLEM: showInGeneralCheckout is TRUE!')
          console.log('  ⚠️ This will show ALL memberships instead of just this one')
        } else {
          console.log('  ✅ showInGeneralCheckout is', membership.showInGeneralCheckout, '(CORRECT)')
        }
      } else {
        console.log('  ℹ️ Features array has items, will use them as price options')
      }
    } else {
      console.log('  ℹ️ Features is not an array:', typeof featuresData)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
