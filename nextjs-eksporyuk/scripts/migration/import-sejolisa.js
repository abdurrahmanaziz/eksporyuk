#!/usr/bin/env node
/**
 * Import Sejolisa data to Eksporyuk - Simplified for Sejolisa format
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const fileArg = args.find(arg => arg.startsWith('--file='))
const dryRun = args.includes('--dry-run')
const skipExisting = args.includes('--skip-existing')

if (!fileArg) {
  console.error('❌ Usage: node import-sejolisa.js --file=<path-to-json> [--dry-run] [--skip-existing]')
  process.exit(1)
}

const filePath = fileArg.split('=')[1]

// Statistics
const stats = {
  usersCreated: 0,
  usersSkipped: 0,
  usersFailed: 0,
  affiliatesCreated: 0,
  errors: []
}

async function main() {
  console.log('\n🚀 SEJOLISA TO EKSPORYUK IMPORTER')
  console.log('='.repeat(50))
  console.log(`📂 File: ${filePath}`)
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE IMPORT'}`)
  console.log(`⏭️  Skip existing: ${skipExisting}\n`)
  
  // Load data
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`📊 Loaded:`)
  console.log(`   Users: ${data.users.length}`)
  console.log(`   Orders: ${data.orders.length}`)
  console.log(`   Affiliates: ${data.affiliates.length}`)
  console.log(`   Commissions: ${data.commissions.length}\n`)
  
  // Import users
  console.log('👥 Importing users...\n')
  for (const wpUser of data.users) {
    await importUser(wpUser, dryRun, skipExisting)
  }
  
  // Import affiliates
  console.log('\n💼 Importing affiliate profiles...\n')
  for (const wpAff of data.affiliates) {
    await importAffiliate(wpAff, dryRun)
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`   Users Created: ${stats.usersCreated}`)
  console.log(`   Users Skipped: ${stats.usersSkipped}`)
  console.log(`   Users Failed: ${stats.usersFailed}`)
  console.log(`   Affiliates Created: ${stats.affiliatesCreated}`)
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`)
    stats.errors.slice(0, 10).forEach(err => {
      console.log(`   - ${err.user}: ${err.message}`)
    })
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`)
    }
  }
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made. Remove --dry-run to import.')
  } else {
    console.log('\n✅ Import complete!')
  }
}

async function importUser(wpUser, dryRun = false, skip = false) {
  try {
    const email = wpUser.user_email
    
    // Check existing
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existing) {
      if (skip) {
        console.log(`   ⏭️  ${email} (already exists)`)
        stats.usersSkipped++
        return
      }
      // Update existing user with wallet balance
      if (!dryRun) {
        const wallet = await prisma.wallet.upsert({
          where: { userId: existing.id },
          create: {
            userId: existing.id,
            balance: 0,
            balancePending: 0
          },
          update: {}
        })
        console.log(`   ♻️  ${email} (updated wallet)`)
        stats.usersSkipped++
        return
      }
    }
    
    // Map role
    let role = 'MEMBER_FREE'
    if (wpUser.role === 'administrator') role = 'ADMIN'
    else if (wpUser.role === 'editor') role = 'MENTOR'
    
    // Generate username from email
    const username = wpUser.user_login || email.split('@')[0]
    
    // Check if this user is an affiliate
    const isAffiliate = wpUser.affiliate_code !== null
    
    if (dryRun) {
      console.log(`   📝 ${email} | ${role}${isAffiliate ? ' | Affiliate' : ''}`)
      stats.usersCreated++
      return
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: wpUser.display_name || wpUser.first_name || username,
        password: await bcrypt.hash('eksporyuk2024', 10),
        role,
        phone: wpUser.phone || null,
        whatsapp: wpUser.phone || null,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(wpUser.user_registered)
      }
    })
    
    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        balancePending: 0
      }
    })
    
    console.log(`   ✅ ${email} | ${role}`)
    stats.usersCreated++
    
  } catch (error) {
    console.log(`   ❌ ${wpUser.user_email}: ${error.message}`)
    stats.usersFailed++
    stats.errors.push({
      user: wpUser.user_email,
      message: error.message
    })
  }
}

async function importAffiliate(wpAff, dryRun = false) {
  try {
    // Find user in Eksporyuk
    const user = await prisma.user.findUnique({
      where: { email: wpAff.user_email }
    })
    
    if (!user) {
      console.log(`   ⚠️  ${wpAff.user_email} (user not found)`)
      return
    }
    
    // Check if affiliate profile exists
    const existing = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })
    
    if (existing) {
      console.log(`   ⏭️  ${wpAff.user_email} (affiliate already exists)`)
      return
    }
    
    if (dryRun) {
      console.log(`   📝 ${wpAff.user_email} | Code: ${wpAff.affiliate_code} | Earnings: Rp ${wpAff.total_commission.toLocaleString()}`)
      stats.affiliatesCreated++
      return
    }
    
    // Create affiliate profile
    await prisma.affiliateProfile.create({
      data: {
        userId: user.id,
        affiliateCode: wpAff.affiliate_code,
        status: 'ACTIVE',
        tier: 1,
        commissionRate: 30, // Default 30%
        totalClicks: 0,
        totalReferrals: wpAff.total_referrals,
        totalEarnings: wpAff.total_commission,
        isActive: true
      }
    })
    
    // Update wallet with existing commission balance
    if (wpAff.paid_commission > 0 || wpAff.pending_commission > 0) {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: wpAff.paid_commission, // Already paid commissions
          balancePending: wpAff.pending_commission // Pending commissions
        }
      })
    }
    
    console.log(`   ✅ ${wpAff.user_email} | ${wpAff.affiliate_code} | Rp ${wpAff.total_commission.toLocaleString()}`)
    stats.affiliatesCreated++
    
  } catch (error) {
    console.log(`   ❌ ${wpAff.user_email}: ${error.message}`)
    stats.errors.push({
      user: wpAff.user_email,
      message: error.message
    })
  }
}

main()
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
