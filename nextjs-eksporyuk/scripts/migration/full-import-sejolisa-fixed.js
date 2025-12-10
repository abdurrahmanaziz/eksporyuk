#!/usr/bin/env node
/**
 * FIXED SEJOLI IMPORT - Users, Transactions, Memberships, Affiliates, Commissions
 * Run: node scripts/migration/full-import-sejolisa-fixed.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Configuration
const DATA_FILE = path.join(__dirname, 'wp-data/sejolisa-export-100users-1765248491032.json')
const MEMBERSHIP_FILE = path.join(__dirname, 'wp-data/memberships-100users-1765249411520.json')
const DEFAULT_PASSWORD = 'eksporyuk2024'
const SKIP_EXISTING = true

// Statistics
const stats = {
  users: { created: 0, skipped: 0, failed: 0 },
  transactions: { created: 0, skipped: 0, failed: 0 },
  memberships: { created: 0, skipped: 0, failed: 0 },
  affiliates: { created: 0, skipped: 0, failed: 0 },
  commissions: { created: 0, skipped: 0, failed: 0 },
  errors: []
}

// WP User ID to Eksporyuk User ID mapping
const userIdMap = new Map()

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🚀 FULL SEJOLI → EKSPORYUK MIGRATION (FIXED)')
  console.log('='.repeat(70))
  console.log(`📅 Date: ${new Date().toISOString()}`)
  console.log(`📂 Data File: ${DATA_FILE}`)
  console.log('')
  
  // Load data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Data file not found:', DATA_FILE)
    process.exit(1)
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  
  console.log('📊 DATA TO IMPORT:')
  console.log(`   👤 Users: ${data.users?.length || 0}`)
  console.log(`   💳 Orders: ${data.orders?.length || 0}`)
  console.log(`   🔗 Affiliates: ${data.affiliates?.length || 0}`)
  console.log(`   💰 Commissions: ${data.commissions?.length || 0}`)
  console.log('')
  
  // Load memberships if available
  let memberships = []
  if (fs.existsSync(MEMBERSHIP_FILE)) {
    const membershipData = JSON.parse(fs.readFileSync(MEMBERSHIP_FILE, 'utf-8'))
    memberships = membershipData.memberships || []
    console.log(`   🎫 Memberships: ${memberships.length}`)
  }
  
  // STEP 1: Import Users & Build ID Map
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 1: IMPORTING USERS')
  console.log('='.repeat(70))
  await importUsers(data.users)
  
  // STEP 2: Import Affiliates (with correct structure)
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 2: IMPORTING AFFILIATE PROFILES')
  console.log('='.repeat(70))
  await importAffiliates(data.affiliates || [])
  
  // STEP 3: Import Orders as Transactions
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 3: IMPORTING ORDERS → TRANSACTIONS')
  console.log('='.repeat(70))
  await importTransactions(data.orders, data.users)
  
  // STEP 4: Import Memberships (from orders with completed status)
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 4: IMPORTING USER MEMBERSHIPS FROM ORDERS')
  console.log('='.repeat(70))
  await importMembershipsFromOrders(data.orders, data.users)
  
  // STEP 5: Import Commissions
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 5: IMPORTING AFFILIATE COMMISSIONS')
  console.log('='.repeat(70))
  await importCommissions(data.commissions, data.affiliates)
  
  // Final Summary
  printSummary()
  
  await prisma.$disconnect()
}

async function importUsers(users) {
  if (!users || users.length === 0) {
    console.log('   ⚠️ No users to import')
    return
  }
  
  console.log(`\n   Importing ${users.length} users...\n`)
  
  for (const wpUser of users) {
    try {
      const email = wpUser.user_email
      
      // Check if exists
      let existing = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existing) {
        // Store mapping
        userIdMap.set(wpUser.id, existing.id)
        
        // Ensure wallet exists
        await prisma.wallet.upsert({
          where: { userId: existing.id },
          create: { userId: existing.id, balance: 0, balancePending: 0 },
          update: {}
        })
        
        stats.users.skipped++
        continue
      }
      
      // Map role
      let role = 'MEMBER_FREE'
      if (wpUser.role === 'administrator') role = 'ADMIN'
      else if (wpUser.role === 'editor') role = 'MENTOR'
      
      // Generate username
      const baseUsername = wpUser.user_login || email.split('@')[0]
      const username = await generateUniqueUsername(baseUsername)
      
      // Create new user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          name: wpUser.display_name || wpUser.first_name || username,
          password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
          role,
          phone: wpUser.phone || null,
          whatsapp: wpUser.phone || null,
          emailVerified: true,
          isActive: true,
          createdAt: new Date(wpUser.user_registered)
        }
      })
      
      // Store mapping
      userIdMap.set(wpUser.id, user.id)
      
      // Create wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          balancePending: 0
        }
      })
      
      stats.users.created++
      
    } catch (error) {
      stats.users.failed++
      stats.errors.push({
        type: 'user',
        identifier: wpUser.user_email,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.users.created}`)
  console.log(`   ⏭️  Skipped: ${stats.users.skipped}`)
  console.log(`   ❌ Failed: ${stats.users.failed}`)
  console.log(`   📋 ID Map: ${userIdMap.size} mappings`)
}

async function generateUniqueUsername(base) {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!username) username = 'user'
  let suffix = 0
  
  while (true) {
    const tryUsername = suffix === 0 ? username : `${username}${suffix}`
    const exists = await prisma.user.findUnique({
      where: { username: tryUsername }
    })
    if (!exists) return tryUsername
    suffix++
    if (suffix > 1000) return `${username}${Date.now()}`
  }
}

async function importAffiliates(affiliates) {
  if (!affiliates || affiliates.length === 0) {
    console.log('   ⚠️ No affiliates to import')
    return
  }
  
  console.log(`\n   Importing ${affiliates.length} affiliates...\n`)
  
  for (const aff of affiliates) {
    try {
      // Find user by WP user_id or email
      let eksporyukUserId = userIdMap.get(aff.user_id)
      
      if (!eksporyukUserId && aff.user_email) {
        const user = await prisma.user.findUnique({
          where: { email: aff.user_email }
        })
        if (user) eksporyukUserId = user.id
      }
      
      if (!eksporyukUserId) {
        stats.affiliates.skipped++
        continue
      }
      
      // Check if affiliate exists
      const existing = await prisma.affiliateProfile.findUnique({
        where: { userId: eksporyukUserId }
      })
      
      if (existing) {
        // Update existing
        await prisma.affiliateProfile.update({
          where: { userId: eksporyukUserId },
          data: {
            totalConversions: aff.total_referrals || 0,
            totalEarnings: aff.total_commission || 0
          }
        })
        
        stats.affiliates.skipped++
        continue
      }
      
      // Generate unique shortLink
      const shortLink = `aff-${eksporyukUserId.slice(-8)}-${Date.now().toString(36)}`
      const affiliateCode = aff.affiliate_code || `AFF${eksporyukUserId.slice(-6).toUpperCase()}`
      
      // Create new affiliate with CORRECT structure
      await prisma.affiliateProfile.create({
        data: {
          user: { connect: { id: eksporyukUserId } },
          affiliateCode,
          shortLink,
          applicationStatus: 'APPROVED',
          tier: 1,
          commissionRate: 30,
          totalClicks: 0,
          totalConversions: aff.total_referrals || 0,
          totalEarnings: aff.total_commission || 0,
          isActive: aff.status === 'active',
          approvedAt: new Date()
        }
      })
      
      // Update wallet balance
      if ((aff.paid_commission || 0) > 0 || (aff.pending_commission || 0) > 0) {
        await prisma.wallet.update({
          where: { userId: eksporyukUserId },
          data: {
            balance: aff.paid_commission || 0,
            balancePending: aff.pending_commission || 0
          }
        })
      }
      
      stats.affiliates.created++
      
    } catch (error) {
      stats.affiliates.failed++
      stats.errors.push({
        type: 'affiliate',
        identifier: aff.user_email || aff.user_id,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.affiliates.created}`)
  console.log(`   ⏭️  Skipped: ${stats.affiliates.skipped}`)
  console.log(`   ❌ Failed: ${stats.affiliates.failed}`)
}

async function importTransactions(orders, users) {
  if (!orders || orders.length === 0) {
    console.log('   ⚠️ No orders to import')
    return
  }
  
  // Build WP user_id to email map
  const wpUserEmailMap = new Map()
  for (const u of users) {
    wpUserEmailMap.set(u.id, u.user_email)
  }
  
  console.log(`\n   Importing ${orders.length} orders as transactions...\n`)
  
  for (const order of orders) {
    try {
      // Get Eksporyuk user ID from WP user_id
      const eksporyukUserId = userIdMap.get(order.user_id)
      const wpUserEmail = wpUserEmailMap.get(order.user_id)
      
      if (!eksporyukUserId) {
        stats.transactions.skipped++
        continue
      }
      
      // Check if transaction already exists (by externalId)
      const externalId = `SEJOLI-${order.id}`
      const existing = await prisma.transaction.findFirst({
        where: { externalId }
      })
      
      if (existing) {
        stats.transactions.skipped++
        continue
      }
      
      // Map status
      let status = 'PENDING'
      if (order.status === 'completed' || order.status === 'success') {
        status = 'COMPLETED'
      } else if (order.status === 'failed' || order.status === 'cancelled') {
        status = 'FAILED'
      } else if (order.status === 'refunded') {
        status = 'REFUNDED'
      }
      
      // Get user for customer details
      const user = await prisma.user.findUnique({
        where: { id: eksporyukUserId }
      })
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: eksporyukUserId,
          type: 'MEMBERSHIP',
          status,
          amount: parseFloat(order.grand_total || 0),
          
          customerName: user?.name || 'Customer',
          customerEmail: user?.email || wpUserEmail || '',
          customerPhone: user?.phone,
          customerWhatsapp: user?.whatsapp,
          
          description: `Import from Sejoli - Order #${order.id}`,
          paymentMethod: order.payment_gateway || 'SEJOLI',
          paymentProvider: 'SEJOLI',
          externalId,
          
          paidAt: status === 'COMPLETED' ? new Date(order.created_at) : null,
          createdAt: new Date(order.created_at)
        }
      })
      
      stats.transactions.created++
      
    } catch (error) {
      stats.transactions.failed++
      stats.errors.push({
        type: 'transaction',
        identifier: `Order #${order.id}`,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.transactions.created}`)
  console.log(`   ⏭️  Skipped: ${stats.transactions.skipped}`)
  console.log(`   ❌ Failed: ${stats.transactions.failed}`)
}

async function importMembershipsFromOrders(orders, users) {
  // Get completed orders
  const completedOrders = orders.filter(o => 
    o.status === 'completed' || o.status === 'success'
  )
  
  if (completedOrders.length === 0) {
    console.log('   ⚠️ No completed orders to create memberships from')
    return
  }
  
  console.log(`\n   Creating memberships from ${completedOrders.length} completed orders...\n`)
  
  // Get default membership
  const defaultMembership = await prisma.membership.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { price: 'desc' }
  })
  
  if (!defaultMembership) {
    console.log('   ❌ No published membership found in system')
    return
  }
  
  console.log(`   Using membership: ${defaultMembership.name}`)
  
  for (const order of completedOrders) {
    try {
      const eksporyukUserId = userIdMap.get(order.user_id)
      
      if (!eksporyukUserId) {
        stats.memberships.skipped++
        continue
      }
      
      // Check if user already has membership
      const existing = await prisma.userMembership.findFirst({
        where: { userId: eksporyukUserId }
      })
      
      if (existing) {
        stats.memberships.skipped++
        continue
      }
      
      // Calculate dates (90 days default duration)
      const startDate = new Date(order.created_at)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 90)
      
      const now = new Date()
      const isActive = endDate > now
      
      // Create user membership
      await prisma.userMembership.create({
        data: {
          userId: eksporyukUserId,
          membershipId: defaultMembership.id,
          startDate,
          endDate,
          isActive,
          status: isActive ? 'ACTIVE' : 'EXPIRED',
          activatedAt: startDate,
          price: parseFloat(order.grand_total || 0),
          source: 'SEJOLI',
          sejoliOrderId: String(order.id),
          sejoliProductId: order.product_id ? String(order.product_id) : null
        }
      })
      
      // Update user role if active
      if (isActive) {
        await prisma.user.update({
          where: { id: eksporyukUserId },
          data: { role: 'MEMBER_PREMIUM' }
        })
      }
      
      stats.memberships.created++
      
    } catch (error) {
      stats.memberships.failed++
      stats.errors.push({
        type: 'membership',
        identifier: `Order #${order.id}`,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.memberships.created}`)
  console.log(`   ⏭️  Skipped: ${stats.memberships.skipped}`)
  console.log(`   ❌ Failed: ${stats.memberships.failed}`)
}

async function importCommissions(commissions, affiliates) {
  if (!commissions || commissions.length === 0) {
    console.log('   ⚠️ No commissions to import')
    return
  }
  
  console.log(`\n   Importing ${commissions.length} commission records...\n`)
  
  // Build affiliate_id to profile map
  const affiliateProfileMap = new Map()
  for (const aff of affiliates) {
    const userId = userIdMap.get(aff.user_id)
    if (userId) {
      const profile = await prisma.affiliateProfile.findUnique({
        where: { userId }
      })
      if (profile) {
        affiliateProfileMap.set(aff.user_id, profile.id)
      }
    }
  }
  
  for (const comm of commissions) {
    try {
      // Get affiliate profile
      const affiliateProfileId = affiliateProfileMap.get(comm.affiliate_id)
      
      if (!affiliateProfileId) {
        stats.commissions.skipped++
        continue
      }
      
      // Check if commission already exists
      const externalOrderId = `SEJOLI-${comm.order_id}`
      const existing = await prisma.affiliateConversion.findFirst({
        where: {
          affiliateId: affiliateProfileId,
          orderId: externalOrderId
        }
      })
      
      if (existing) {
        stats.commissions.skipped++
        continue
      }
      
      // Find transaction
      const transaction = await prisma.transaction.findFirst({
        where: { externalId: externalOrderId }
      })
      
      // Create commission record
      await prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliateProfileId,
          transactionId: transaction?.id,
          
          orderId: externalOrderId,
          orderAmount: 0, // Not available in data
          commissionAmount: parseFloat(comm.amount || 0),
          commissionRate: 30, // Default rate
          
          status: comm.paid_status === 1 ? 'PAID' : 'PENDING',
          paidOut: comm.paid_status === 1,
          paidOutAt: comm.paid_status === 1 ? new Date(comm.updated_at) : null,
          
          createdAt: new Date(comm.created_at)
        }
      })
      
      stats.commissions.created++
      
    } catch (error) {
      stats.commissions.failed++
      stats.errors.push({
        type: 'commission',
        identifier: `Commission #${comm.id}`,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.commissions.created}`)
  console.log(`   ⏭️  Skipped: ${stats.commissions.skipped}`)
  console.log(`   ❌ Failed: ${stats.commissions.failed}`)
}

function printSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 FINAL MIGRATION SUMMARY')
  console.log('='.repeat(70))
  
  console.log('\n📈 RESULTS:')
  console.log(`   👤 Users:        ${stats.users.created} created, ${stats.users.skipped} skipped, ${stats.users.failed} failed`)
  console.log(`   🔗 Affiliates:   ${stats.affiliates.created} created, ${stats.affiliates.skipped} skipped, ${stats.affiliates.failed} failed`)
  console.log(`   💳 Transactions: ${stats.transactions.created} created, ${stats.transactions.skipped} skipped, ${stats.transactions.failed} failed`)
  console.log(`   🎫 Memberships:  ${stats.memberships.created} created, ${stats.memberships.skipped} skipped, ${stats.memberships.failed} failed`)
  console.log(`   💰 Commissions:  ${stats.commissions.created} created, ${stats.commissions.skipped} skipped, ${stats.commissions.failed} failed`)
  
  const totalCreated = stats.users.created + stats.affiliates.created + 
                       stats.transactions.created + stats.memberships.created + 
                       stats.commissions.created
  const totalFailed = stats.users.failed + stats.affiliates.failed + 
                      stats.transactions.failed + stats.memberships.failed + 
                      stats.commissions.failed
  
  console.log(`\n   📊 TOTAL: ${totalCreated} records created, ${totalFailed} failed`)
  
  if (stats.errors.length > 0 && stats.errors.length <= 10) {
    console.log(`\n❌ ERRORS (${stats.errors.length}):`)
    stats.errors.forEach(err => {
      console.log(`   - [${err.type}] ${err.identifier}: ${err.error.substring(0, 100)}`)
    })
  } else if (stats.errors.length > 10) {
    console.log(`\n❌ ${stats.errors.length} ERRORS (showing first 5):`)
    stats.errors.slice(0, 5).forEach(err => {
      console.log(`   - [${err.type}] ${err.identifier}: ${err.error.substring(0, 100)}`)
    })
  }
  
  console.log('\n' + '='.repeat(70))
  if (totalFailed === 0) {
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!')
  } else if (totalFailed < 10) {
    console.log(`✅ MIGRATION COMPLETED WITH ${totalFailed} MINOR ERRORS`)
  } else {
    console.log(`⚠️  MIGRATION COMPLETED WITH ${totalFailed} ERRORS`)
  }
  console.log('='.repeat(70) + '\n')
}

// Run
main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error)
  process.exit(1)
})
