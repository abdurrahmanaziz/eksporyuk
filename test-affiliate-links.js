#!/usr/bin/env node
/**
 * Test script to debug affiliate link generation
 * Tests both /api/affiliate/links and /api/affiliate/links/smart-generate
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
})

async function main() {
  try {
    console.log('\n=== AFFILIATE LINKS GENERATION TEST ===\n')

    // Get first test user with affiliate profile
    console.log('1️⃣  Checking test users...')
    const testUsers = await prisma.user.findMany({
      take: 3,
      include: {
        affiliateProfile: {
          select: {
            id: true,
            affiliateCode: true,
            totalClicks: true,
          }
        }
      }
    })
    
    if (testUsers.length === 0) {
      console.log('❌ No test users found. Please seed database first.')
      return
    }

    const testUser = testUsers[0]
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`)
    console.log(`   Affiliate Profile: ${testUser.affiliateProfile ? '✅ Active' : '❌ Not active'}`)

    // Check memberships
    console.log('\n2️⃣  Checking memberships...')
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        affiliateCommissionRate: true,
      },
      take: 3
    })

    if (memberships.length === 0) {
      console.log('❌ No active memberships found')
      return
    }

    memberships.forEach((m, i) => {
      console.log(`   ${i+1}. ${m.name} (ID: ${m.id})`)
      console.log(`      - Slug: ${m.slug}`)
      console.log(`      - Price: Rp ${m.price}`)
      console.log(`      - Commission: ${m.affiliateCommissionRate || 'default'}`)
    })

    // Get affiliate profile or create one
    console.log('\n3️⃣  Setting up affiliate profile...')
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: testUser.id }
    })

    if (!affiliateProfile) {
      console.log('   Creating new affiliate profile...')
      affiliateProfile = await prisma.affiliateProfile.create({
        data: {
          userId: testUser.id,
          affiliateCode: `TEST${Date.now().toString().slice(-6)}`,
          shortLink: Math.random().toString(36).substring(2, 10).toUpperCase(),
        }
      })
    }

    console.log(`✅ Affiliate ID: ${affiliateProfile.id}`)
    console.log(`   Code: ${affiliateProfile.affiliateCode}`)

    // Check existing links for this affiliate
    console.log('\n4️⃣  Checking existing links...')
    const existingLinks = await prisma.affiliateLink.findMany({
      where: { affiliateId: affiliateProfile.id },
      select: {
        id: true,
        code: true,
        linkType: true,
        membershipId: true,
        productId: true,
        clicks: true,
      },
      take: 10
    })

    if (existingLinks.length > 0) {
      console.log(`✅ Found ${existingLinks.length} existing links:`)
      existingLinks.forEach((link, i) => {
        console.log(`   ${i+1}. ${link.code} (Type: ${link.linkType})`)
        console.log(`      - Target: ${link.membershipId ? 'Membership' : link.productId ? 'Product' : 'General'}`)
      })
    } else {
      console.log('ℹ️  No existing links')
    }

    // Test smart-generate API simulation
    console.log('\n5️⃣  Testing smart-generate logic...')
    const targetMembership = memberships[0]
    
    // Check if link already exists for this specific membership
    const checkExisting = await prisma.affiliateLink.findFirst({
      where: {
        affiliateId: affiliateProfile.id,
        membershipId: targetMembership.id,
        linkType: 'CHECKOUT'
      }
    })

    if (checkExisting) {
      console.log(`⚠️  Link already exists for ${targetMembership.name}`)
      console.log(`   Code: ${checkExisting.code}`)
    } else {
      console.log(`✅ No existing link for ${targetMembership.name}`)
      console.log(`   Ready to generate new links`)
    }

    // Check database schema for AffiliateLink
    console.log('\n6️⃣  Database schema check...')
    const sampleLink = await prisma.affiliateLink.findFirst({
      take: 1
    })

    if (sampleLink) {
      console.log('✅ AffiliateLink table exists')
      const fields = Object.keys(sampleLink)
      console.log(`   Fields: ${fields.slice(0, 8).join(', ')}...`)
    }

    // Summary
    console.log('\n=== SUMMARY ===')
    console.log(`✅ User: ${testUser.name}`)
    console.log(`✅ Affiliate Profile: ${affiliateProfile.affiliateCode}`)
    console.log(`✅ Memberships available: ${memberships.length}`)
    console.log(`✅ Existing links: ${existingLinks.length}`)
    console.log(`\nTo generate links manually, use the API endpoint:`)
    console.log(`POST /api/affiliate/links/smart-generate`)
    console.log(`Body: {`)
    console.log(`  "targetType": "membership",`)
    console.log(`  "targetId": "${targetMembership.id}",`)
    console.log(`  "couponId": null`)
    console.log(`}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.meta) {
      console.error('   Meta:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
