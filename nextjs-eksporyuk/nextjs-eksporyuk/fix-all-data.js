const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAllData() {
  try {
    console.log('🔧 Fixing all membership and link data...\n')
    
    // 1. Fix invalid URLs
    console.log('1️⃣ Fixing invalid URLs...')
    const memberships = await prisma.membership.findMany()
    
    for (const m of memberships) {
      const updates = {}
      
      // Fix externalSalesUrl
      if (m.externalSalesUrl && !m.externalSalesUrl.startsWith('http')) {
        updates.externalSalesUrl = null
        console.log(`   ✅ Cleared invalid URL in "${m.name}": ${m.externalSalesUrl}`)
      }
      
      // Fix alternativeUrl
      if (m.alternativeUrl && !m.alternativeUrl.startsWith('http')) {
        updates.alternativeUrl = null
        console.log(`   ✅ Cleared invalid alternate URL in "${m.name}": ${m.alternativeUrl}`)
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.membership.update({
          where: { id: m.id },
          data: updates
        })
      }
    }
    
    // 2. Get all affiliate links
    console.log('\n2️⃣ Current affiliate links:')
    const links = await prisma.affiliateLink.findMany({
      where: { membershipId: { not: null } },
      include: {
        membership: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    })
    
    console.log(`   Found ${links.length} links\n`)
    
    links.forEach((link, i) => {
      console.log(`   ${i+1}. User: ${link.user.name} (${link.user.email})`)
      console.log(`      Membership: ${link.membership?.name}`)
      console.log(`      Code: ${link.code}`)
      console.log(`      URL: http://localhost:3000/aff/${link.userId}/${link.code}/`)
      console.log('')
    })
    
    console.log('✅ All data checked and fixed!')
    console.log('\n📋 To test affiliate links, use the URLs shown above')
    console.log('💡 Or generate new links at: http://localhost:3000/affiliate/links')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllData()
