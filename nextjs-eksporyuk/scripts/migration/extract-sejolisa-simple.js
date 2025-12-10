#!/usr/bin/env node
/**
 * Sejolisa Data Extractor - Simplified for actual table structure
 * Extracts from wp_sejolisa_orders, wp_sejolisa_affiliates (commissions), and usermeta
 */

require('dotenv').config({ path: '.env.wp' })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// Configuration
const config = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT) || 3306,
  user: process.env.WP_DB_USER,
  password: process.env.WP_DB_PASSWORD,
  database: process.env.WP_DB_NAME,
  tablePrefix: process.env.WP_TABLE_PREFIX || 'wp_'
}

const LIMIT = parseInt(process.env.EXPORT_LIMIT) || 100
const OUTPUT_DIR = path.join(__dirname, 'wp-data')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function main() {
  let connection
  
  try {
    console.log('\n🚀 SEJOLISA DATA EXTRACTOR (Simplified)')
    console.log('='.repeat(50))
    console.log(`\n📊 Config:`)
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   Export Limit: ${LIMIT} users\n`)
    
    console.log('🔌 Connecting...')
    connection = await mysql.createConnection(config)
    console.log('✅ Connected!\n')
    
    // Extract users
    const users = await extractUsers(connection)
    console.log(`   \u2705 Extracted ${users.length} users\n`)
    
    // Extract orders
    const orders = await extractOrders(connection, users)
    console.log(`   \u2705 Extracted ${orders.length} orders\n`)
    
    // Extract affiliates (from usermeta _affiliate_id)
    const affiliates = await extractAffiliates(connection, users)
    console.log(`   \u2705 Extracted ${affiliates.length} affiliates\n`)
    
    // Extract commissions (from wp_sejolisa_affiliates)
    const commissions = await extractCommissions(connection, affiliates)
    console.log(`   \u2705 Extracted ${commissions.length} commission records\n`)
    
    // Calculate stats
    const totalEarnings = commissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
    const totalOrders = orders.length
    
    // Export data
    const exportData = {
      users,
      orders,
      affiliates,
      commissions,
      stats: {
        totalUsers: users.length,
        totalOrders,
        totalAffiliates: affiliates.length,
        totalCommissions: commissions.length,
        totalEarnings
      },
      exportDate: new Date().toISOString()
    }
    
    const outputFile = path.join(OUTPUT_DIR, `sejolisa-export-${LIMIT}users-${Date.now()}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2))
    
    console.log('='.repeat(50))
    console.log('📁 EXPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`   Users: ${users.length}`)
    console.log(`   Orders: ${orders.length}`)
    console.log(`   Affiliates: ${affiliates.length}`)
    console.log(`   Commissions: ${commissions.length}`)
    console.log(`   Total Earnings: Rp ${totalEarnings.toLocaleString('id-ID')}`)
    console.log(`\n✅ Exported to: ${outputFile}`)
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Connection closed')
    }
  }
}

async function extractUsers(connection) {
  console.log('📥 Extracting users...')
  
  const [users] = await connection.query(`
    SELECT 
      ID as id,
      user_login,
      user_email,
      user_registered,
      display_name
    FROM ${config.tablePrefix}users
    ORDER BY ID ASC
    LIMIT ?
  `, [LIMIT])
  
  // Get usermeta for each user
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  const [metaRows] = await connection.query(`
    SELECT user_id, meta_key, meta_value
    FROM ${config.tablePrefix}usermeta
    WHERE user_id IN (${placeholders})
    AND meta_key IN ('first_name', 'last_name', 'wp_capabilities', '_affiliate_id', 'billing_phone')
  `, userIds)
  
  // Merge meta into users
  const usersWithMeta = users.map(user => {
    const meta = metaRows.filter(m => m.user_id === user.id)
    const metaObj = {}
    meta.forEach(m => {
      metaObj[m.meta_key] = m.meta_value
    })
    
    // Determine role
    let role = 'subscriber'
    if (metaObj.wp_capabilities) {
      try {
        const caps = JSON.parse(metaObj.wp_capabilities) || {}
        if (caps.administrator) role = 'administrator'
        else if (caps.editor) role = 'editor'
        else if (caps.author) role = 'author'
        else if (caps.subscriber) role = 'subscriber'
      } catch {
        // PHP serialized format
        if (metaObj.wp_capabilities.includes('administrator')) role = 'administrator'
        else if (metaObj.wp_capabilities.includes('editor')) role = 'editor'
      }
    }
    
    return {
      ...user,
      first_name: metaObj.first_name || '',
      last_name: metaObj.last_name || '',
      phone: metaObj.billing_phone || '',
      role,
      affiliate_code: metaObj._affiliate_id || null
    }
  })
  
  return usersWithMeta
}

async function extractOrders(connection, users) {
  console.log('📥 Extracting orders...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  const [orders] = await connection.query(`
    SELECT 
      ID as id,
      user_id,
      product_id,
      affiliate_id,
      coupon_id,
      grand_total,
      quantity,
      status,
      type,
      payment_gateway,
      created_at,
      updated_at
    FROM ${config.tablePrefix}sejolisa_orders
    WHERE user_id IN (${placeholders})
    ORDER BY ID DESC
  `, userIds)
  
  return orders
}

async function extractAffiliates(connection, users) {
  console.log('📥 Extracting affiliate profiles...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  // Get users with _affiliate_id in usermeta
  const [affiliateMeta] = await connection.query(`
    SELECT user_id, meta_value as affiliate_code
    FROM ${config.tablePrefix}usermeta
    WHERE user_id IN (${placeholders})
    AND meta_key = '_affiliate_id'
  `, userIds)
  
  if (affiliateMeta.length === 0) {
    return []
  }
  
  // Get commission stats for each affiliate
  const affiliateIds = affiliateMeta.map(a => a.user_id)
  const affPlaceholders = affiliateIds.map(() => '?').join(',')
  
  const [stats] = await connection.query(`
    SELECT 
      affiliate_id,
      COUNT(*) as total_referrals,
      SUM(commission) as total_commission,
      SUM(CASE WHEN status = 'on-hold' THEN commission ELSE 0 END) as pending_commission,
      SUM(CASE WHEN paid_status = 1 THEN commission ELSE 0 END) as paid_commission
    FROM ${config.tablePrefix}sejolisa_affiliates
    WHERE affiliate_id IN (${affPlaceholders})
    GROUP BY affiliate_id
  `, affiliateIds)
  
  // Merge profile + stats
  const affiliates = affiliateMeta.map(aff => {
    const stat = stats.find(s => s.affiliate_id === aff.user_id) || {
      total_referrals: 0,
      total_commission: 0,
      pending_commission: 0,
      paid_commission: 0
    }
    
    const user = users.find(u => u.id === aff.user_id)
    
    return {
      user_id: aff.user_id,
      affiliate_code: aff.affiliate_code,
      user_email: user?.user_email || '',
      display_name: user?.display_name || '',
      total_referrals: stat.total_referrals,
      total_commission: parseFloat(stat.total_commission) || 0,
      pending_commission: parseFloat(stat.pending_commission) || 0,
      paid_commission: parseFloat(stat.paid_commission) || 0,
      status: 'active'
    }
  })
  
  return affiliates
}

async function extractCommissions(connection, affiliates) {
  console.log('📥 Extracting commission records...')
  
  if (affiliates.length === 0) {
    return []
  }
  
  const affiliateIds = affiliates.map(a => a.user_id)
  const placeholders = affiliateIds.map(() => '?').join(',')
  
  const [commissions] = await connection.query(`
    SELECT 
      ID as id,
      affiliate_id,
      order_id,
      product_id,
      tier,
      commission as amount,
      status,
      paid_status,
      created_at,
      updated_at
    FROM ${config.tablePrefix}sejolisa_affiliates
    WHERE affiliate_id IN (${placeholders})
    ORDER BY ID DESC
  `, affiliateIds)
  
  return commissions
}

main()
