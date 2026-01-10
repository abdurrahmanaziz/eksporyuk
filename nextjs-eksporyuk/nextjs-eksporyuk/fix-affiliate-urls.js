/**
 * Fix affiliate links with undefined URLs
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Use production URL 
const CORRECT_BASE_URL = 'https://eksporyuk-4qyodi7sp-ekspor-yuks-projects.vercel.app'

async function main() {
  try {
    console.log('🔧 Fixing affiliate links with undefined URLs...')
    
    const links = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { fullUrl: { contains: 'undefined' } },
          { fullUrl: { contains: '/affiliate/undefined/' } },
          { fullUrl: { startsWith: 'undefined/' } }
        ]
      },
      include: {
        membership: { select: { slug: true, checkoutSlug: true } },
        product: { select: { slug: true } },
        course: { select: { id: true } },
        supplier: { select: { id: true } }
      }
    })

    console.log(`Found ${links.length} links to fix`)

    let fixed = 0
    
    for (const link of links) {
      try {
        let newUrl = link.fullUrl

        if (newUrl.startsWith('undefined/')) {
          newUrl = `${CORRECT_BASE_URL}/${newUrl.substring(10)}`
        } else if (newUrl.includes('/affiliate/undefined/')) {
          newUrl = newUrl.replace('/affiliate/undefined/', '/')
          newUrl = `${CORRECT_BASE_URL}${newUrl}`
        } else {
          // Replace any 'undefined' with correct base URL
          newUrl = newUrl.replace(/^undefined/, CORRECT_BASE_URL)
        }

        await prisma.affiliateLink.update({
          where: { id: link.id },
          data: { fullUrl: newUrl }
        })

        console.log(`✅ Fixed: ${link.code}`)
        console.log(`   Old: ${link.fullUrl}`)
        console.log(`   New: ${newUrl}`)
        fixed++

      } catch (error) {
        console.error(`❌ Error fixing link ${link.code}:`, error.message)
      }
    }

    console.log(`\n✅ Fixed ${fixed} affiliate links`)

    // Verify the fix
    const remainingBroken = await prisma.affiliateLink.count({
      where: {
        OR: [
          { fullUrl: { contains: 'undefined' } },
          { fullUrl: null },
          { fullUrl: '' }
        ]
      }
    })

    if (remainingBroken > 0) {
      console.log(`⚠️ Still ${remainingBroken} broken links remaining`)
    } else {
      console.log('🎉 All affiliate links are now fixed!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()