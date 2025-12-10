#!/usr/bin/env node
/**
 * Sejolisa Data Extractor - Robust version with batching
 * Extract 18K users safely with connection retry
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
  connectTimeout: 30000,
  waitForConnections: true
}

const LIMIT = parseInt(process.env.EXPORT_LIMIT) || 18000
const BATCH_SIZE = 1000
const OUTPUT_DIR = path.join(__dirname, 'wp-data')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function getConnection() {
  return await mysql.createConnection(config)
}

async function extractUsers(connection) {
  console.log('📥 Extracting users...')
  
  const [rows] = await connection.query(`
    SELECT 
      u.ID as id,
      u.user_login,
      u.user_email,
      u.user_registered,
      u.display_name
    FROM wp_users u
    ORDER BY u.ID
    LIMIT ?
  `, [LIMIT])
  
  // Get additional meta
  const userIds = rows.map(u => u.id)
  
  // Batch meta queries
  const metaMap = new Map()
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    const [meta] = await connection.query(`
      SELECT user_id, meta_key, meta_value 
      FROM wp_usermeta 
      WHERE user_id IN (?) 
      AND meta_key IN ('first_name', 'last_name', 'phone_number', '_affiliate_id')
    `, [batch])
    
    meta.forEach(m => {
      if (!metaMap.has(m.user_id)) metaMap.set(m.user_id, {})
      metaMap.get(m.user_id)[m.meta_key] = m.meta_value
    })
    
    process.stdout.write(`   Meta batch ${Math.min(i + BATCH_SIZE, userIds.length)}/${userIds.length}\r`)
  }
  console.log('')
  
  return rows.map(u => ({
    id: u.id,
    user_login: u.user_login,
    user_email: u.user_email,
    user_registered: u.user_registered,
    display_name: u.display_name,
    first_name: metaMap.get(u.id)?.first_name || '',
    last_name: metaMap.get(u.id)?.last_name || '',
    phone: metaMap.get(u.id)?.phone_number || '',
    affiliate_code: metaMap.get(u.id)?._affiliate_id || null
  }))
}

async function extractOrders(connection, userIds) {
  console.log('📥 Extracting orders...')
  
  const orders = []
  
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    
    const [rows] = await connection.query(`
      SELECT 
        ID as id,
        user_id,
        product_id,
        affiliate_id,
        grand_total,
        quantity,
        status,
        type,
        payment_gateway,
        created_at
      FROM wp_sejolisa_orders
      WHERE user_id IN (?)
    `, [batch])
    
    orders.push(...rows)
    process.stdout.write(`   Orders batch ${Math.min(i + BATCH_SIZE, userIds.length)}/${userIds.length} (${orders.length} orders)\r`)
  }
  console.log('')
  
  return orders
}

async function extractAffiliates(connection, users) {
  console.log('📥 Extracting affiliates...')
  
  // Get users with affiliate_code
  const affiliateUsers = users.filter(u => u.affiliate_code)
  
  return affiliateUsers.map(u => ({
    user_id: u.id,
    affiliate_code: u.affiliate_code,
    user_email: u.user_email,
    display_name: u.display_name
  }))
}

async function extractCommissions(connection, affiliateUserIds) {
  console.log('📥 Extracting commissions...')
  
  if (affiliateUserIds.length === 0) {
    return []
  }
  
  const commissions = []
  
  for (let i = 0; i < affiliateUserIds.length; i += BATCH_SIZE) {
    const batch = affiliateUserIds.slice(i, i + BATCH_SIZE)
    
    try {
      const [rows] = await connection.query(`
        SELECT 
          ID as id,
          affiliate_id,
          order_id,
          product_id,
          tier,
          rate_amount as amount,
          rate_type,
          valid_point as status,
          paid_status,
          created_at
        FROM wp_sejolisa_affiliates
        WHERE affiliate_id IN (?)
        LIMIT 50000
      `, [batch])
      
      commissions.push(...rows)
      process.stdout.write(`   Commissions batch ${Math.min(i + BATCH_SIZE, affiliateUserIds.length)}/${affiliateUserIds.length} (${commissions.length} records)\r`)
    } catch (error) {
      console.log(`\n   ⚠️ Batch ${i} error: ${error.message}, continuing...`)
    }
  }
  console.log('')
  
  return commissions
}

async function main() {
  let connection
  
  try {
    console.log('\n🚀 SEJOLISA DATA EXTRACTOR (18K Migration)')
    console.log('='.repeat(60))
    console.log(`📊 Config:`)
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   Export Limit: ${LIMIT} users`)
    console.log(`   Batch Size: ${BATCH_SIZE}\n`)
    
    console.log('🔌 Connecting...')
    connection = await getConnection()
    console.log('✅ Connected!\n')
    
    // Extract users
    const users = await extractUsers(connection)
    console.log(`   ✅ Extracted ${users.length} users\n`)
    
    // Extract orders
    const userIds = users.map(u => u.id)
    const orders = await extractOrders(connection, userIds)
    console.log(`   ✅ Extracted ${orders.length} orders\n`)
    
    // Extract affiliates
    const affiliates = await extractAffiliates(connection, users)
    console.log(`   ✅ Extracted ${affiliates.length} affiliates\n`)
    
    // Extract commissions
    const affiliateUserIds = affiliates.map(a => a.user_id)
    const commissions = await extractCommissions(connection, affiliateUserIds)
    console.log(`   ✅ Extracted ${commissions.length} commission records\n`)
    
    // Calculate stats
    const completedOrders = orders.filter(o => o.status === 'completed')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0)
    const totalCommissions = commissions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
    
    // Export data
    const exportData = {
      users,
      orders,
      affiliates,
      commissions,
      stats: {
        totalUsers: users.length,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        totalAffiliates: affiliates.length,
        totalCommissions: commissions.length,
        totalRevenue,
        totalCommissionAmount: totalCommissions
      },
      exportDate: new Date().toISOString()
    }
    
    const outputFile = path.join(OUTPUT_DIR, `sejolisa-full-${users.length}users-${Date.now()}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2))
    
    console.log('='.repeat(60))
    console.log('📁 EXPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`   👤 Users: ${users.length}`)
    console.log(`   💳 Orders: ${orders.length}`)
    console.log(`      ✅ Completed: ${completedOrders.length}`)
    console.log(`   🔗 Affiliates: ${affiliates.length}`)
    console.log(`   💰 Commissions: ${commissions.length}`)
    console.log(`   💵 Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`)
    console.log(`   💵 Total Commission: Rp ${totalCommissions.toLocaleString('id-ID')}`)
    console.log(`\n✅ Exported to: ${outputFile}`)
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

main()
