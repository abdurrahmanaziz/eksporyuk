#!/usr/bin/env node
require('dotenv').config({ path: '.env.wp' })
const mysql = require('mysql2/promise')

const config = {
  host: process.env.WP_DB_HOST || 'localhost',
  port: parseInt(process.env.WP_DB_PORT) || 3306,
  user: process.env.WP_DB_USER,
  password: process.env.WP_DB_PASSWORD,
  database: process.env.WP_DB_NAME,
  tablePrefix: process.env.WP_TABLE_PREFIX || 'wp_'
}

async function checkTables() {
  let connection
  
  try {
    console.log('🔍 Checking Sejoli table structures...\n')
    
    connection = await mysql.createConnection(config)
    
    // Check orders table
    const ordersTable = `${config.tablePrefix}sejolisa_orders`
    console.log(`📋 Table: ${ordersTable}`)
    const [ordersCols] = await connection.query(`DESCRIBE ${ordersTable}`)
    console.log('Columns:', ordersCols.map(c => `${c.Field} (${c.Type})`).join(', '))
    
    const [ordersCount] = await connection.query(`SELECT COUNT(*) as total FROM ${ordersTable}`)
    console.log(`Total rows: ${ordersCount[0].total}\n`)
    
    // Sample order
    const [sampleOrder] = await connection.query(`SELECT * FROM ${ordersTable} LIMIT 1`)
    console.log('Sample order:', JSON.stringify(sampleOrder[0], null, 2))
    
    console.log('\n' + '='.repeat(60))
    
    // Check affiliates table
    const affiliatesTable = `${config.tablePrefix}sejolisa_affiliates`
    console.log(`\n📋 Table: ${affiliatesTable}`)
    const [affCols] = await connection.query(`DESCRIBE ${affiliatesTable}`)
    console.log('Columns:', affCols.map(c => `${c.Field} (${c.Type})`).join(', '))
    
    const [affCount] = await connection.query(`SELECT COUNT(*) as total FROM ${affiliatesTable}`)
    console.log(`Total rows: ${affCount[0].total}\n`)
    
    // Sample affiliate
    const [sampleAff] = await connection.query(`SELECT * FROM ${affiliatesTable} LIMIT 1`)
    console.log('Sample affiliate:', JSON.stringify(sampleAff[0], null, 2))
    
    console.log('\n' + '='.repeat(60))
    
    // Check wallet table
    const walletTable = `${config.tablePrefix}sejolisa_wallet`
    console.log(`\n📋 Table: ${walletTable}`)
    const [walletCols] = await connection.query(`DESCRIBE ${walletTable}`)
    console.log('Columns:', walletCols.map(c => `${c.Field} (${c.Type})`).join(', '))
    
    const [walletCount] = await connection.query(`SELECT COUNT(*) as total FROM ${walletTable}`)
    console.log(`Total rows: ${walletCount[0].total}\n`)
    
    // Sample wallet
    const [sampleWallet] = await connection.query(`SELECT * FROM ${walletTable} LIMIT 1`)
    console.log('Sample wallet:', JSON.stringify(sampleWallet[0], null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) await connection.end()
  }
}

checkTables()
