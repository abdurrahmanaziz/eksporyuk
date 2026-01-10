const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCheckoutTemplate() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Test if checkoutTemplate field exists
    try {
      const test = await prisma.membership.findFirst({
        select: { checkoutTemplate: true }
      })
      console.log('✅ checkoutTemplate field exists in database')
    } catch (error) {
      console.error('❌ checkoutTemplate field NOT found in database!')
      console.log('\n⚠️  You need to run: npx prisma db push --accept-data-loss')
      process.exit(1)
    }

    // Set default template for all memberships without one
    console.log('\n📝 Setting default templates for memberships...')
    
    const memberships = await prisma.membership.findMany()
    console.log(`Found ${memberships.length} memberships`)

    let updated = 0
    for (const membership of memberships) {
      if (!membership.checkoutTemplate) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { checkoutTemplate: 'modern' }
        })
        console.log(`✓ Set template for: ${membership.name}`)
        updated++
      } else {
        console.log(`- Already has template: ${membership.name} (${membership.checkoutTemplate})`)
      }
    }

    console.log(`\n✅ Updated ${updated} memberships`)
    console.log('🎉 Done!')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixCheckoutTemplate()
