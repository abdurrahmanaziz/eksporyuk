/**
 * Update affiliate links to use proper live domain instead of Vercel URLs
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Use live domain instead of Vercel URL
const CORRECT_BASE_URL = 'https://app.eksporyuk.com'

async function main() {
  try {
    console.log('🔧 Updating affiliate links to use live domain...')
    
    // Find all links with Vercel URLs
    const linksToUpdate = await prisma.affiliateLink.findMany({
      where: {
        OR: [
          { fullUrl: { contains: 'vercel.app' } },
          { fullUrl: { contains: 'eksporyuk-' } }
        ]
      }
    })

    console.log(`Found ${linksToUpdate.length} links with Vercel URLs to update`)

    let updated = 0
    
    for (const link of linksToUpdate) {
      try {
        let newUrl = link.fullUrl

        // Replace Vercel URLs with live domain
        if (newUrl.includes('eksporyuk-') && newUrl.includes('vercel.app')) {
          // Extract the path and query parameters
          const urlObj = new URL(newUrl)
          const pathAndQuery = urlObj.pathname + urlObj.search
          
          newUrl = `${CORRECT_BASE_URL}${pathAndQuery}`
        }

        await prisma.affiliateLink.update({
          where: { id: link.id },
          data: { fullUrl: newUrl }
        })

        console.log(`✅ Updated: ${link.code}`)
        console.log(`   Old: ${link.fullUrl}`)
        console.log(`   New: ${newUrl}`)
        updated++

      } catch (error) {
        console.error(`❌ Error updating link ${link.code}:`, error.message)
      }
    }

    console.log(`\n✅ Updated ${updated} affiliate links to use live domain`)

    // Verify the updates
    const remainingVercelLinks = await prisma.affiliateLink.count({
      where: {
        OR: [
          { fullUrl: { contains: 'vercel.app' } },
          { fullUrl: { contains: 'eksporyuk-' } }
        ]
      }
    })

    if (remainingVercelLinks > 0) {
      console.log(`⚠️ Still ${remainingVercelLinks} Vercel links remaining`)
    } else {
      console.log('🎉 All affiliate links now use the live domain!')
    }

    // Show sample of updated links
    const sampleLinks = await prisma.affiliateLink.findMany({
      take: 5,
      select: {
        code: true,
        fullUrl: true,
        linkType: true
      }
    })

    console.log('\n📋 Sample updated links:')
    for (const link of sampleLinks) {
      console.log(`  - ${link.code} (${link.linkType}): ${link.fullUrl}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()