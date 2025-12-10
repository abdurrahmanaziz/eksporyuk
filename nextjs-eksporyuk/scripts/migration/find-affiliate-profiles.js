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

async function findAffiliates() {
  let connection
  
  try {
    connection = await mysql.createConnection(config)
    
    // Check for affiliate meta keys in usermeta
    console.log('🔍 Checking usermeta for affiliate data...\n')
    const [metaKeys] = await connection.query(`
      SELECT DISTINCT meta_key, COUNT(*) as count
      FROM wp_usermeta
      WHERE meta_key LIKE '%affiliate%' OR meta_key LIKE '%sejoli%'
      GROUP BY meta_key
      ORDER BY count DESC
    `)
    
    console.log('Affiliate-related meta keys:')
    metaKeys.forEach(m => console.log(`  ${m.meta_key}: ${m.count} users`))
    
    // Check if there's a separate user/affiliate mapping
    console.log('\n🔍 Checking for users with affiliate_id in orders...\n')
    const [affiliateUsers] = await connection.query(`
      SELECT DISTINCT affiliate_id, COUNT(*) as order_count
      FROM wp_sejolisa_orders
      WHERE affiliate_id > 0
      GROUP BY affiliate_id
      ORDER BY order_count DESC
      LIMIT 20
    `)
    
    console.log(`Found ${affiliateUsers.length} users with affiliate sales:`)
    affiliateUsers.slice(0, 10).forEach(a => 
      console.log(`  User ID ${a.affiliate_id}: ${a.order_count} referral orders`)
    )
    
    // Get sample user data for an affiliate
    if (affiliateUsers.length > 0) {
      const sampleId = affiliateUsers[0].affiliate_id
      console.log(`\n📋 Sample affiliate user (ID: ${sampleId}):`)
      
      const [user] = await connection.query(`
        SELECT user_login, user_email, display_name
        FROM wp_users
        WHERE ID = ?
      `, [sampleId])
      
      const [meta] = await connection.query(`
        SELECT meta_key, meta_value
        FROM wp_usermeta
        WHERE user_id = ?
        AND (meta_key LIKE '%affiliate%' OR meta_key LIKE '%sejoli%' OR meta_key LIKE '%commission%')
      `, [sampleId])
      
      console.log('User:', user[0])
      console.log('Affiliate meta:')
      meta.forEach(m => console.log(`  ${m.meta_key}: ${m.meta_value}`))
      
      // Calculate their total commissions
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_sales,
          SUM(commission) as total_commission
        FROM wp_sejolisa_affiliates
        WHERE affiliate_id = ?
      `, [sampleId])
      
      console.log('Statistics:', stats[0])
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) await connection.end()
  }
}

findAffiliates()
