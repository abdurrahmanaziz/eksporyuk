const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixBrokenUrls() {
  try {
    console.log('�� Checking for broken URLs with newlines...\n')
    
    // Get all links
    const allLinks = await prisma.affiliateLink.findMany({
      select: {
        id: true,
        code: true,
        fullUrl: true,
        linkType: true,
      }
    })
    
    console.log(`📊 Total links: ${allLinks.length}`)
    
    let fixedCount = 0
    const brokenLinks = []
    
    for (const link of allLinks) {
      if (link.fullUrl && link.fullUrl.includes('\n')) {
        brokenLinks.push({
          id: link.id,
          code: link.code,
          before: link.fullUrl,
          after: link.fullUrl.replace(/\n/g, '').replace(/\s+/g, '')
        })
        
        // Fix the URL by removing all newlines and extra spaces
        const fixedUrl = link.fullUrl.replace(/\n/g, '').replace(/\s+/g, '')
        
        await prisma.affiliateLink.update({
          where: { id: link.id },
          data: { fullUrl: fixedUrl }
        })
        
        fixedCount++
      }
    }
    
    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} broken URLs:\n`)
      brokenLinks.forEach((link, i) => {
        console.log(`${i + 1}. Code: ${link.code}`)
        console.log(`   Before: ${link.before}`)
        console.log(`   After:  ${link.after}\n`)
      })
    } else {
      console.log('\n✅ No broken URLs found!')
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total links: ${allLinks.length}`)
    console.log(`   Fixed: ${fixedCount}`)
    console.log(`   OK: ${allLinks.length - fixedCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixBrokenUrls()
