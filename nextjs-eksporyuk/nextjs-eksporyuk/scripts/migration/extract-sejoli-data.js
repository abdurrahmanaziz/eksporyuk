/**
 * SEJOLI WORDPRESS DATA EXTRACTOR
 * ================================
 * Extract users, memberships, and affiliate data from Sejoli WordPress
 * 
 * Usage:
 *   node scripts/migration/extract-sejoli-data.js
 * 
 * Requirements:
 *   - MySQL2 package: npm install mysql2
 *   - .env.wp file with WordPress database credentials
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// Load WordPress DB credentials from .env.wp
require('dotenv').config({ path: path.join(__dirname, '../../.env.wp') })

const config = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT || '3306'),
  user: process.env.WP_DB_USER || 'root',
  password: process.env.WP_DB_PASSWORD || '',
  database: process.env.WP_DB_NAME || 'wordpress',
  tablePrefix: process.env.WP_TABLE_PREFIX || 'wp_'
}

// Export limits
const LIMIT = parseInt(process.env.EXPORT_LIMIT || '100')
const OUTPUT_DIR = path.join(__dirname, 'wp-data')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function main() {
  console.log('🚀 SEJOLI DATA EXTRACTOR')
  console.log('========================\n')
  console.log(`📊 Config:`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   Database: ${config.database}`)
  console.log(`   Table Prefix: ${config.tablePrefix}`)
  console.log(`   Export Limit: ${LIMIT} users\n`)

  let connection

  try {
    // Connect to WordPress database
    console.log('🔌 Connecting to WordPress database...')
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database
    })
    console.log('✅ Connected!\n')

    // 1. Extract Users
    const users = await extractUsers(connection)
    
    // 2. Extract User Meta
    const userMeta = await extractUserMeta(connection, users)
    
    // 3. Extract Sejoli Orders (Memberships)
    const orders = await extractSejoliOrders(connection, users)
    
    // 4. Extract Affiliate Data
    const affiliates = await extractAffiliateData(connection, users)
    
    // 5. Extract Commissions
    const commissions = await extractCommissions(connection, users)

    // Combine all data
    const exportData = combineData(users, userMeta, orders, affiliates, commissions)

    // Save to JSON
    const outputFile = path.join(OUTPUT_DIR, `sejoli-export-${LIMIT}-users-${Date.now()}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2))
    
    console.log('\n' + '='.repeat(50))
    console.log('📁 EXPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`   Users: ${exportData.users.length}`)
    console.log(`   Orders: ${exportData.orders.length}`)
    console.log(`   Affiliates: ${exportData.affiliates.length}`)
    console.log(`   Commissions: ${exportData.commissions.length}`)
    console.log(`   Total Earnings: Rp ${exportData.stats.totalEarnings.toLocaleString()}`)
    console.log(`\n✅ Data exported to: ${outputFile}`)

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:')
      console.log('   - Pastikan MySQL server running')
      console.log('   - Check host/port di .env.wp')
      console.log('   - Jika remote server, pastikan firewall allow port 3306')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Tips:')
      console.log('   - Check username/password di .env.wp')
      console.log('   - Pastikan user punya akses ke database')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Tips:')
      console.log('   - Database tidak ditemukan')
      console.log('   - Check WP_DB_NAME di .env.wp')
    }
    
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Database connection closed')
    }
  }
}

async function extractUsers(connection) {
  console.log(`📥 Extracting users (limit: ${LIMIT})...`)
  
  const [rows] = await connection.query(`
    SELECT 
      ID as id,
      user_login as username,
      user_email as email,
      user_nicename as nicename,
      display_name as name,
      user_registered as registered_at,
      user_status as status
    FROM ${config.tablePrefix}users
    ORDER BY ID ASC
    LIMIT ?
  `, [LIMIT])
  
  console.log(`   ✅ Found ${rows.length} users`)
  return rows
}

async function extractUserMeta(connection, users) {
  if (users.length === 0) return {}
  
  console.log('📥 Extracting user metadata...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  const metaKeys = [
    'first_name',
    'last_name', 
    'nickname',
    'billing_phone',
    'billing_email',
    'billing_first_name',
    'billing_last_name',
    'billing_address_1',
    'billing_city',
    'billing_state',
    'billing_postcode',
    'wp_capabilities',
    'sejoli_affiliate_id',
    'sejoli_affiliate_code',
    'sejoli_affiliate_active',
    'sejoli_wallet_balance',
    'sejoli_total_commission'
  ]
  
  const [rows] = await connection.query(`
    SELECT 
      user_id,
      meta_key,
      meta_value
    FROM ${config.tablePrefix}usermeta
    WHERE user_id IN (${placeholders})
    AND meta_key IN (${metaKeys.map(() => '?').join(',')})
  `, [...userIds, ...metaKeys])
  
  // Group meta by user_id
  const userMeta = {}
  for (const row of rows) {
    if (!userMeta[row.user_id]) {
      userMeta[row.user_id] = {}
    }
    userMeta[row.user_id][row.meta_key] = row.meta_value
  }
  
  console.log(`   ✅ Found metadata for ${Object.keys(userMeta).length} users`)
  return userMeta
}

async function extractSejoliOrders(connection, users) {
  if (users.length === 0) return []
  
  console.log('📥 Extracting Sejoli orders...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  // Try different table names (Sejoli versions vary)
  const tableNames = [
    `${config.tablePrefix}sejoli_orders`,
    `${config.tablePrefix}sejolisa_orders`,
    `${config.tablePrefix}posts` // WooCommerce fallback
  ]
  
  for (const tableName of tableNames) {
    try {
      // Check if table exists
      const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [tableName.replace(config.tablePrefix, '')])
      
      if (tables.length === 0) continue
      
      if (tableName.includes('posts')) {
        // WooCommerce orders stored in wp_posts
        const [rows] = await connection.query(`
          SELECT 
            p.ID as id,
            p.post_author as user_id,
            p.post_date as order_date,
            p.post_status as status,
            pm1.meta_value as order_total,
            pm2.meta_value as product_id
          FROM ${config.tablePrefix}posts p
          LEFT JOIN ${config.tablePrefix}postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_order_total'
          LEFT JOIN ${config.tablePrefix}postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_product_id'
          WHERE p.post_type = 'shop_order'
          AND p.post_author IN (${placeholders})
          ORDER BY p.ID DESC
        `, userIds)
        
        console.log(`   ✅ Found ${rows.length} orders (WooCommerce)`)
        return rows
      } else {
        // Sejoli native orders table
        const [rows] = await connection.query(`
          SELECT 
            ID as id,
            user_id,
            product_id,
            created_at as order_date,
            status,
            grand_total as order_total,
            affiliate_id,
            coupon_id,
            payment_gateway,
            quantity,
            type
          FROM ${tableName}
          WHERE user_id IN (${placeholders})
          ORDER BY ID DESC
        `, userIds)
        
        console.log(`   ✅ Found ${rows.length} orders (Sejoli: ${tableName})`)
        return rows
      }
    } catch (err) {
      // Table doesn't exist or query error, try next
      continue
    }
  }
  
  console.log('   ⚠️ No orders table found')
  return []
}

async function extractAffiliateData(connection, users) {
  if (users.length === 0) return []
  
  console.log('📥 Extracting affiliate data...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  // Sejolisa stores affiliate profiles in usermeta with key '_affiliate_id'
  // wp_sejolisa_affiliates is commission records, not profiles
  try {
    // Get users with affiliate_id from usermeta
    const [affiliates] = await connection.query(`
      SELECT 
        user_id,
        meta_value as affiliate_code
      FROM ${config.tablePrefix}usermeta
      WHERE user_id IN (${placeholders})
      AND meta_key = '_affiliate_id'
    `, userIds)
    
    if (affiliates.length === 0) {
      console.log('   ⚠️ No affiliates found in usermeta')
      return []
    }
    
    // Enrich with commission stats from wp_sejolisa_affiliates
    const affiliateIds = affiliates.map(a => a.user_id)
    const affPlaceholders = affiliateIds.map(() => '?').join(',')
    
    const [stats] = await connection.query(`
      SELECT 
        affiliate_id as user_id,
        COUNT(*) as total_sales,
        SUM(commission) as total_commission,
        SUM(CASE WHEN status = 'on-hold' THEN commission ELSE 0 END) as pending_commission,
        SUM(CASE WHEN paid_status = 1 THEN commission ELSE 0 END) as paid_commission
      FROM ${config.tablePrefix}sejolisa_affiliates
      WHERE affiliate_id IN (${affPlaceholders})
      GROUP BY affiliate_id
    `, affiliateIds)
      
      console.log(`   ✅ Found ${rows.length} affiliates`)
      return rows
    } catch (err) {
      continue
    }
  }
  
  // Fallback: Get affiliate data from usermeta
  console.log('   ⚠️ Affiliate table not found, using usermeta...')
  
  const [metaRows] = await connection.query(`
    SELECT 
      user_id,
      meta_key,
      meta_value
    FROM ${config.tablePrefix}usermeta
    WHERE user_id IN (${placeholders})
    AND meta_key LIKE '%affiliate%'
  `, userIds)
  
  // Convert meta to affiliate records
  const affiliateMap = {}
  for (const row of metaRows) {
    if (!affiliateMap[row.user_id]) {
      affiliateMap[row.user_id] = { user_id: row.user_id }
    }
    affiliateMap[row.user_id][row.meta_key] = row.meta_value
  }
  
  const affiliates = Object.values(affiliateMap).filter(a => 
    a.sejoli_affiliate_code || a.affiliate_id || a._affiliate_id
  )
  
  console.log(`   ✅ Found ${affiliates.length} affiliates from usermeta`)
  return affiliates
}

async function extractCommissions(connection, users) {
  if (users.length === 0) return []
  
  console.log('📥 Extracting commission records...')
  
  const userIds = users.map(u => u.id)
  const placeholders = userIds.map(() => '?').join(',')
  
  // Try different commission tables
  const tableNames = [
    `${config.tablePrefix}sejoli_commissions`,
    `${config.tablePrefix}sejolisa_commissions`,
    `${config.tablePrefix}sejoli_affiliate_commissions`
  ]
  
  for (const tableName of tableNames) {
    try {
      const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [tableName.replace(config.tablePrefix, '')])
      
      if (tables.length === 0) continue
      
      const [rows] = await connection.query(`
        SELECT 
          ID as id,
          affiliate_id,
          user_id,
          order_id,
          product_id,
          amount as commission_amount,
          status,
          created_at
        FROM ${tableName}
        WHERE affiliate_id IN (${placeholders})
        OR user_id IN (${placeholders})
        ORDER BY ID DESC
      `, [...userIds, ...userIds])
      
      console.log(`   ✅ Found ${rows.length} commission records`)
      return rows
    } catch (err) {
      continue
    }
  }
  
  console.log('   ⚠️ Commission table not found')
  return []
}

function combineData(users, userMeta, orders, affiliates, commissions) {
  // Enrich users with metadata
  const enrichedUsers = users.map(user => {
    const meta = userMeta[user.id] || {}
    
    // Parse WordPress capabilities to determine role
    let role = 'MEMBER_FREE'
    if (meta.wp_capabilities) {
      try {
        const caps = typeof meta.wp_capabilities === 'string' 
          ? JSON.parse(meta.wp_capabilities.replace(/;/g, ',').replace(/a:\d+:{/g, '{').replace(/s:\d+:/g, '').replace(/"/g, ''))
          : meta.wp_capabilities
          
        if (caps.administrator) role = 'ADMIN'
        else if (caps.sejoli_affiliate || meta.sejoli_affiliate_active === '1') role = 'AFFILIATE'
        else if (caps.subscriber) role = 'MEMBER_FREE'
      } catch (e) {
        // Keep default role
      }
    }
    
    // Check if user is affiliate
    const isAffiliate = affiliates.some(a => a.user_id === user.id)
    if (isAffiliate) role = 'AFFILIATE'
    
    // Get affiliate data
    const affiliateData = affiliates.find(a => a.user_id === user.id)
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name || meta.first_name ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim() : user.username,
      phone: meta.billing_phone || null,
      whatsapp: meta.billing_phone || null,
      role: role,
      registeredAt: user.registered_at,
      
      // Address
      address: meta.billing_address_1 || null,
      city: meta.billing_city || null,
      province: meta.billing_state || null,
      postalCode: meta.billing_postcode || null,
      
      // Affiliate info
      isAffiliate: isAffiliate,
      affiliateCode: affiliateData?.code || meta.sejoli_affiliate_code || null,
      affiliateTier: affiliateData?.tier || 1,
      affiliateEarnings: parseFloat(affiliateData?.earnings || meta.sejoli_total_commission || 0),
      walletBalance: parseFloat(meta.sejoli_wallet_balance || affiliateData?.earnings || 0),
      
      // Original WP data for reference
      _wpMeta: meta
    }
  })
  
  // Calculate stats
  const totalEarnings = enrichedUsers.reduce((sum, u) => sum + (u.affiliateEarnings || 0), 0)
  const affiliateCount = enrichedUsers.filter(u => u.isAffiliate).length
  
  return {
    exportedAt: new Date().toISOString(),
    source: 'sejoli_wordpress',
    version: '1.0.0',
    config: {
      host: config.host,
      database: config.database,
      limit: LIMIT
    },
    stats: {
      totalUsers: enrichedUsers.length,
      totalAffiliates: affiliateCount,
      totalOrders: orders.length,
      totalCommissions: commissions.length,
      totalEarnings: totalEarnings
    },
    users: enrichedUsers,
    orders: orders,
    affiliates: affiliates,
    commissions: commissions
  }
}

// Run
main()
