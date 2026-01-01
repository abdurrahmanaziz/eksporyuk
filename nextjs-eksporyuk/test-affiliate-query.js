const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAffiliateLinkQuery() {
  try {
    console.log('Testing exact same query as API endpoint...\n')
    
    // Simulate the API query
    const userId = 'cmjmtotzh001eitz0kq029lk5' // azizbiasa@gmail.com
    
    console.log('1. Finding affiliate profile...')
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true }
    })
    
    if (!affiliateProfile) {
      console.error('❌ No affiliate profile found')
      return
    }
    
    console.log(`✅ Affiliate ID: ${affiliateProfile.id}`)
    
    console.log('\n2. Counting links...')
    const totalCount = await prisma.affiliateLink.count({
      where: {
        affiliateId: affiliateProfile.id,
        isArchived: false
      }
    })
    
    console.log(`✅ Total links: ${totalCount}`)
    
    console.log('\n3. Fetching links with relations...')
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        isArchived: false
      },
      select: {
        id: true,
        code: true,
        fullUrl: true,
        linkType: true,
        couponCode: true,
        clicks: true,
        conversions: true,
        isArchived: true,
        createdAt: true,
        // Relations
        membership: {
          select: { id: true, name: true, slug: true }
        },
        product: {
          select: { id: true, name: true, slug: true }
        },
        course: {
          select: { id: true, title: true }
        },
        supplier: {
          select: { id: true, companyName: true, province: true, city: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      skip: 0
    })
    
    console.log(`✅ Retrieved ${links.length} links`)
    
    console.log('\n4. Sample link:')
    if (links[0]) {
      console.log(JSON.stringify(links[0], null, 2))
    }
    
    console.log('\n✅ ALL QUERIES SUCCESSFUL!')
    
  } catch (error) {
    console.error('\n❌ ERROR:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Meta:', error.meta)
    console.error('\nStack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testAffiliateLinkQuery()
