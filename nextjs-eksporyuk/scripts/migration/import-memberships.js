#!/usr/bin/env node
/**
 * Import Sejoli Membership to Eksporyuk
 * - Maps subscription duration (6 month / 12 month / lifetime)
 * - Preserves remaining days from original subscription
 * - Creates UserMembership records with proper expiry dates
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

// Parse arguments
const args = process.argv.slice(2)
const fileArg = args.find(arg => arg.startsWith('--file='))
const dryRun = args.includes('--dry-run')

if (!fileArg) {
  console.error('❌ Usage: node import-memberships.js --file=<path-to-json> [--dry-run]')
  process.exit(1)
}

const filePath = fileArg.split('=')[1]

// Stats
const stats = {
  membershipsCreated: 0,
  membershipsSkipped: 0,
  membershipsFailed: 0,
  usersUpgraded: 0, // User role upgraded to MEMBER_PREMIUM
  errors: []
}

// Sejoli Product ID to Eksporyuk Membership Mapping
// Get actual membership IDs from Eksporyuk database
const MEMBERSHIP_MAP = {
  // Lifetime products
  'LIFETIME': 'membership_lifetime_id', // Will be replaced with real ID
  
  // 12 Month products  
  '12_MONTH': 'membership_12month_id', // Will be replaced with real ID
  
  // 6 Month products
  '6_MONTH': 'membership_6month_id' // Will be replaced with real ID
}

async function main() {
  console.log('\n🚀 SEJOLI MEMBERSHIP TO EKSPORYUK IMPORTER')
  console.log('='.repeat(60))
  console.log(`📂 File: ${filePath}`)
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (preview)' : 'LIVE IMPORT'}`)
  
  // Load data
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`\n📊 Loaded:`)
  console.log(`   Users: ${data.users.length}`)
  console.log(`   With Membership: ${data.stats.users_with_membership}`)
  console.log(`   Active: ${data.stats.active_memberships}`)
  
  // Get Eksporyuk membership plans
  console.log('\n📦 Fetching Eksporyuk membership plans...')
  const memberships = await prisma.membership.findMany({
    where: { isActive: true }
  })
  
  console.log(`   Found ${memberships.length} membership plans:`)
  memberships.forEach(m => {
    console.log(`   - [${m.id}] ${m.name} (${m.slug})`)
  })
  
  // Map by duration
  const lifetimeMembership = memberships.find(m => 
    m.slug.includes('lifetime') || m.name.toLowerCase().includes('lifetime')
  )
  const twelveMonthMembership = memberships.find(m => 
    m.slug.includes('12') || m.slug.includes('tahunan') || m.name.includes('12 Bulan')
  )
  const sixMonthMembership = memberships.find(m => 
    m.slug.includes('6') || m.slug.includes('semester') || m.name.includes('6 Bulan')
  )
  
  if (!lifetimeMembership || !twelveMonthMembership || !sixMonthMembership) {
    console.error('\n❌ Error: Cannot find required membership plans!')
    console.error('   Please ensure you have: Lifetime, 12 Bulan, and 6 Bulan plans')
    process.exit(1)
  }
  
  // Update mapping
  MEMBERSHIP_MAP['LIFETIME'] = lifetimeMembership.id
  MEMBERSHIP_MAP['12_MONTH'] = twelveMonthMembership.id
  MEMBERSHIP_MAP['6_MONTH'] = sixMonthMembership.id
  
  console.log('\n✅ Membership mapping:')
  console.log(`   Lifetime → ${lifetimeMembership.name}`)
  console.log(`   12 Month → ${twelveMonthMembership.name}`)
  console.log(`   6 Month → ${sixMonthMembership.name}`)
  
  // Import memberships
  console.log('\n💼 Importing memberships...\n')
  
  for (const userData of data.users) {
    if (!userData.has_membership || !userData.active_subscription) {
      continue // Skip users without membership
    }
    
    await importUserMembership(userData, dryRun)
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Memberships Created: ${stats.membershipsCreated}`)
  console.log(`Memberships Skipped: ${stats.membershipsSkipped}`)
  console.log(`Memberships Failed: ${stats.membershipsFailed}`)
  console.log(`Users Upgraded to Premium: ${stats.usersUpgraded}`)
  
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
    console.log('\n⚠️  DRY RUN - No changes made')
  } else {
    console.log('\n✅ Import complete!')
  }
}

async function importUserMembership(userData, dryRun = false) {
  try {
    const email = userData.user_email
    const sub = userData.active_subscription
    
    // Find user in Eksporyuk
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        userMemberships: true, // Changed from 'memberships' to 'userMemberships'
        wallet: true
      }
    })
    
    if (!user) {
      console.log(`   ⚠️  ${email} (user not found in Eksporyuk)`)
      stats.membershipsSkipped++
      return
    }
    
    // Check if user already has active membership
    const existingMembership = user.userMemberships.find(m => 
      m.status === 'ACTIVE' && m.isActive
    )
    
    if (existingMembership) {
      console.log(`   ⏭️  ${email} (already has active membership)`)
      stats.membershipsSkipped++
      return
    }
    
    // Get membership ID from duration type
    const membershipId = MEMBERSHIP_MAP[sub.duration_type]
    
    if (!membershipId) {
      console.log(`   ⚠️  ${email} (unknown duration type: ${sub.duration_type})`)
      stats.membershipsSkipped++
      return
    }
    
    // Calculate dates
    const startDate = new Date(sub.created_at)
    const endDate = sub.duration_type === 'LIFETIME' 
      ? new Date('2099-12-31') // Far future for lifetime
      : new Date(sub.end_date)
    
    const isActive = sub.is_active && sub.remaining_days > 0
    const status = isActive ? 'ACTIVE' : (sub.remaining_days < 0 ? 'EXPIRED' : 'PENDING')
    
    if (dryRun) {
      console.log(`   📝 ${email}`)
      console.log(`      Duration: ${sub.duration_type} | Remaining: ${sub.remaining_days} days`)
      console.log(`      Start: ${startDate.toLocaleDateString('id-ID')} | End: ${endDate.toLocaleDateString('id-ID')}`)
      console.log(`      Status: ${status}`)
      stats.membershipsCreated++
      return
    }
    
    // Create UserMembership
    const userMembership = await prisma.userMembership.create({
      data: {
        userId: user.id,
        membershipId: membershipId,
        status: status,
        startDate: startDate,
        endDate: endDate,
        autoRenew: false,
        isActive: isActive,
        activatedAt: isActive ? startDate : null
        // transactionId: null for migrated data (no existing transaction record)
      }
    })
    
    // Update user role if membership is active
    if (isActive && user.role === 'MEMBER_FREE') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_PREMIUM' }
      })
      stats.usersUpgraded++
    }
    
    console.log(`   ✅ ${email} | ${sub.duration_type} | ${sub.remaining_days} days left`)
    stats.membershipsCreated++
    
  } catch (error) {
    console.log(`   ❌ ${userData.user_email}: ${error.message}`)
    stats.membershipsFailed++
    stats.errors.push({
      user: userData.user_email,
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
