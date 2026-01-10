/**
 * WordPress Sejoli Data Extractor
 * Extract users, memberships, commissions dari Sejoli WordPress
 */

const mysql = require('mysql2/promise')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

// Configuration dari .env
const config = {
  host: process.env.WP_DB_HOST,
  port: process.env.WP_DB_PORT || 3306,
  user: process.env.WP_DB_USER,
  password: process.env.WP_DB_PASSWORD,
  database: process.env.WP_DB_NAME,
  prefix: process.env.WP_TABLE_PREFIX || 'wp_',
  limit: parseInt(process.env.MIGRATION_LIMIT) || 100
}

async function extractSejoliData() {
  console.log('🔍 SEJOLI WORDPRESS DATA EXTRACTOR\n')
  console.log('Configuration:')
  console.log(`  Host: ${config.host}`)
  console.log(`  Database: ${config.database}`)
  console.log(`  Limit: ${config.limit} users\n`)

  let connection

  try {
    // Connect to WordPress database
    console.log('📡 Connecting to WordPress database...')
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database
    })
    console.log('✅ Connected!\n')

    // Test connection
    const [testResult] = await connection.execute('SELECT 1 as test')
    if (testResult[0].test !== 1) {
      throw new Error('Database connection test failed')
    }

    const extractedData = {
      metadata: {
        extractedAt: new Date().toISOString(),
        source: 'WordPress Sejoli',
        totalUsers: 0,
        totalMemberships: 0,
        totalCommissions: 0,
        totalRevenue: 0
      },
      users: [],
      memberships: [],
      commissions: [],
      affiliates: []
    }

    // ============================================
    // 1. EXTRACT USERS
    // ============================================
    console.log('👥 Extracting Users...')
    
    const [users] = await connection.execute(`
      SELECT 
        u.ID,
        u.user_email,
        u.user_login,
        u.display_name,
        u.user_registered,
        (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'first_name' LIMIT 1) as first_name,
        (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'last_name' LIMIT 1) as last_name,
        (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = '${config.prefix}capabilities' LIMIT 1) as capabilities,
        (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'billing_phone' LIMIT 1) as phone,
        (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'sejoli_whatsapp' LIMIT 1) as whatsapp
      FROM ${config.prefix}users u
      ORDER BY u.ID ASC
      LIMIT ?
    `, [config.limit])

    console.log(`   Found ${users.length} users`)

    // Process each user
    for (const user of users) {
      // Parse role dari capabilities
      let role = 'free_member'
      if (user.capabilities) {
        try {
          const caps = JSON.parse(user.capabilities)
          if (caps.sejoli_affiliate || caps.affiliate) {
            role = 'affiliate'
          } else if (caps.sejoli_member_premium || caps.premium_member) {
            role = 'premium_member'
          }
        } catch (e) {
          // capabilities bukan JSON, check string
          if (user.capabilities.includes('affiliate')) {
            role = 'affiliate'
          } else if (user.capabilities.includes('premium')) {
            role = 'premium_member'
          }
        }
      }

      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.display_name

      extractedData.users.push({
        wp_id: user.ID,
        email: user.user_email,
        username: user.user_login,
        name: fullName,
        role: role,
        phone: user.phone || null,
        whatsapp: user.whatsapp || user.phone || null,
        registered_date: user.user_registered
      })
    }

    extractedData.metadata.totalUsers = users.length

    // ============================================
    // 2. EXTRACT MEMBERSHIPS (Sejoli Orders)
    // ============================================
    console.log('💳 Extracting Memberships (Sejoli Orders)...')
    
    try {
      const [orders] = await connection.execute(`
        SELECT 
          o.ID,
          o.user_id,
          o.order_id,
          o.product_id,
          o.grand_total,
          o.status,
          o.payment_info,
          o.created_at,
          o.payment_gateway,
          o.affiliate_id,
          (SELECT post_title FROM ${config.prefix}posts WHERE ID = o.product_id) as product_name,
          (SELECT meta_value FROM ${config.prefix}postmeta WHERE post_id = o.product_id AND meta_key = '_sejoli_product_type' LIMIT 1) as product_type
        FROM ${config.prefix}sejoli_order o
        WHERE o.user_id IN (${users.map(u => u.ID).join(',')})
        AND o.status IN ('completed', 'on-hold', 'on-progress')
        ORDER BY o.created_at DESC
      `)

      console.log(`   Found ${orders.length} orders`)

      for (const order of orders) {
        extractedData.memberships.push({
          wp_order_id: order.ID,
          wp_user_id: order.user_id,
          product_name: order.product_name,
          product_type: order.product_type,
          amount: parseFloat(order.grand_total) || 0,
          status: order.status,
          payment_method: order.payment_gateway,
          affiliate_id: order.affiliate_id,
          created_at: order.created_at
        })

        extractedData.metadata.totalRevenue += parseFloat(order.grand_total) || 0
      }

      extractedData.metadata.totalMemberships = orders.length

    } catch (error) {
      console.log(`   ⚠️ Warning: Could not extract orders - ${error.message}`)
      console.log('   → Check if wp_sejoli_order table exists')
    }

    // ============================================
    // 3. EXTRACT AFFILIATE DATA
    // ============================================
    console.log('🤝 Extracting Affiliate Data...')
    
    try {
      const [affiliates] = await connection.execute(`
        SELECT 
          user_id,
          (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'sejoli_affiliate_id' LIMIT 1) as affiliate_code,
          (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'sejoli_affiliate_balance' LIMIT 1) as balance,
          (SELECT meta_value FROM ${config.prefix}usermeta WHERE user_id = u.ID AND meta_key = 'sejoli_affiliate_total_commission' LIMIT 1) as total_commission
        FROM ${config.prefix}users u
        WHERE u.ID IN (${users.map(u => u.ID).join(',')})
        AND EXISTS (
          SELECT 1 FROM ${config.prefix}usermeta 
          WHERE user_id = u.ID 
          AND meta_key = 'sejoli_affiliate_id'
        )
      `)

      console.log(`   Found ${affiliates.length} affiliates`)

      for (const affiliate of affiliates) {
        extractedData.affiliates.push({
          wp_user_id: affiliate.user_id,
          affiliate_code: affiliate.affiliate_code || `AFF${affiliate.user_id}`,
          balance: parseFloat(affiliate.balance) || 0,
          total_commission: parseFloat(affiliate.total_commission) || 0
        })
      }

    } catch (error) {
      console.log(`   ⚠️ Warning: Could not extract affiliates - ${error.message}`)
    }

    // ============================================
    // 4. EXTRACT COMMISSIONS
    // ============================================
    console.log('💰 Extracting Commission History...')
    
    try {
      const [commissions] = await connection.execute(`
        SELECT 
          c.ID,
          c.affiliate_id,
          c.order_id,
          c.product_id,
          c.commission_value,
          c.commission_type,
          c.status,
          c.created_at,
          (SELECT order_id FROM ${config.prefix}sejoli_order WHERE ID = c.order_id LIMIT 1) as order_number
        FROM ${config.prefix}sejoli_affiliate_commission c
        WHERE c.affiliate_id IN (${users.map(u => u.ID).join(',')})
        ORDER BY c.created_at DESC
        LIMIT 500
      `)

      console.log(`   Found ${commissions.length} commission records`)

      for (const comm of commissions) {
        extractedData.commissions.push({
          wp_commission_id: comm.ID,
          wp_affiliate_id: comm.affiliate_id,
          wp_order_id: comm.order_id,
          order_number: comm.order_number,
          amount: parseFloat(comm.commission_value) || 0,
          type: comm.commission_type,
          status: comm.status,
          created_at: comm.created_at
        })

        extractedData.metadata.totalCommissions += parseFloat(comm.commission_value) || 0
      }

    } catch (error) {
      console.log(`   ⚠️ Warning: Could not extract commissions - ${error.message}`)
    }

    // ============================================
    // SAVE TO FILE
    // ============================================
    console.log('\n💾 Saving extracted data...')
    
    const outputDir = path.join(__dirname, 'extracted-data')
    await fs.mkdir(outputDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputFile = path.join(outputDir, `sejoli-data-${timestamp}.json`)

    await fs.writeFile(
      outputFile,
      JSON.stringify(extractedData, null, 2)
    )

    console.log(`✅ Data saved to: ${outputFile}`)

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 EXTRACTION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Users:        ${extractedData.metadata.totalUsers}`)
    console.log(`Total Memberships:  ${extractedData.metadata.totalMemberships}`)
    console.log(`Total Affiliates:   ${extractedData.affiliates.length}`)
    console.log(`Total Commissions:  ${extractedData.commissions.length}`)
    console.log(`Total Revenue:      Rp ${extractedData.metadata.totalRevenue.toLocaleString()}`)
    console.log(`Total Commission:   Rp ${extractedData.metadata.totalCommissions.toLocaleString()}`)
    console.log('='.repeat(60))

    console.log('\n🎉 Extraction completed successfully!')
    console.log(`\n📁 Next step: Run import script with:\n   node 2-import-to-eksporyuk.js ${outputFile}`)

    return outputFile

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\nFull error:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Database connection closed')
    }
  }
}

// Run extraction
if (require.main === module) {
  extractSejoliData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { extractSejoliData }
