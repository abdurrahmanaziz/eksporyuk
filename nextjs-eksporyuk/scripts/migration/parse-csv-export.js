/**
 * PARSE CSV EXPORT FROM PHPMYADMIN
 * =================================
 * Convert CSV exports to JSON format for import
 */

const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

const WP_DATA_DIR = path.join(__dirname, 'wp-data')
const OUTPUT_FILE = path.join(WP_DATA_DIR, 'sejoli-export-from-csv.json')

async function parseCSV() {
  console.log('📥 PARSING CSV EXPORTS')
  console.log('======================\n')

  // Check required files
  const usersFile = path.join(WP_DATA_DIR, 'wp_users.csv')
  const usermetaFile = path.join(WP_DATA_DIR, 'wp_usermeta.csv')

  if (!fs.existsSync(usersFile)) {
    console.log('❌ File tidak ada: wp_users.csv')
    console.log('\n📝 Export dulu dari phpMyAdmin:')
    console.log('   1. Login phpMyAdmin')
    console.log('   2. Pilih table wp_users')
    console.log('   3. Export → CSV')
    console.log('   4. Save ke: scripts/migration/wp-data/wp_users.csv')
    process.exit(1)
  }

  // Parse users
  console.log('📄 Reading wp_users.csv...')
  const usersCSV = fs.readFileSync(usersFile, 'utf-8')
  const usersData = parse(usersCSV, { columns: true, skip_empty_lines: true })
  console.log(`   ✅ Found ${usersData.length} users`)

  // Parse usermeta if exists
  let usermetaData = []
  if (fs.existsSync(usermetaFile)) {
    console.log('📄 Reading wp_usermeta.csv...')
    const usermetaCSV = fs.readFileSync(usermetaFile, 'utf-8')
    usermetaData = parse(usermetaCSV, { columns: true, skip_empty_lines: true })
    console.log(`   ✅ Found ${usermetaData.length} meta records`)
  }

  // Group usermeta by user_id
  const metaByUser = {}
  for (const meta of usermetaData) {
    const userId = meta.user_id || meta.umeta_id
    if (!metaByUser[userId]) {
      metaByUser[userId] = {}
    }
    metaByUser[userId][meta.meta_key] = meta.meta_value
  }

  // Combine users with their meta
  const enrichedUsers = usersData.map(user => {
    const userId = user.ID
    const meta = metaByUser[userId] || {}

    // Determine role
    let role = 'MEMBER_FREE'
    if (meta.sejoli_affiliate_code || meta.affiliate_id) {
      role = 'AFFILIATE'
    }

    // Parse capabilities if exists
    if (meta.wp_capabilities) {
      try {
        const caps = meta.wp_capabilities
        if (caps.includes('administrator')) role = 'ADMIN'
        else if (caps.includes('sejoli_affiliate')) role = 'AFFILIATE'
      } catch (e) {
        // Keep default
      }
    }

    return {
      id: parseInt(userId),
      email: user.user_email,
      username: user.user_login,
      name: user.display_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || user.user_login,
      phone: meta.billing_phone || null,
      whatsapp: meta.billing_phone || null,
      role: role,
      registeredAt: user.user_registered,
      
      // Address
      address: meta.billing_address_1 || null,
      city: meta.billing_city || null,
      province: meta.billing_state || null,
      postalCode: meta.billing_postcode || null,
      
      // Affiliate
      isAffiliate: role === 'AFFILIATE',
      affiliateCode: meta.sejoli_affiliate_code || meta.affiliate_code || null,
      affiliateTier: 1,
      affiliateEarnings: parseFloat(meta.sejoli_total_commission || meta.total_commission || 0),
      walletBalance: parseFloat(meta.sejoli_wallet_balance || meta.wallet_balance || 0),
      
      _wpMeta: meta
    }
  })

  // Calculate stats
  const totalEarnings = enrichedUsers.reduce((sum, u) => sum + (u.affiliateEarnings || 0), 0)
  const affiliateCount = enrichedUsers.filter(u => u.isAffiliate).length

  // Output
  const output = {
    exportedAt: new Date().toISOString(),
    source: 'phpmyadmin_csv',
    version: '1.0.0',
    config: {
      method: 'manual_csv_export'
    },
    stats: {
      totalUsers: enrichedUsers.length,
      totalAffiliates: affiliateCount,
      totalOrders: 0,
      totalCommissions: 0,
      totalEarnings: totalEarnings
    },
    users: enrichedUsers,
    orders: [],
    affiliates: enrichedUsers.filter(u => u.isAffiliate),
    commissions: []
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))

  console.log('\n' + '='.repeat(50))
  console.log('📊 PARSE SUMMARY')
  console.log('='.repeat(50))
  console.log(`   Users: ${enrichedUsers.length}`)
  console.log(`   Affiliates: ${affiliateCount}`)
  console.log(`   Total Earnings: Rp ${totalEarnings.toLocaleString()}`)
  console.log(`\n✅ Saved to: ${OUTPUT_FILE}`)
  console.log('\n🚀 Next: Import ke Eksporyuk')
  console.log(`   node scripts/migration/import-to-eksporyuk.js --file=wp-data/sejoli-export-from-csv.json`)
}

parseCSV().catch(console.error)
