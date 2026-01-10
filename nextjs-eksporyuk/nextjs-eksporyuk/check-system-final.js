const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSystem() {
  console.log('\n========================================')
  console.log('🔍 PEMERIKSAAN SISTEM - FINAL CHECK')
  console.log('========================================\n')

  try {
    // 1. Check Memberships
    console.log('📦 STEP 1: MEMBERSHIP PACKAGES')
    console.log('========================================')
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`Total active packages: ${memberships.length}\n`)
    
    for (const pkg of memberships) {
      console.log(`  📦 ${pkg.name}`)
      console.log(`     ID: ${pkg.id}`)
      console.log(`     Slug: ${pkg.slug || 'TIDAK ADA'}`)
      console.log(`     Price: Rp ${pkg.price.toLocaleString()}`)
      console.log('')
    }

    // 2. Check Affiliate Links
    console.log('========================================')
    console.log('🔗 STEP 2: AFFILIATE LINKS')
    console.log('========================================')
    const links = await prisma.affiliateLink.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      include: {
        membership: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Total active links: ${links.length}\n`)

    for (const link of links) {
      console.log(`  🔗 ${link.membership?.name || 'Unknown Package'}`)
      console.log(`     Code: ${link.code}`)
      console.log(`     Short: ${link.shortCode || 'TIDAK ADA'}`)
      console.log(`     CouponCode: ${link.couponCode || 'TIDAK ADA (✅ CORRECT)'}`)
      console.log(`     Package ID: ${link.membershipId}`)
      console.log(`     Package Slug: ${link.membership?.slug || 'N/A'}`)
      
      if (link.shortCode) {
        console.log(`     Short URL (Salespage): http://localhost:3000/go/${link.shortCode}`)
        console.log(`     Short URL (Checkout): http://localhost:3000/go/${link.shortCode}/checkout`)
      }
      console.log('')
    }

    // 3. Check Links - What will redirect to
    console.log('========================================')
    console.log('🎯 STEP 3: REDIRECT TEST')
    console.log('========================================\n')

    for (const link of links) {
      if (!link.shortCode) continue

      const packageIdentifier = link.membership?.slug || link.membershipId
      
      console.log(`  Short: /go/${link.shortCode}/checkout`)
      console.log(`  → Will redirect to: /checkout-unified?ref=${link.code}&package=${packageIdentifier}`)
      console.log(`  ✅ Tracking: ref=${link.code}`)
      console.log(`  ✅ Package: ${packageIdentifier}`)
      console.log(`  ✅ No coupon auto-apply (user input manual)`)
      console.log('')
    }

    // 4. Summary
    console.log('========================================')
    console.log('📊 SUMMARY')
    console.log('========================================')
    console.log(`✅ Memberships: ${memberships.length} packages`)
    console.log(`✅ Affiliate Links: ${links.length} links`)
    console.log(`✅ Links with short code: ${links.filter(l => l.shortCode).length}`)
    console.log(`✅ Links with slug: ${links.filter(l => l.membership?.slug).length}`)
    console.log('')

    const hasProblems = links.some(l => l.couponCode !== null)
    if (hasProblems) {
      console.log('⚠️  WARNING: Some links still have couponCode!')
      console.log('   Run: node remove-all-coupons-from-links.js')
    } else {
      console.log('✅ PERFECT! No coupon codes in links')
    }
    console.log('')

    console.log('========================================')
    console.log('🧪 TESTING')
    console.log('========================================')
    console.log('1. Visit admin page: http://localhost:3000/admin/membership')
    console.log('2. Check: No coupon warnings/badges')
    console.log('3. Copy link dan test')
    console.log('4. Visit link → Should redirect to checkout')
    console.log('5. Check: ref parameter ada, package correct')
    console.log('6. Check: Tidak ada auto-apply coupon')
    console.log('')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSystem()
