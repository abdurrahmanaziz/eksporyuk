/**
 * Check affiliate links with undefined URLs
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking affiliate links for undefined URLs...')
    
    const links = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { fullUrl: { contains: 'undefined' } },
          { fullUrl: { contains: '/affiliate/undefined/' } },
          { fullUrl: null }
        ]
      },
      include: {
        affiliate: {
          select: { 
            user: { select: { name: true } },
            affiliateCode: true 
          }
        },
        membership: { select: { name: true, slug: true } },
        product: { select: { name: true, slug: true } }
      }
    })

    if (links.length === 0) {
      console.log('✅ No links with undefined URLs found')
    } else {
      console.log(`❌ Found ${links.length} links with undefined URLs:`)
      
      for (const link of links) {
        console.log(`\nLink ID: ${link.id}`)
        console.log(`Code: ${link.code}`)
        console.log(`URL: ${link.fullUrl}`)
        console.log(`Link Type: ${link.linkType}`)
        console.log(`Affiliate: ${link.affiliate?.user?.name} (${link.affiliate?.affiliateCode})`)
        console.log(`Target: ${link.membership?.name || link.product?.name || 'N/A'}`)
        console.log(`Created: ${link.createdAt}`)
      }
    }

    // Also check for any NULL or empty URLs
    const nullLinks = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { fullUrl: null },
          { fullUrl: '' }
        ]
      }
    })

    if (nullLinks.length > 0) {
      console.log(`\n⚠️ Found ${nullLinks.length} links with null/empty URLs`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()