#!/usr/bin/env node
/**
 * Extract Sejoli Membership/Subscription Data
 * Maps product_id to duration type and calculates remaining days
 */

require('dotenv').config({ path: '.env.wp' })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

const config = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT) || 3306,
  user: process.env.WP_DB_USER,
  password: process.env.WP_DB_PASSWORD,
  database: process.env.WP_DB_NAME
}

const LIMIT = parseInt(process.env.EXPORT_LIMIT) || 100
const OUTPUT_DIR = path.join(__dirname, 'wp-data')

// Product ID to Duration Mapping (from real data analysis)
const PRODUCT_DURATION_MAP = {
  // Lifetime Products
  8910: { type: 'LIFETIME', duration: null, name: 'Re Kelas Ekspor Lifetime' },
  28: { type: 'LIFETIME', duration: null, name: 'Eksporyuk Legacy' },
  179: { type: 'LIFETIME', duration: null, name: 'Kelas Eksporyuk Legacy' },
  
  // 12 Month Products
  8915: { type: '12_MONTH', duration: 365, name: 'Re Kelas 12 Bulan Ekspor Yuk' },
  8683: { type: '12_MONTH', duration: 365, name: 'Kelas Ekspor Yuk 12 Bulan' },
  13399: { type: '12_MONTH', duration: 365, name: 'Paket Ekspor Yuk 12 Bulan' },
  
  // 6 Month Products
  8914: { type: '6_MONTH', duration: 180, name: 'Re Kelas 6 Bulan Ekspor Yuk' },
  8684: { type: '6_MONTH', duration: 180, name: 'Kelas Ekspor Yuk 6 Bulan' },
  13400: { type: '6_MONTH', duration: 180, name: 'Paket Ekspor Yuk 6 Bulan' },
  
  // Other Products (treat as custom/unknown)
  300: { type: 'CUSTOM', duration: null, name: 'Kelas Ekspor Gratis' },
  93: { type: 'CUSTOM', duration: null, name: 'Eksporyuk Prelaunch' }
}

async function main() {
  let connection
  
  try {
    console.log('\n🚀 SEJOLI MEMBERSHIP EXTRACTOR')
    console.log('='.repeat(60))
    console.log(`📊 Config:`)
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   Limit: ${LIMIT} users\n`)
    
    connection = await mysql.createConnection(config)
    console.log('✅ Connected!\n')
    
    // Get user IDs (first N users)
    console.log(`📥 Getting ${LIMIT} users...`)
    const [users] = await connection.query(`
      SELECT ID as user_id, user_email, display_name
      FROM wp_users
      ORDER BY ID ASC
      LIMIT ?
    `, [LIMIT])
    console.log(`   ✅ Found ${users.length} users\n`)
    
    // Extract subscriptions for these users
    console.log('📥 Extracting subscriptions...')
    const userIds = users.map(u => u.user_id)
    const placeholders = userIds.map(() => '?').join(',')
    
    const [subscriptions] = await connection.query(`
      SELECT 
        ID,
        user_id,
        product_id,
        order_id,
        status,
        type,
        created_at,
        end_date,
        DATEDIFF(end_date, NOW()) as remaining_days
      FROM wp_sejolisa_subscriptions
      WHERE user_id IN (${placeholders})
      ORDER BY user_id, created_at DESC
    `, userIds)
    
    console.log(`   ✅ Found ${subscriptions.length} subscriptions\n`)
    
    // Enrich subscriptions with duration mapping
    const enrichedSubs = subscriptions.map(sub => {
      const productMap = PRODUCT_DURATION_MAP[sub.product_id] || {
        type: 'UNKNOWN',
        duration: null,
        name: `Unknown Product ${sub.product_id}`
      }
      
      const isActive = sub.status === 'active' && sub.remaining_days > 0
      const isExpiringSoon = sub.remaining_days > 0 && sub.remaining_days <= 30
      
      return {
        ...sub,
        duration_type: productMap.type,
        duration_days: productMap.duration,
        product_name: productMap.name,
        is_active: isActive,
        is_expiring_soon: isExpiringSoon,
        created_at: sub.created_at,
        end_date: sub.end_date
      }
    })
    
    // Group by user
    const userMemberships = users.map(user => {
      const userSubs = enrichedSubs.filter(s => s.user_id === user.user_id)
      
      // Get active subscription (priority: active > pending > expired)
      const activeSub = userSubs.find(s => s.is_active) || userSubs[0]
      
      return {
        user_id: user.user_id,
        user_email: user.user_email,
        display_name: user.display_name,
        subscriptions: userSubs,
        active_subscription: activeSub || null,
        has_membership: userSubs.length > 0,
        membership_status: activeSub?.is_active ? 'ACTIVE' : 
                          (activeSub?.remaining_days < 0 ? 'EXPIRED' : 'PENDING')
      }
    })
    
    // Statistics
    const stats = {
      total_users: users.length,
      users_with_membership: userMemberships.filter(u => u.has_membership).length,
      users_without_membership: userMemberships.filter(u => !u.has_membership).length,
      active_memberships: enrichedSubs.filter(s => s.is_active).length,
      expired_memberships: enrichedSubs.filter(s => s.status === 'expired').length,
      expiring_soon: enrichedSubs.filter(s => s.is_expiring_soon).length,
      by_duration: {
        lifetime: enrichedSubs.filter(s => s.duration_type === 'LIFETIME').length,
        twelve_month: enrichedSubs.filter(s => s.duration_type === '12_MONTH').length,
        six_month: enrichedSubs.filter(s => s.duration_type === '6_MONTH').length,
        custom: enrichedSubs.filter(s => s.duration_type === 'CUSTOM').length,
        unknown: enrichedSubs.filter(s => s.duration_type === 'UNKNOWN').length
      }
    }
    
    // Export data
    const exportData = {
      users: userMemberships,
      product_map: PRODUCT_DURATION_MAP,
      stats,
      exportDate: new Date().toISOString()
    }
    
    const outputFile = path.join(OUTPUT_DIR, `memberships-${LIMIT}users-${Date.now()}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2))
    
    // Summary
    console.log('='.repeat(60))
    console.log('📊 MEMBERSHIP SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Users: ${stats.total_users}`)
    console.log(`With Membership: ${stats.users_with_membership}`)
    console.log(`Without Membership: ${stats.users_without_membership}`)
    console.log(`\nSubscription Status:`)
    console.log(`  Active: ${stats.active_memberships}`)
    console.log(`  Expired: ${stats.expired_memberships}`)
    console.log(`  Expiring Soon (<30 days): ${stats.expiring_soon}`)
    console.log(`\nBy Duration Type:`)
    console.log(`  Lifetime: ${stats.by_duration.lifetime}`)
    console.log(`  12 Month: ${stats.by_duration.twelve_month}`)
    console.log(`  6 Month: ${stats.by_duration.six_month}`)
    console.log(`  Custom: ${stats.by_duration.custom}`)
    console.log(`  Unknown: ${stats.by_duration.unknown}`)
    console.log(`\n✅ Exported to: ${outputFile}`)
    
    // Sample active memberships
    console.log('\n📋 Sample Active Memberships:')
    const activeSamples = userMemberships
      .filter(u => u.active_subscription?.is_active)
      .slice(0, 5)
    
    activeSamples.forEach(u => {
      const sub = u.active_subscription
      console.log(`\n  ${u.user_email}`)
      console.log(`    Product: ${sub.product_name}`)
      console.log(`    Duration: ${sub.duration_type}`)
      console.log(`    Expires: ${new Date(sub.end_date).toLocaleDateString('id-ID')}`)
      console.log(`    Remaining: ${sub.remaining_days} days`)
    })
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    if (connection) await connection.end()
  }
}

main()
