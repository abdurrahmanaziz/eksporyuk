/**
 * Sejoli Database Inspector
 * Inspects WordPress/Sejoli database structure before migration
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.sejoli') });

async function inspectDatabase() {
  console.log('🔍 SEJOLI DATABASE INSPECTION');
  console.log('================================\n');

  console.log('🔌 Connecting to database...');
  console.log(`   Host: ${process.env.SEJOLI_DB_HOST}`);
  console.log(`   Database: ${process.env.SEJOLI_DB_NAME}`);
  console.log(`   User: ${process.env.SEJOLI_DB_USER}\n`);

  const connection = await mysql.createConnection({
    host: process.env.SEJOLI_DB_HOST,
    port: process.env.SEJOLI_DB_PORT || 3306,
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME,
    connectTimeout: 30000,
  });

  try {
    console.log('✅ Connected to Sejoli database\n');

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📊 Total Tables: ${tableNames.length}\n`);

    // Find Sejoli-related tables
    const sejoliTables = tableNames.filter(t => 
      t.includes('sejoli') || 
      t.includes('affiliate') || 
      t.includes('commission') ||
      t.includes('order') ||
      t.includes('product')
    );

    console.log('🎯 Sejoli-Related Tables:');
    console.log('========================');
    for (const table of sejoliTables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${rows[0].count} rows`);
    }

    // Check WordPress core tables
    console.log('\n👥 WordPress Core Tables:');
    console.log('========================');
    const coreTables = ['wp_users', 'wp_usermeta', 'wp_posts', 'wp_postmeta', 'wp_terms', 'wp_term_taxonomy'];
    
    for (const table of coreTables) {
      if (tableNames.includes(table)) {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${rows[0].count} rows`);
      }
    }

    // Inspect wp_users structure
    console.log('\n📋 wp_users Table Structure:');
    console.log('============================');
    const [userColumns] = await connection.query('DESCRIBE wp_users');
    userColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Sample users
    console.log('\n👤 Sample Users (First 5):');
    console.log('==========================');
    const [users] = await connection.query(`
      SELECT ID, user_login, user_email, user_registered, user_status 
      FROM wp_users 
      ORDER BY ID ASC 
      LIMIT 5
    `);
    console.table(users);

    // Check for main Sejoli tables and their structure
    const criticalTables = [
      'wp_sejoli_orders',
      'wp_sejoli_affiliates', 
      'wp_sejoli_commissions',
      'wp_sejoli_products',
      'wp_sejoli_product_price'
    ];

    console.log('\n🔍 Critical Sejoli Tables Inspection:');
    console.log('=====================================');
    
    for (const table of criticalTables) {
      if (tableNames.includes(table)) {
        console.log(`\n📊 ${table}:`);
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        console.log('  Columns:', columns.map(c => c.Field).join(', '));
        
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  Total rows: ${count[0].count}`);
        
        // Get sample data
        const [sample] = await connection.query(`SELECT * FROM ${table} LIMIT 1`);
        if (sample.length > 0) {
          console.log('  Sample data keys:', Object.keys(sample[0]).join(', '));
        }
      } else {
        console.log(`\n❌ ${table}: NOT FOUND`);
      }
    }

    // Check user roles
    console.log('\n👔 User Roles Distribution:');
    console.log('===========================');
    const [roleMeta] = await connection.query(`
      SELECT meta_value, COUNT(*) as count
      FROM wp_usermeta
      WHERE meta_key = 'wp_capabilities'
      GROUP BY meta_value
      ORDER BY count DESC
    `);
    roleMeta.forEach(role => {
      const roleName = Object.keys(JSON.parse(role.meta_value))[0] || 'unknown';
      console.log(`  ${roleName}: ${role.count} users`);
    });

    console.log('\n✅ Inspection Complete!');
    console.log('\n📁 Save this output for migration planning.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

inspectDatabase().catch(console.error);
