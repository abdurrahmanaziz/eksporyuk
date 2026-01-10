#!/usr/bin/env node
require('dotenv').config({ path: '.env.wp' })
const mysql = require('mysql2/promise')

const config = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT) || 3306,
  user: process.env.WP_DB_USER,
  password: process.env.WP_DB_PASSWORD,
  database: process.env.WP_DB_NAME
}

async function checkSubscriptions() {
  let connection
  
  try {
    console.log('🔍 Checking Sejoli Subscription & Membership Data...\n')
    
    connection = await mysql.createConnection(config)
    
    // 1. Check subscriptions table structure
    console.log('📋 Table: wp_sejolisa_subscriptions')
    console.log('='.repeat(60))
    const [subsCols] = await connection.query(`DESCRIBE wp_sejolisa_subscriptions`)
    console.log('Columns:', subsCols.map(c => `${c.Field} (${c.Type})`).join(', '))
    
    const [subsCount] = await connection.query(`SELECT COUNT(*) as total FROM wp_sejolisa_subscriptions`)
    console.log(`Total rows: ${subsCount[0].total}\n`)
    
    // Sample subscriptions
    const [sampleSubs] = await connection.query(`
      SELECT * FROM wp_sejolisa_subscriptions 
      WHERE status = 'active' OR status = 'on-hold'
      LIMIT 5
    `)
    console.log('Sample active subscriptions:')
    sampleSubs.forEach((sub, i) => {
      console.log(`\n${i+1}. User ID: ${sub.user_id}`)
      console.log(`   Product ID: ${sub.product_id}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Start: ${sub.start_date}`)
      console.log(`   End: ${sub.end_date}`)
      console.log(`   Next Bill: ${sub.next_payment_date || 'N/A'}`)
    })
    
    console.log('\n' + '='.repeat(60))
    
    // 2. Check products to map duration
    console.log('\n📦 Checking Products (for duration mapping)')
    console.log('='.repeat(60))
    
    const [products] = await connection.query(`
      SELECT 
        p.ID,
        p.post_title,
        p.post_status,
        pm1.meta_value as price,
        pm2.meta_value as duration_type,
        pm3.meta_value as duration_value
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_sejoli_price'
      LEFT JOIN wp_postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_sejoli_duration_type'
      LEFT JOIN wp_postmeta pm3 ON p.ID = pm3.post_id AND pm3.meta_key = '_sejoli_duration_value'
      WHERE p.post_type = 'sejoli-product'
      AND p.post_status = 'publish'
      ORDER BY p.ID
      LIMIT 20
    `)
    
    console.log(`Found ${products.length} products:\n`)
    products.forEach(p => {
      const duration = p.duration_type === 'limited' 
        ? `${p.duration_value} months` 
        : (p.duration_type || 'unknown')
      console.log(`- [${p.ID}] ${p.post_title} | Duration: ${duration} | Price: Rp ${parseInt(p.price || 0).toLocaleString()}`)
    })
    
    console.log('\n' + '='.repeat(60))
    
    // 3. Check user access in usermeta
    console.log('\n👤 Checking User Access (usermeta)')
    console.log('='.repeat(60))
    
    const [accessMeta] = await connection.query(`
      SELECT DISTINCT meta_key, COUNT(*) as count
      FROM wp_usermeta
      WHERE meta_key LIKE '%sejoli%access%'
      OR meta_key LIKE '%membership%'
      OR meta_key LIKE '%subscription%'
      GROUP BY meta_key
      ORDER BY count DESC
      LIMIT 20
    `)
    
    console.log('Membership/Access meta keys:')
    accessMeta.forEach(m => {
      console.log(`  ${m.meta_key}: ${m.count} users`)
    })
    
    // Sample user with subscription
    console.log('\n📋 Sample User with Active Subscription:')
    const [userWithSub] = await connection.query(`
      SELECT user_id, product_id, status, created_at, end_date
      FROM wp_sejolisa_subscriptions
      WHERE status = 'active'
      AND end_date > NOW()
      LIMIT 1
    `)
    
    if (userWithSub.length > 0) {
      const userId = userWithSub[0].user_id
      const productId = userWithSub[0].product_id
      
      console.log(`\nUser ID: ${userId}`)
      console.log(`Product ID: ${productId}`)
      console.log(`Created: ${userWithSub[0].created_at}`)
      console.log(`End: ${userWithSub[0].end_date}`)
      
      // Calculate remaining days
      const endDate = new Date(userWithSub[0].end_date)
      const now = new Date()
      const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      console.log(`Remaining: ${remainingDays} days`)
      
      // Check user meta for this product access
      const [userAccess] = await connection.query(`
        SELECT meta_key, meta_value
        FROM wp_usermeta
        WHERE user_id = ?
        AND (meta_key LIKE '%sejoli%product%${productId}%' 
             OR meta_key LIKE '%access%${productId}%')
      `, [userId])
      
      if (userAccess.length > 0) {
        console.log('\nUser access meta:')
        userAccess.forEach(m => {
          console.log(`  ${m.meta_key}: ${m.meta_value}`)
        })
      }
    }
    
    console.log('\n' + '='.repeat(60))
    
    // 4. Statistics
    console.log('\n📊 Subscription Statistics:')
    console.log('='.repeat(60))
    
    const [stats] = await connection.query(`
      SELECT 
        status,
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT product_id) as unique_products
      FROM wp_sejolisa_subscriptions
      GROUP BY status
      ORDER BY total DESC
    `)
    
    stats.forEach(s => {
      console.log(`${s.status}: ${s.total} subscriptions (${s.unique_users} users, ${s.unique_products} products)`)
    })
    
    // Active subscriptions by product
    console.log('\n📦 Active Subscriptions by Product:')
    const [activeSubs] = await connection.query(`
      SELECT 
        s.product_id,
        p.post_title,
        COUNT(*) as total,
        COUNT(CASE WHEN s.end_date > NOW() THEN 1 END) as still_valid
      FROM wp_sejolisa_subscriptions s
      LEFT JOIN wp_posts p ON s.product_id = p.ID
      WHERE s.status = 'active'
      GROUP BY s.product_id, p.post_title
      ORDER BY total DESC
      LIMIT 10
    `)
    
    activeSubs.forEach(s => {
      console.log(`  [${s.product_id}] ${s.post_title || 'Unknown'}: ${s.total} total (${s.still_valid} still valid)`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) await connection.end()
  }
}

checkSubscriptions()
