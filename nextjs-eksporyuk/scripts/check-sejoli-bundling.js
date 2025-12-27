/**
 * Check Bundling product in Sejoli database
 */

require('dotenv').config({ path: '.env.sejoli' });
const mysql = require('mysql2/promise');

async function checkSejoliBundling() {
  console.log('🔍 Checking Sejoli for Bundling Product...\n');
  
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.SEJOLI_DB_PORT || '3307', 10),
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME
  });

  try {
    // Search for bundling products
    console.log('📦 Searching for Bundling products...\n');
    
    const [products] = await connection.execute(`
      SELECT 
        ID,
        post_title,
        post_name,
        post_status,
        post_date
      FROM wp_posts 
      WHERE post_type = 'sejoli-product'
        AND post_status = 'publish'
        AND (
          post_title LIKE '%Bundling%' OR
          post_title LIKE '%EYA%' OR
          post_title LIKE '%Aplikasi%'
        )
      ORDER BY post_date DESC
    `);
    
    if (products.length === 0) {
      console.log('❌ Tidak ada produk Bundling ditemukan!');
      console.log('\n📋 Showing all products instead:\n');
      
      const [allProducts] = await connection.execute(`
        SELECT 
          ID,
          post_title,
          post_name,
          post_status,
          post_date
        FROM wp_posts 
        WHERE post_type = 'sejoli-product'
          AND post_status = 'publish'
        ORDER BY post_date DESC
        LIMIT 20
      `);
      
      allProducts.forEach((p, i) => {
        console.log(`${i+1}. [${p.ID}] ${p.post_title}`);
        console.log(`   Slug: ${p.post_name}`);
        console.log(`   Date: ${p.post_date}\n`);
      });
      
      await connection.end();
      return;
    }
    
    console.log(`✅ Found ${products.length} bundling product(s):\n`);
    
    for (const product of products) {
      console.log(`📦 Product: ${product.post_title}`);
      console.log(`   ID: ${product.ID}`);
      console.log(`   Slug: ${product.post_name}`);
      console.log(`   Status: ${product.post_status}`);
      console.log(`   Created: ${product.post_date}`);
      
      // Get product meta
      const [meta] = await connection.execute(`
        SELECT meta_key, meta_value
        FROM wp_postmeta
        WHERE post_id = ?
          AND meta_key IN (
            '_regular_price',
            '_sale_price',
            '_stock',
            'sejoli_product_type'
          )
      `, [product.ID]);
      
      console.log('\n   Meta:');
      meta.forEach(m => {
        console.log(`   - ${m.meta_key}: ${m.meta_value}`);
      });
      
      // Count orders - SKIP karena table structure berbeda
      // const [orderCount] = await connection.execute(`
      //   SELECT COUNT(*) as total
      //   FROM wp_sejoli_order
      //   WHERE product_id = ?
      //     AND status IN ('completed', 'on-hold')
      // `, [product.ID]);
      
      // console.log(`\n   📊 Total orders: ${orderCount[0].total}`);
      
      // Get buyers from order_items instead
      try {
        const [buyers] = await connection.execute(`
          SELECT 
            pm_email.meta_value as user_email,
            pm_name.meta_value as user_name,
            p.post_date as created_at,
            p.post_status as status
          FROM wp_posts p
          LEFT JOIN wp_postmeta pm_email ON p.ID = pm_email.post_id AND pm_email.meta_key = '_billing_email'
          LEFT JOIN wp_postmeta pm_name ON p.ID = pm_name.post_id AND pm_name.meta_key = '_billing_first_name'
          LEFT JOIN wp_woocommerce_order_items oi ON p.ID = oi.order_id
          LEFT JOIN wp_woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
          WHERE p.post_type = 'shop_order'
            AND oim.meta_key = '_product_id'
            AND oim.meta_value = ?
            AND p.post_status IN ('wc-completed', 'wc-processing')
          GROUP BY p.ID
          ORDER BY p.post_date DESC
          LIMIT 10
        `, [product.ID]);
        
        if (buyers.length > 0) {
          console.log(`\n   📊 Total completed orders: ${buyers.length}+`);
          console.log('\n   👥 Sample buyers:');
          buyers.forEach((b, i) => {
            console.log(`   ${i+1}. ${b.user_email || 'N/A'}`);
            console.log(`      Name: ${b.user_name || 'N/A'}`);
            console.log(`      Date: ${b.created_at}`);
            console.log(`      Status: ${b.status}\n`);
          });
        } else {
          console.log('\n   📊 No orders found for this product');
        }
      } catch (orderErr) {
        console.log(`\n   ⚠️  Could not fetch orders: ${orderErr.message}`);
      }
      
      // // Get sample buyers
      // if (orderCount[0].total > 0) {
      //   const [buyers] = await connection.execute(`
      //     SELECT 
      //       o.user_email,
      //       o.user_name,
      //       o.created_at,
      //       o.status
      //     FROM wp_sejoli_order o
      //     WHERE o.product_id = ?
      //       AND o.status IN ('completed', 'on-hold')
      //     ORDER BY o.created_at DESC
      //     LIMIT 10
      //   `, [product.ID]);
        
      //   console.log('\n   👥 Sample buyers (latest 10):');
      //   buyers.forEach((b, i) => {
      //     console.log(`   ${i+1}. ${b.user_email}`);
      //     console.log(`      Name: ${b.user_name}`);
      //     console.log(`      Date: ${b.created_at}`);
      //     console.log(`      Status: ${b.status}\n`);
      //   });
      // }
      
      console.log('\n' + '='.repeat(70) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SSH tunnel belum aktif!');
      console.log('   Jalankan: node scripts/open-sejoli-tunnel.js');
    }
  } finally {
    await connection.end();
  }
}

checkSejoliBundling().catch(console.error);
