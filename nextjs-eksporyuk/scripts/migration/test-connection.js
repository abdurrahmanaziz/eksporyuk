/**
 * Test WordPress Database Connection
 */
const mysql = require('mysql2/promise')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../../.env.wp') })

async function testConnection() {
  console.log('🔌 Testing WordPress Database Connection...\n')
  console.log('Config:')
  console.log(`   Host: ${process.env.WP_DB_HOST}:${process.env.WP_DB_PORT}`)
  console.log(`   Database: ${process.env.WP_DB_NAME}`)
  console.log(`   User: ${process.env.WP_DB_USER}`)
  console.log('')

  try {
    const connection = await mysql.createConnection({
      host: process.env.WP_DB_HOST,
      port: parseInt(process.env.WP_DB_PORT),
      user: process.env.WP_DB_USER,
      password: process.env.WP_DB_PASSWORD,
      database: process.env.WP_DB_NAME
    })

    console.log('✅ Connection successful!\n')

    // Get table prefix
    const prefix = process.env.WP_TABLE_PREFIX || 'wp_'
    
    // Test query: count users
    const [users] = await connection.query(`SELECT COUNT(*) as count FROM ${prefix}users`)
    console.log(`📊 Found ${users[0].count} users in database`)

    // Check for Sejoli tables
    const [tables] = await connection.query(`SHOW TABLES LIKE '%sejoli%'`)
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} Sejoli tables:`)
      tables.forEach(t => {
        const tableName = Object.values(t)[0]
        console.log(`   - ${tableName}`)
      })
    } else {
      console.log('⚠️  No Sejoli tables found - might be using different plugin')
    }

    await connection.end()
    console.log('\n✅ Database ready for migration!')
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure SSH tunnel is running:')
      console.log('   ssh -L 3306:localhost:3306 eksporyuk@103.125.181.47')
    }
    
    process.exit(1)
  }
}

testConnection()
