const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateLinks() {
  try {
    const links = await prisma.affiliateLink.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        fullUrl: true,
        userId: true,
        createdAt: true,
      }
    })
    
    console.log(`\n=== AFFILIATE LINKS (${links.length} total) ===`)
    if (links.length === 0) {
      console.log('❌ Tidak ada link tersimpan di database')
      console.log('   Link yang di-generate tidak tersimpan!')
    } else {
      links.forEach((link, idx) => {
        console.log(`\n${idx + 1}. Code: ${link.code}`)
        console.log(`   URL: ${link.fullUrl}`)
        console.log(`   User: ${link.userId}`)
        console.log(`   Created: ${link.createdAt}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAffiliateLinks()
