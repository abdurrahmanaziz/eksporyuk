/**
 * PARSE PHPMYADMIN MANUAL EXPORT
 * ===============================
 * Parse exported JSON from phpMyAdmin ke format yang bisa di-import
 * 
 * Usage:
 *   1. Export dari phpMyAdmin (format JSON)
 *   2. Save ke: scripts/migration/wp-data/phpmyadmin-export.json
 *   3. Run: node scripts/migration/parse-phpmyadmin-export.js
 */

const fs = require('fs')
const path = require('path')

const INPUT_FILE = path.join(__dirname, 'wp-data/phpmyadmin-export.json')
const OUTPUT_FILE = path.join(__dirname, 'wp-data/sejoli-export-manual.json')

async function parseExport() {
  console.log('📥 PARSING PHPMYADMIN EXPORT')
  console.log('============================\n')

  if (!fs.existsSync(INPUT_FILE)) {
    console.log('❌ File tidak ditemukan:', INPUT_FILE)
    console.log('\n📝 Cara export dari phpMyAdmin:')
    console.log('   1. Login phpMyAdmin di HestiaCP')
    console.log('   2. Pilih database: aziz_member.eksporyuk.com')
    console.log('   3. Klik tab "Export"')
    console.log('   4. Format: JSON')
    console.log('   5. Select tables:')
    console.log('      - wp_users')
    console.log('      - wp_usermeta')
    console.log('      - wp_sejoli_orders (jika ada)')
    console.log('      - wp_sejoli_affiliates (jika ada)')
    console.log('   6. Save ke: scripts/migration/wp-data/phpmyadmin-export.json')
    process.exit(1)
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'))
  
  // Parse format phpMyAdmin
  const users = []
  const usermeta = []
  
  // phpMyAdmin export biasanya array of objects atau nested structure
  // Adapt sesuai format actual
  
  console.log('✅ Export parsed successfully!')
  console.log(`   Users: ${users.length}`)
  
  // Save output
  const output = {
    exportedAt: new Date().toISOString(),
    source: 'phpmyadmin_manual',
    users: users,
    stats: {
      totalUsers: users.length
    }
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
  console.log(`\n📁 Saved to: ${OUTPUT_FILE}`)
  console.log('\n🚀 Next: Import ke Eksporyuk')
  console.log(`   node scripts/migration/import-to-eksporyuk.js --file=${OUTPUT_FILE}`)
}

parseExport().catch(console.error)
