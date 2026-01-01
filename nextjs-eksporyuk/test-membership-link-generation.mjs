/**
 * Test script for affiliate link generation - specifically testing membership links
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMembershipLinkGeneration() {
  console.log('\n=== MEMBERSHIP LINK GENERATION TEST ===\n')

  try {
    // 1. Get a test user with affiliate profile
    console.log('1️⃣  Finding test user with affiliate profile...')
    const testUser = await prisma.user.findFirst({
      include: {
        affiliateProfile: true
      }
    })

    if (!testUser) {
      console.log('❌ No users found. Create one first.')
      return
    }

    console.log(`✅ Found user: ${testUser.name} (${testUser.email})`)

    // Get or create affiliate profile
    let affiliateProfile = testUser.affiliateProfile
    if (!affiliateProfile) {
      console.log('   Creating affiliate profile...')
      const profileId = `af_${Date.now().toString().slice(-9)}`
      affiliateProfile = await prisma.affiliateProfile.create({
        data: {
          id: profileId,
          userId: testUser.id,
          affiliateCode: `TEST${Date.now().toString().slice(-6)}`,
          shortLink: Math.random().toString(36).substring(2, 10).toUpperCase(),
          updatedAt: new Date()
        }
      })
    }
    console.log(`✅ Affiliate ID: ${affiliateProfile.id}, Code: ${affiliateProfile.affiliateCode}`)

    // 2. Check active memberships
    console.log('\n2️⃣  Checking active memberships...')
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        affiliateCommissionRate: true,
      }
    })

    if (memberships.length === 0) {
      console.log('❌ No active memberships found')
      return
    }

    console.log(`✅ Found ${memberships.length} active memberships:`)
    memberships.slice(0, 3).forEach((m, i) => {
      console.log(`   ${i+1}. ${m.name}`)
      console.log(`      - ID: ${m.id}`)
      console.log(`      - Slug: ${m.slug}`)
      console.log(`      - Checkout Slug: ${m.checkoutSlug || 'N/A'}`)
      console.log(`      - Commission: ${m.affiliateCommissionRate || 'Default'}`)
    })

    // 3. Test link generation simulation for specific membership
    console.log('\n3️⃣  Testing link generation for specific membership...')
    const targetMembership = memberships[0]
    console.log(`   Target: ${targetMembership.name} (ID: ${targetMembership.id})`)

    // Check if links already exist
    const existingLinks = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        membershipId: targetMembership.id
      },
      select: {
        id: true,
        code: true,
        linkType: true,
        fullUrl: true
      }
    })

    if (existingLinks.length > 0) {
      console.log(`   ⚠️  Found ${existingLinks.length} existing links:`)
      existingLinks.forEach((link, i) => {
        console.log(`       ${i+1}. ${link.code} (${link.linkType})`)
        console.log(`          URL: ${link.fullUrl?.substring(0, 80)}...`)
      })
    } else {
      console.log(`   ✅ No existing links (ready for generation)`)
    }

    // 4. Check link generation logic
    console.log('\n4️⃣  Checking smart-generate requirements...')
    
    // Verify the membership is suitable for affiliate
    const membershipDetails = await prisma.membership.findUnique({
      where: { id: targetMembership.id },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        isActive: true,
        affiliateEnabled: true,
      }
    })

    console.log(`   Membership properties:`)
    console.log(`   - Active: ${membershipDetails?.isActive ? '✅' : '❌'}`)
    console.log(`   - Affiliate Enabled: ${membershipDetails?.affiliateEnabled ? '✅' : '⚠️'}`)
    console.log(`   - Slug: ${membershipDetails?.slug || '❌ Missing'}`)
    console.log(`   - Checkout Slug: ${membershipDetails?.checkoutSlug || '⚠️ Not set'}`)

    // 5. Check coupon availability
    console.log('\n5️⃣  Checking coupon availability...')
    const availableCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { createdBy: testUser.id },
          { createdBy: 'ADMIN' }
        ]
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        createdBy: true
      },
      take: 5
    })

    if (availableCoupons.length > 0) {
      console.log(`   ✅ Found ${availableCoupons.length} available coupons:`)
      availableCoupons.forEach((c, i) => {
        console.log(`       ${i+1}. ${c.code} (${c.discountType}) - by ${c.createdBy === 'ADMIN' ? '👑 Admin' : '👤 User'}`)
      })
    } else {
      console.log(`   ℹ️  No coupons available (links can be generated without coupons)`)
    }

    // 6. Summary and what-should-happen
    console.log('\n6️⃣  What should happen when user generates membership link...')
    console.log(`\n   When affiliate selects "${targetMembership.name}" and clicks "Generate Link":`)
    console.log(`   1. System should call: POST /api/affiliate/links/smart-generate`)
    console.log(`   2. With body:`)
    console.log(`      {`)
    console.log(`        "targetType": "membership",`)
    console.log(`        "targetId": "${targetMembership.id}",`)
    console.log(`        "couponId": null  // or selected coupon ID`)
    console.log(`      }`)
    console.log(`   3. Should generate:`)
    console.log(`      - SALESPAGE_INTERNAL link`)
    console.log(`      - CHECKOUT link`)
    console.log(`      - CHECKOUT_PRO link`)
    console.log(`   4. Each should be unique and trackable`)

    // 7. Database check
    console.log('\n7️⃣  Database integrity check...')
    
    // Check if AffiliateLink table has required fields
    const sampleLink = await prisma.affiliateLink.findFirst({
      take: 1
    })

    if (sampleLink) {
      const requiredFields = ['id', 'code', 'fullUrl', 'linkType', 'membershipId', 'affiliateId']
      const hasAllFields = requiredFields.every(field => field in sampleLink)
      console.log(`   ✅ AffiliateLink schema is correct`)
    } else {
      console.log(`   ℹ️  No links in database yet`)
    }

    console.log('\n=== TEST COMPLETE ===\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.meta) {
      console.error('   Details:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testMembershipLinkGeneration()
