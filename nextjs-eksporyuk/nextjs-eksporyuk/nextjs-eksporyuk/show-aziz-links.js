const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showAzizLinks() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      include: {
        affiliateProfile: true
      }
    })
    
    if (!user || !user.affiliateProfile) {
      console.error('❌ User or affiliate profile not found')
      return
    }
    
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: user.affiliateProfile.id
      },
      include: {
        membership: {
          select: { name: true, slug: true }
        },
        product: {
          select: { name: true, slug: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n📊 Total links for ${user.email}: ${links.length}\n`)
    
    links.forEach((link, index) => {
      console.log(`${index + 1}. ${link.linkType}`)
      console.log(`   Code: ${link.code}`)
      console.log(`   URL: ${link.fullUrl}`)
      if (link.membership) {
        console.log(`   Membership: ${link.membership.name} (${link.membership.slug})`)
      }
      if (link.product) {
        console.log(`   Product: ${link.product.name} (${link.product.slug})`)
      }
      console.log(`   Active: ${link.isActive}, Archived: ${link.isArchived}`)
      console.log(`   Clicks: ${link.clickCount}, Conversions: ${link.conversionCount}`)
      console.log(`   Created: ${link.createdAt}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

showAzizLinks()
