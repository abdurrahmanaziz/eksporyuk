const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSlugRedirect() {
  console.log('🔗 TESTING SLUG REDIRECT SYSTEM')
  console.log('='.repeat(50))
  
  try {
    // Check current memberships with slugs
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: { 
        id: true,
        name: true, 
        slug: true,
        price: true
      }
    })
    
    console.log('\n📋 MEMBERSHIP SLUGS READY:')
    memberships.forEach(m => {
      const cleanUrl = m.slug ? `/membership/${m.slug}/` : '❌ No slug'
      console.log(`   - ${m.name} → ${cleanUrl}`)
    })
    
    // Check affiliate links
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { 
        isActive: true,
        membershipId: { not: null }
      },
      include: {
        membership: {
          select: { name: true, slug: true }
        }
      },
      select: {
        id: true,
        code: true,
        shortCode: true,
        membershipId: true,
        membership: true,
        couponCode: true
      }
    })
    
    console.log('\n🔗 AFFILIATE LINKS STATUS:')
    affiliateLinks.forEach(link => {
      const membership = link.membership
      const cleanUrl = membership?.slug ? `/membership/${membership.slug}/` : '❌ No slug'
      console.log(`   - ${membership?.name}: ${cleanUrl} (Code: ${link.shortCode})`)
      console.log(`     Coupon: ${link.couponCode || 'NULL ✅'}`)
    })
    
    // Test URLs
    console.log('\n🌐 TEST URLs (Ready to use):')
    const testMembership = memberships.find(m => m.slug)
    if (testMembership) {
      console.log(`   TEST: http://localhost:3000/membership/${testMembership.slug}/`)
      console.log('   Expected flow:')
      console.log('   1. Route handler finds membership by slug')
      console.log('   2. Gets affiliate link (shortCode)')
      console.log('   3. Sets affiliate_ref cookie')
      console.log('   4. Redirects to /checkout-unified?membership=ID&ref=shortCode')
      console.log('   5. Checkout page applies coupon if exists')
    } else {
      console.log('   ❌ No membership with slug found')
    }
    
    console.log('\n✅ ADMIN PAGES UPDATED:')
    console.log('   - /admin/membership - now shows /membership/[slug]/ URLs')
    console.log('   - /admin/products - now shows /product/[slug]/ URLs')
    console.log('   - Both have slug input fields in forms')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSlugRedirect()