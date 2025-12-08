const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSlugs() {
  console.log('🔗 ADDING SLUGS TO MEMBERSHIPS\n')
  console.log('='.repeat(60))
  
  const memberships = await prisma.membership.findMany()
  
  console.log(`\n📦 Found ${memberships.length} memberships\n`)
  
  for (const membership of memberships) {
    let slug = ''
    
    // Generate slug based on duration
    switch (membership.duration) {
      case 'ONE_MONTH':
        slug = 'paket-1bulan'
        break
      case 'THREE_MONTHS':
        slug = 'paket-3bulan'
        break
      case 'SIX_MONTHS':
        slug = 'paket-6bulan'
        break
      case 'TWELVE_MONTHS':
        slug = 'paket-12bulan'
        break
      default:
        slug = `paket-${membership.id.substring(0, 8)}`
    }
    
    await prisma.membership.update({
      where: { id: membership.id },
      data: { slug }
    })
    
    console.log(`✅ ${membership.name}`)
    console.log(`   Duration: ${membership.duration}`)
    console.log(`   Slug: ${slug}`)
    console.log(`   Old URL: /checkout-unified?package=${membership.id}`)
    console.log(`   New URL: /checkout-unified?package=${slug}`)
    console.log('')
  }
  
  console.log('='.repeat(60))
  console.log(`✅ ${memberships.length} memberships updated with slugs!`)
  
  await prisma.$disconnect()
}

addSlugs().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
