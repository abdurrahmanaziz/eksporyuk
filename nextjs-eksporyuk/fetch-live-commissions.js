/**
 * FETCH COMMISSION DATA FROM LIVE WORDPRESS DATABASE
 * Connect to production Sejoli database and extract commission rates
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '103.125.181.47',
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  port: 3306
};

(async () => {
  console.log('🔌 CONNECTING TO LIVE WORDPRESS DATABASE...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to:', DB_CONFIG.host);
    console.log('📦 Database:', DB_CONFIG.database);
    console.log('');
    
    // Check tables
    console.log('📋 CHECKING TABLES...\n');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%sejoli%'
    `);
    
    console.log('Sejoli tables found:', tables.length);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log('  -', tableName);
    });
    
    // Check for commission/affiliate tables
    console.log('\n\n🔍 CHECKING COMMISSION TABLES...\n');
    const [commTables] = await connection.execute(`
      SHOW TABLES LIKE '%commission%'
    `);
    
    if (commTables.length > 0) {
      console.log('Commission tables:');
      commTables.forEach(t => console.log('  -', Object.values(t)[0]));
      
      // Sample commission data
      const commTableName = Object.values(commTables[0])[0];
      console.log(`\n📊 SAMPLE DATA FROM ${commTableName}:\n`);
      
      const [sample] = await connection.execute(
        `SELECT * FROM ${commTableName} LIMIT 5`
      );
      
      console.log(JSON.stringify(sample, null, 2));
    }
    
    // Check affiliate tables
    console.log('\n\n🤝 CHECKING AFFILIATE TABLES...\n');
    const [affTables] = await connection.execute(`
      SHOW TABLES LIKE '%affiliate%'
    `);
    
    if (affTables.length > 0) {
      console.log('Affiliate tables:');
      affTables.forEach(t => console.log('  -', Object.values(t)[0]));
      
      // Sample affiliate data
      const affTableName = Object.values(affTables[0])[0];
      console.log(`\n📊 SAMPLE DATA FROM ${affTableName}:\n`);
      
      const [affSample] = await connection.execute(
        `SELECT * FROM ${affTableName} LIMIT 5`
      );
      
      console.log(JSON.stringify(affSample, null, 2));
    }
    
    // Check products/orders for commission settings
    console.log('\n\n💰 CHECKING PRODUCT COMMISSION SETTINGS...\n');
    
    // Try to find product meta with commission rates
    const [productMeta] = await connection.execute(`
      SELECT pm.meta_key, pm.meta_value, p.ID as product_id, p.post_title
      FROM wp_postmeta pm
      JOIN wp_posts p ON p.ID = pm.post_id
      WHERE p.post_type = 'sejoli-product'
      AND pm.meta_key LIKE '%commission%'
      LIMIT 20
    `);
    
    if (productMeta.length > 0) {
      console.log('Product commission settings found:');
      productMeta.forEach(pm => {
        console.log(`  Product ${pm.product_id} (${pm.post_title}): ${pm.meta_key} = ${pm.meta_value}`);
      });
    } else {
      console.log('⚠️  No commission meta found in wp_postmeta');
    }
    
    // Check orders table structure
    console.log('\n\n📦 CHECKING ORDERS TABLE...\n');
    const [orderCols] = await connection.execute(`
      SHOW COLUMNS FROM wp_sejoli_order
    `);
    
    console.log('Order table columns:');
    orderCols.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Sample orders with commission data
    console.log('\n\n💳 SAMPLE ORDERS WITH COMMISSION:\n');
    const [orders] = await connection.execute(`
      SELECT 
        ID,
        user_id,
        product_id,
        grand_total,
        affiliate_id,
        affiliate_commission,
        status,
        created_at
      FROM wp_sejoli_order
      WHERE affiliate_id > 0
      AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${orders.length} completed orders with affiliates:`);
    orders.forEach(o => {
      console.log(`  Order #${o.ID}: Product ${o.product_id}, Total Rp ${o.grand_total}, Commission Rp ${o.affiliate_commission || 0}`);
    });
    
    await connection.end();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (connection) await connection.end();
  }
})();
