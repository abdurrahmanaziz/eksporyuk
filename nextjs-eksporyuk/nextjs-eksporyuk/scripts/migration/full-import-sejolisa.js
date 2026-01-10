#!/usr/bin/env node
/**
 * FULL SEJOLI IMPORT - Users, Transactions, Memberships, Affiliates, Commissions
 * Run: node scripts/migration/full-import-sejolisa.js
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

// Product ID to Membership mapping
const PRODUCT_MEMBERSHIP_MAP = {
  // Map Sejoli product IDs to Eksporyuk membership IDs
  // Will be dynamically populated
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🚀 FULL SEJOLI → EKSPORYUK MIGRATION')
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
    console.log('')
  }
  
  // Build membership map
  await buildMembershipMap()
  
  // STEP 1: Import Users
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 1: IMPORTING USERS')
  console.log('='.repeat(70))
  await importUsers(data.users)
  
  // STEP 2: Import Affiliates
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 2: IMPORTING AFFILIATE PROFILES')
  console.log('='.repeat(70))
  await importAffiliates(data.affiliates || [])
  
  // STEP 3: Import Orders as Transactions
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 3: IMPORTING ORDERS → TRANSACTIONS')
  console.log('='.repeat(70))
  await importTransactions(data.orders)
  
  // STEP 4: Import Memberships
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 4: IMPORTING USER MEMBERSHIPS')
  console.log('='.repeat(70))
  await importMemberships(memberships)
  
  // STEP 5: Import Commissions
  console.log('\n' + '='.repeat(70))
  console.log('📥 STEP 5: IMPORTING AFFILIATE COMMISSIONS')
  console.log('='.repeat(70))
  await importCommissions(data.commissions || [])
  
  // Final Summary
  printSummary()
  
  await prisma.$disconnect()
}

async function buildMembershipMap() {
  // Get all memberships from Eksporyuk
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true }
  })
  
  console.log('📋 Available Memberships in Eksporyuk:')
  memberships.forEach(m => {
    console.log(`   - ${m.name} (${m.id})`)
  })
  console.log('')
  
  // Default mapping (adjust based on actual Sejoli products)
  // You may need to manually map product_ids to membership_ids
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
      const existing = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existing) {
        if (SKIP_EXISTING) {
          stats.users.skipped++
          continue
        }
      }
      
      // Map role
      let role = 'MEMBER_FREE'
      if (wpUser.role === 'administrator') role = 'ADMIN'
      else if (wpUser.role === 'editor') role = 'MENTOR'
      else if (wpUser.affiliate_code) role = 'AFFILIATE'
      
      // Generate username
      const username = wpUser.user_login || email.split('@')[0]
      
      if (existing) {
        // Update existing user
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: wpUser.display_name || wpUser.first_name || username,
            phone: wpUser.phone || existing.phone,
            whatsapp: wpUser.phone || existing.whatsapp
          }
        })
        
        // Ensure wallet exists
        await prisma.wallet.upsert({
          where: { userId: existing.id },
          create: { userId: existing.id, balance: 0, balancePending: 0 },
          update: {}
        })
        
        stats.users.skipped++
      } else {
        // Create new user
        const user = await prisma.user.create({
          data: {
            email,
            username: await generateUniqueUsername(username),
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
        
        // Create wallet
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            balancePending: 0
          }
        })
        
        stats.users.created++
      }
      
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
}

async function generateUniqueUsername(base) {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '')
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
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: aff.user_email }
      })
      
      if (!user) {
        stats.affiliates.skipped++
        continue
      }
      
      // Check if affiliate exists
      const existing = await prisma.affiliateProfile.findUnique({
        where: { userId: user.id }
      })
      
      if (existing) {
        // Update existing
        await prisma.affiliateProfile.update({
          where: { userId: user.id },
          data: {
            totalReferrals: aff.total_referrals || 0,
            totalEarnings: aff.total_commission || 0
          }
        })
        
        stats.affiliates.skipped++
      } else {
        // Create new affiliate
        await prisma.affiliateProfile.create({
          data: {
            userId: user.id,
            affiliateCode: aff.affiliate_code || `AFF${user.id.slice(-6)}`,
            status: 'ACTIVE',
            tier: 1,
            commissionRate: 30,
            totalClicks: 0,
            totalReferrals: aff.total_referrals || 0,
            totalEarnings: aff.total_commission || 0,
            isActive: true
          }
        })
        
        // Update wallet balance
        if (aff.paid_commission > 0 || aff.pending_commission > 0) {
          await prisma.wallet.update({
            where: { userId: user.id },
            data: {
              balance: aff.paid_commission || 0,
              balancePending: aff.pending_commission || 0
            }
          })
        }
        
        stats.affiliates.created++
      }
      
    } catch (error) {
      stats.affiliates.failed++
      stats.errors.push({
        type: 'affiliate',
        identifier: aff.user_email,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.affiliates.created}`)
  console.log(`   ⏭️  Skipped: ${stats.affiliates.skipped}`)
  console.log(`   ❌ Failed: ${stats.affiliates.failed}`)
}

async function importTransactions(orders) {
  if (!orders || orders.length === 0) {
    console.log('   ⚠️ No orders to import')
    return
  }
  
  console.log(`\n   Importing ${orders.length} orders as transactions...\n`)
  
  for (const order of orders) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: order.user_email }
      })
      
      if (!user) {
        stats.transactions.skipped++
        continue
      }
      
      // Check if transaction already exists (by externalId)
      const externalId = `SEJOLI-${order.ID || order.order_id}`
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
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'MEMBERSHIP',
          status,
          amount: parseFloat(order.grand_total || order.total || 0),
          
          customerName: order.buyer_name || user.name,
          customerEmail: order.buyer_email || user.email,
          customerPhone: order.buyer_phone || user.phone,
          customerWhatsapp: order.buyer_whatsapp || user.whatsapp,
          
          description: `Import from Sejoli: ${order.product_name || 'Product'}`,
          paymentMethod: order.payment_method || 'SEJOLI',
          paymentProvider: 'SEJOLI',
          externalId,
          
          paidAt: status === 'COMPLETED' ? new Date(order.created_at || order.order_date) : null,
          createdAt: new Date(order.created_at || order.order_date)
        }
      })
      
      stats.transactions.created++
      
    } catch (error) {
      stats.transactions.failed++
      stats.errors.push({
        type: 'transaction',
        identifier: order.order_id || order.ID,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.transactions.created}`)
  console.log(`   ⏭️  Skipped: ${stats.transactions.skipped}`)
  console.log(`   ❌ Failed: ${stats.transactions.failed}`)
}

async function importMemberships(memberships) {
  if (!memberships || memberships.length === 0) {
    console.log('   ⚠️ No memberships to import')
    return
  }
  
  console.log(`\n   Importing ${memberships.length} memberships...\n`)
  
  // Get default membership
  const defaultMembership = await prisma.membership.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'asc' }
  })
  
  if (!defaultMembership) {
    console.log('   ❌ No published membership found in system')
    return
  }
  
  for (const mem of memberships) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: mem.user_email }
      })
      
      if (!user) {
        stats.memberships.skipped++
        continue
      }
      
      // Check if membership exists for this user
      const existing = await prisma.userMembership.findFirst({
        where: {
          userId: user.id
        }
      })
      
      if (existing) {
        stats.memberships.skipped++
        continue
      }
      
      // Determine membership status
      const now = new Date()
      const endDate = mem.expired_date ? new Date(mem.expired_date) : null
      const isActive = mem.status === 'active' && (!endDate || endDate > now)
      
      // Create user membership
      await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId: defaultMembership.id,
          startDate: new Date(mem.created_at || mem.start_date),
          endDate: endDate,
          isActive,
          status: isActive ? 'ACTIVE' : 'EXPIRED',
          activatedAt: new Date(mem.created_at || mem.start_date),
          price: parseFloat(mem.price || 0),
          source: 'SEJOLI',
          sejoliOrderId: mem.order_id ? String(mem.order_id) : null,
          sejoliProductId: mem.product_id ? String(mem.product_id) : null
        }
      })
      
      // Update user role if active
      if (isActive && user.role === 'MEMBER_FREE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'MEMBER_PREMIUM' }
        })
      }
      
      stats.memberships.created++
      
    } catch (error) {
      stats.memberships.failed++
      stats.errors.push({
        type: 'membership',
        identifier: mem.user_email,
        error: error.message
      })
    }
  }
  
  console.log(`   ✅ Created: ${stats.memberships.created}`)
  console.log(`   ⏭️  Skipped: ${stats.memberships.skipped}`)
  console.log(`   ❌ Failed: ${stats.memberships.failed}`)
}

async function importCommissions(commissions) {
  if (!commissions || commissions.length === 0) {
    console.log('   ⚠️ No commissions to import')
    return
  }
  
  console.log(`\n   Importing ${commissions.length} commission records...\n`)
  
  for (const comm of commissions) {
    try {
      // Find affiliate user
      const affiliateUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: comm.affiliate_user_id ? String(comm.affiliate_user_id) : undefined },
            { email: comm.affiliate_email }
          ].filter(Boolean)
        },
        include: { affiliateProfile: true }
      })
      
      if (!affiliateUser?.affiliateProfile) {
        stats.commissions.skipped++
        continue
      }
      
      // Find transaction
      const externalId = `SEJOLI-${comm.order_id}`
      const transaction = await prisma.transaction.findFirst({
        where: { externalId }
      })
      
      // Check if commission already exists
      const existing = await prisma.affiliateConversion.findFirst({
        where: {
          affiliateId: affiliateUser.affiliateProfile.id,
          orderId: externalId
        }
      })
      
      if (existing) {
        stats.commissions.skipped++
        continue
      }
      
      // Create commission record
      await prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliateUser.affiliateProfile.id,
          transactionId: transaction?.id,
          
          orderId: externalId,
          orderAmount: parseFloat(comm.order_total || 0),
          commissionAmount: parseFloat(comm.commission_amount || comm.amount || 0),
          commissionRate: parseFloat(comm.commission_rate || 30),
          
          status: comm.status === 'paid' ? 'PAID' : 'PENDING',
          paidOut: comm.status === 'paid',
          paidOutAt: comm.status === 'paid' ? new Date(comm.paid_date || comm.created_at) : null,
          
          createdAt: new Date(comm.created_at || new Date())
        }
      })
      
      stats.commissions.created++
      
    } catch (error) {
      stats.commissions.failed++
      stats.errors.push({
        type: 'commission',
        identifier: comm.order_id,
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
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ ERRORS (${stats.errors.length}):`)
    stats.errors.slice(0, 15).forEach(err => {
      console.log(`   - [${err.type}] ${err.identifier}: ${err.error}`)
    })
    if (stats.errors.length > 15) {
      console.log(`   ... and ${stats.errors.length - 15} more errors`)
    }
  }
  
  console.log('\n' + '='.repeat(70))
  if (totalFailed === 0) {
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!')
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
