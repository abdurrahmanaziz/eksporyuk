const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixProMembership() {
  console.log('\n🔧 Fixing Pro Membership - Removing price data...\n')

  try {
    // Find Pro membership
    const proMembership = await prisma.membership.findFirst({
      where: {
        slug: 'pro'
      }
    })

    if (!proMembership) {
      console.log('❌ Pro membership not found')
      return
    }

    console.log('📦 Current Pro Membership:')
    console.log(`   Name: ${proMembership.name}`)
    console.log(`   Slug: ${proMembership.slug}`)
    console.log(`   Current features:`, proMembership.features)

    // Update Pro membership - remove features only
    // Keep price and duration as required fields
    const updated = await prisma.membership.update({
      where: {
        id: proMembership.id
      },
      data: {
        features: null // Remove features/prices
      }
    })

    console.log('\n✅ Pro Membership Updated:')
    console.log(`   Features: ${updated.features || 'NULL (no prices)'}`)
    console.log(`   Price: ${updated.price}`)
    console.log(`   Duration: ${updated.duration}`)

    console.log('\n🎉 Success! Pro membership features removed.')
    console.log('   The checkout page will not display any pricing options.')
    console.log('   Users will select from other membership packages.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixProMembership()
