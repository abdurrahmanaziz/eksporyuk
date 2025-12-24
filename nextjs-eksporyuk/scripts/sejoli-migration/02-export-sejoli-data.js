/**
 * Sejoli Data Exporter
 * Exports all relevant data from Sejoli to JSON files
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.sejoli') });

const EXPORT_DIR = path.join(__dirname, 'exports');

async function exportSejoliData() {
  console.log('📤 SEJOLI DATA EXPORT');
  console.log('=====================\n');

  // Create exports directory
  await fs.mkdir(EXPORT_DIR, { recursive: true });

  const connection = await mysql.createConnection({
    host: process.env.SEJOLI_DB_HOST,
    port: process.env.SEJOLI_DB_PORT || 3306,
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME,
  });

  try {
    console.log('✅ Connected to Sejoli database\n');

    // 1. Export Users
    console.log('1️⃣ Exporting Users...');
    const [users] = await connection.query(`
      SELECT 
        u.ID,
        u.user_login,
        u.user_email,
        u.user_registered,
        u.user_status,
        u.display_name,
        GROUP_CONCAT(DISTINCT um.meta_value) as roles
      FROM wp_users u
      LEFT JOIN wp_usermeta um ON u.ID = um.user_id AND um.meta_key = 'wp_capabilities'
      GROUP BY u.ID
      ORDER BY u.ID
    `);
    
    await fs.writeFile(
      path.join(EXPORT_DIR, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`   ✅ Exported ${users.length} users\n`);

    // 2. Export User Meta (phone, etc)
    console.log('2️⃣ Exporting User Metadata...');
    const [userMeta] = await connection.query(`
      SELECT user_id, meta_key, meta_value
      FROM wp_usermeta
      WHERE meta_key IN (
        'billing_phone', 'billing_address_1', 'billing_city', 
        'billing_state', 'billing_postcode', 'billing_country',
        'first_name', 'last_name', 'nickname'
      )
      ORDER BY user_id
    `);
    
    await fs.writeFile(
      path.join(EXPORT_DIR, 'user-meta.json'),
      JSON.stringify(userMeta, null, 2)
    );
    console.log(`   ✅ Exported ${userMeta.length} meta records\n`);

    // 3. Export Sejoli Orders (if exists)
    console.log('3️⃣ Exporting Orders...');
    try {
      const [orders] = await connection.query(`
        SELECT * FROM wp_sejoli_orders
        ORDER BY created_at DESC
      `);
      
      await fs.writeFile(
        path.join(EXPORT_DIR, 'orders.json'),
        JSON.stringify(orders, null, 2)
      );
      console.log(`   ✅ Exported ${orders.length} orders\n`);
    } catch (err) {
      console.log(`   ⚠️  wp_sejoli_orders not found, skipping...\n`);
    }

    // 4. Export Affiliates
    console.log('4️⃣ Exporting Affiliates...');
    try {
      const [affiliates] = await connection.query(`
        SELECT * FROM wp_sejoli_affiliates
        ORDER BY user_id
      `);
      
      await fs.writeFile(
        path.join(EXPORT_DIR, 'affiliates.json'),
        JSON.stringify(affiliates, null, 2)
      );
      console.log(`   ✅ Exported ${affiliates.length} affiliates\n`);
    } catch (err) {
      console.log(`   ⚠️  wp_sejoli_affiliates not found, skipping...\n`);
    }

    // 5. Export Commissions
    console.log('5️⃣ Exporting Commissions...');
    try {
      const [commissions] = await connection.query(`
        SELECT * FROM wp_sejoli_commissions
        ORDER BY created_at DESC
      `);
      
      await fs.writeFile(
        path.join(EXPORT_DIR, 'commissions.json'),
        JSON.stringify(commissions, null, 2)
      );
      console.log(`   ✅ Exported ${commissions.length} commissions\n`);
    } catch (err) {
      console.log(`   ⚠️  wp_sejoli_commissions not found, skipping...\n`);
    }

    // 6. Export Products/Memberships
    console.log('6️⃣ Exporting Products...');
    const [products] = await connection.query(`
      SELECT 
        p.ID,
        p.post_title as title,
        p.post_content as description,
        p.post_status,
        p.post_date,
        pm.meta_value as product_data
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_sejoli_product'
      WHERE p.post_type IN ('sejoli-product', 'product', 'membership')
      ORDER BY p.ID
    `);
    
    await fs.writeFile(
      path.join(EXPORT_DIR, 'products.json'),
      JSON.stringify(products, null, 2)
    );
    console.log(`   ✅ Exported ${products.length} products\n`);

    // 7. Export Groups (if custom table exists)
    console.log('7️⃣ Exporting Groups/Communities...');
    try {
      // Try sejoli groups
      const [groups] = await connection.query(`
        SELECT * FROM wp_sejoli_groups
        ORDER BY created_at
      `);
      
      await fs.writeFile(
        path.join(EXPORT_DIR, 'groups.json'),
        JSON.stringify(groups, null, 2)
      );
      console.log(`   ✅ Exported ${groups.length} groups\n`);
    } catch (err) {
      // Try BuddyPress groups as fallback
      try {
        const [bpGroups] = await connection.query(`
          SELECT * FROM wp_bp_groups
          ORDER BY date_created
        `);
        
        await fs.writeFile(
          path.join(EXPORT_DIR, 'groups-buddypress.json'),
          JSON.stringify(bpGroups, null, 2)
        );
        console.log(`   ✅ Exported ${bpGroups.length} BuddyPress groups\n`);
      } catch (err2) {
        console.log(`   ⚠️  No groups table found, skipping...\n`);
      }
    }

    // 8. Export Transactions Summary
    console.log('8️⃣ Creating Transaction Summary...');
    const summary = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      database: {
        host: process.env.SEJOLI_DB_HOST,
        name: process.env.SEJOLI_DB_NAME,
      },
      files: await fs.readdir(EXPORT_DIR)
    };
    
    await fs.writeFile(
      path.join(EXPORT_DIR, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n✅ EXPORT COMPLETE!');
    console.log('===================');
    console.log(`📁 Exported to: ${EXPORT_DIR}`);
    console.log(`📊 Files created: ${summary.files.length}`);
    console.log('\n Next step: Run 03-migrate-to-eksporyuk.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

exportSejoliData().catch(console.error);
