const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating salesPageUrl for memberships...\n')

  // Example: Update memberships with sample salespage URLs
  const memberships = await prisma.membership.findMany()

  console.log(`Found ${memberships.length} memberships\n`)

  for (const membership of memberships) {
    console.log(`📦 ${membership.name} (${membership.slug || 'no-slug'})`)
    
    // Example salesPageUrl (bisa internal atau eksternal)
    // Internal: /salespage/paket-premium
    // Eksternal: https://kelaseksporyuk.com/paket-premium
    
    let salesPageUrl = null
    
    // Contoh: Set salesPageUrl berdasarkan slug
    if (membership.slug === 'paket-1bulan') {
      salesPageUrl = 'https://kelaseksporyuk.com/paket-1-bulan'
    } else if (membership.slug === 'paket-6bulan') {
      salesPageUrl = 'https://kelaseksporyuk.com/paket-6-bulan'
    } else if (membership.slug === 'paket-12bulan') {
      salesPageUrl = 'https://kelaseksporyuk.com/paket-12-bulan'
    }

    if (salesPageUrl) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { salesPageUrl }
      })
      console.log(`   ✅ Updated salesPageUrl: ${salesPageUrl}`)
    } else {
      console.log(`   ⚠️  No salesPageUrl set (will use internal checkout)`)
    }
    console.log()
  }

  console.log('\n✨ Done! Check your admin panel to see the generated links.')
  console.log('\n📝 Format link yang akan di-generate:')
  console.log('   - Direct checkout: /membership/[slug]')
  console.log('   - Redirect link: /go/[slug] → salesPageUrl')
  console.log('\n💡 Admin bisa copy link dari panel admin dan share ke affiliate/customer')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
