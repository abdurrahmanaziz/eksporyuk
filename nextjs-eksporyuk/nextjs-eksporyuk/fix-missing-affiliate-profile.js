#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixMissingAffiliateProfile() {
  try {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  🔧 FIXING MISSING AFFILIATE PROFILE (SAFE)`)
    console.log(`${'='.repeat(70)}\n`)

    const affiliateId = 'cmjmtotzh001eitz0kq029lk5'

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      console.log(`❌ User ${affiliateId} does not exist`)
      return
    }

    console.log(`User found: ${user.name} (${user.email})`)
    console.log(`Role: ${user.role}\n`)

    // Check if profile already exists
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { id: affiliateId }
    })

    if (existingProfile) {
      console.log(`✅ Profile already exists! No action needed.`)
      return
    }

    // Check wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: affiliateId },
      select: { balance: true }
    })

    if (!wallet) {
      console.log(`❌ Wallet does not exist`)
      return
    }

    console.log(`Wallet Balance: Rp${wallet.balance.toLocaleString('id-ID')}\n`)

    // Generate affiliate code from email
    const emailBase = user.email.split('@')[0]
    const timestamp = Date.now().toString().slice(-4)
    const affiliateCode = `${emailBase.toUpperCase()}-${timestamp}`
    const shortLink = `https://eksporyuk.com/${emailBase}`

    console.log(`Creating affiliate profile...`)
    console.log(`  ID: ${affiliateId}`)
    console.log(`  Code: ${affiliateCode}`)
    console.log(`  Short Link: ${shortLink}`)
    console.log(`  User: ${user.name}\n`)

    // Create profile
    const profile = await prisma.affiliateProfile.create({
      data: {
        id: affiliateId,
        affiliateCode: affiliateCode,
        shortLink: shortLink,
        userId: affiliateId,
        applicationStatus: 'APPROVED',
        approvedAt: new Date(),
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        profileCompleted: true,
        profileCompletedAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log(`✅ PROFILE CREATED SUCCESSFULLY`)
    console.log(`  ID: ${profile.id}`)
    console.log(`  Code: ${profile.affiliateCode}`)
    console.log(`  Status: ${profile.applicationStatus}`)
    console.log(`  Approved: ${profile.approvedAt.toLocaleString('id-ID')}\n`)

    console.log(`${'='.repeat(70)}`)
    console.log(`FIX COMPLETE`)
    console.log(`${'='.repeat(70)}`)
    console.log(`\n✅ Affiliate can now:`)
    console.log(`   - Access affiliate dashboard`)
    console.log(`   - Create short links`)
    console.log(`   - View profile and settings`)
    console.log(`   - Process withdrawals\n`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('This is safe to retry if there was a temporary issue.')
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingAffiliateProfile()
