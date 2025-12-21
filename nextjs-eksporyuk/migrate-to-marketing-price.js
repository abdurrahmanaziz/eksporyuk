const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateToMarketingPrice() {
  console.log('🔄 Starting migration: originalPrice → marketingPrice...\n')

  try {
    // 1. Get all memberships with originalPrice
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        discount: true
      }
    })

    console.log(`📦 Found ${memberships.length} memberships\n`)

    // 2. Rename column via raw SQL
    console.log('🔧 Renaming originalPrice → marketingPrice...')
    await prisma.$executeRaw`
      ALTER TABLE "Membership" 
      RENAME COLUMN "originalPrice" TO "marketingPrice"
    `
    console.log('✅ Column renamed\n')

    // 3. Drop discount column (no longer needed)
    console.log('🗑️  Dropping discount column...')
    await prisma.$executeRaw`
      ALTER TABLE "Membership" 
      DROP COLUMN "discount"
    `
    console.log('✅ Discount column dropped\n')

    // 4. Show migration summary
    console.log('📊 Migration Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    for (const membership of memberships) {
      console.log(`\n📦 ${membership.name}`)
      console.log(`   Price: Rp ${Number(membership.price).toLocaleString('id-ID')}`)
      
      if (membership.originalPrice) {
        console.log(`   Marketing Price (harga coret): Rp ${Number(membership.originalPrice).toLocaleString('id-ID')}`)
      } else {
        console.log(`   Marketing Price: (none)`)
      }
      
      if (membership.discount > 0) {
        console.log(`   Discount (removed): ${membership.discount}%`)
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✨ Migration completed successfully!')
    console.log('\n📝 Notes:')
    console.log('   • Field "originalPrice" renamed to "marketingPrice"')
    console.log('   • Field "discount" removed (no longer used)')
    console.log('   • All existing data preserved')
    console.log('   • Marketing price is now OPTIONAL')
    console.log('   • Discounts now ONLY come from coupons\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateToMarketingPrice()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
