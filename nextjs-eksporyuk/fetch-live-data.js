/**
 * FETCH LIVE DATA FROM WORDPRESS DATABASE
 * - Get orders with REAL commission data
 * - Get products with correct membership mapping
 * - Get affiliates who actually earned commissions
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

const config = {
  host: '103.125.181.47',
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  connectTimeout: 30000
};

(async () => {
  console.log('🔄 CONNECTING TO LIVE WORDPRESS DATABASE...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to:', config.host);
    console.log('📦 Database:', config.database);
    console.log('');

    // 1. GET PRODUCTS WITH COMMISSION RATES
    console.log('📦 FETCHING PRODUCTS...');
    const [products] = await connection.execute(`
      SELECT 
        p.ID as product_id,
        p.post_title as product_name,
        p.post_status,
        pm_price.meta_value as price,
        pm_comm_type.meta_value as commission_type,
        pm_comm_value.meta_value as commission_value
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_regular_price'
      LEFT JOIN wp_postmeta pm_comm_type ON p.ID = pm_comm_type.post_id AND pm_comm_type.meta_key = '_sejoli_commission_type'
      LEFT JOIN wp_postmeta pm_comm_value ON p.ID = pm_comm_value.post_id AND pm_comm_value.meta_key = '_sejoli_commission_value'
      WHERE p.post_type = 'sejoli-product'
      AND p.post_status IN ('publish', 'draft')
      ORDER BY p.ID
    `);
    
    console.log(`✅ Found ${products.length} products\n`);
    
    // Show sample
    console.log('📋 SAMPLE PRODUCTS:');
    products.slice(0, 10).forEach(p => {
      const price = parseFloat(p.price || 0);
      const commValue = parseFloat(p.commission_value || 0);
      const commType = p.commission_type || 'percentage';
      const commAmount = commType === 'percentage' ? (price * commValue / 100) : commValue;
      
      console.log(`  Product ${p.product_id}: ${p.product_name}`);
      console.log(`    Price: Rp ${price.toLocaleString()}`);
      console.log(`    Commission: ${commType === 'percentage' ? commValue + '%' : 'Rp ' + commValue.toLocaleString()} = Rp ${commAmount.toLocaleString()}`);
    });
    console.log('');

    // 2. GET ORDERS
    console.log('📦 FETCHING ORDERS...');
    const [orders] = await connection.execute(`
      SELECT 
        o.ID as order_id,
        o.user_id,
        o.product_id,
        o.affiliate_id,
        o.order_date as created_at,
        o.grand_total,
        o.status,
        o.payment_info,
        o.quantity,
        o.type
      FROM wp_sejoli_orders o
      ORDER BY o.ID
      LIMIT 20000
    `);
    
    console.log(`✅ Found ${orders.length} orders\n`);

    // 3. GET COMMISSIONS (REAL DATA!)
    console.log('💰 FETCHING COMMISSIONS...');
    const [commissions] = await connection.execute(`
      SELECT 
        c.ID as commission_id,
        c.order_id,
        c.user_id as affiliate_user_id,
        c.commission_value,
        c.commission_type,
        c.status as commission_status,
        c.created_at
      FROM wp_sejoli_armada_commissions c
      WHERE c.commission_value > 0
      ORDER BY c.order_id
    `);
    
    console.log(`✅ Found ${commissions.length} commission records\n`);
    
    // Show sample
    console.log('📋 SAMPLE COMMISSIONS:');
    commissions.slice(0, 10).forEach(c => {
      console.log(`  Order ${c.order_id} -> Affiliate User ${c.affiliate_user_id}: Rp ${parseFloat(c.commission_value).toLocaleString()}`);
    });
    console.log('');

    // 4. GET USERS
    console.log('👥 FETCHING USERS...');
    const [users] = await connection.execute(`
      SELECT 
        u.ID as user_id,
        u.user_email,
        u.user_login,
        u.display_name,
        u.user_registered,
        um_phone.meta_value as phone,
        um_first.meta_value as first_name,
        um_last.meta_value as last_name
      FROM wp_users u
      LEFT JOIN wp_usermeta um_phone ON u.ID = um_phone.user_id AND um_phone.meta_key = 'billing_phone'
      LEFT JOIN wp_usermeta um_first ON u.ID = um_first.user_id AND um_first.meta_key = 'first_name'
      LEFT JOIN wp_usermeta um_last ON u.ID = um_last.user_id AND um_last.meta_key = 'last_name'
      ORDER BY u.ID
      LIMIT 20000
    `);
    
    console.log(`✅ Found ${users.length} users\n`);

    // 5. GET AFFILIATE CODES
    console.log('🤝 FETCHING AFFILIATE CODES...');
    const [affiliateCodes] = await connection.execute(`
      SELECT 
        user_id,
        meta_value as affiliate_code
      FROM wp_usermeta
      WHERE meta_key = 'sejoli_armada_code'
      AND meta_value IS NOT NULL
      AND meta_value != ''
    `);
    
    console.log(`✅ Found ${affiliateCodes.length} affiliate codes\n`);

    // Build comprehensive data
    const liveData = {
      products: products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        price: parseFloat(p.price || 0),
        commissionType: p.commission_type || 'percentage',
        commissionValue: parseFloat(p.commission_value || 0),
        status: p.post_status
      })),
      orders: orders.map(o => ({
        id: o.order_id,
        userId: o.user_id,
        productId: o.product_id,
        affiliateId: o.affiliate_id,
        grandTotal: parseFloat(o.grand_total || 0),
        status: o.status,
        type: o.type,
        quantity: o.quantity,
        createdAt: o.created_at
      })),
      commissions: commissions.map(c => ({
        id: c.commission_id,
        orderId: c.order_id,
        affiliateUserId: c.affiliate_user_id,
        commissionValue: parseFloat(c.commission_value || 0),
        commissionType: c.commission_type,
        status: c.commission_status,
        createdAt: c.created_at
      })),
      users: users.map(u => ({
        id: u.user_id,
        email: u.user_email,
        username: u.user_login,
        displayName: u.display_name,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        registered: u.user_registered
      })),
      affiliateCodes: affiliateCodes.map(a => ({
        userId: a.user_id,
        code: a.affiliate_code
      })),
      exportDate: new Date().toISOString()
    };

    // Save to file
    const outputPath = './scripts/migration/wp-data/live-complete-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(liveData, null, 2));
    
    console.log('═══════════════════════════════════════');
    console.log('✅ LIVE DATA EXPORTED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log('📦 Products:', liveData.products.length);
    console.log('📋 Orders:', liveData.orders.length);
    console.log('💰 Commissions:', liveData.commissions.length);
    console.log('👥 Users:', liveData.users.length);
    console.log('🤝 Affiliate Codes:', liveData.affiliateCodes.length);
    console.log('📁 Saved to:', outputPath);
    console.log('═══════════════════════════════════════\n');

    // Analyze commission stats
    console.log('📊 COMMISSION ANALYSIS:\n');
    
    // Group commissions by affiliate
    const affiliateStats = new Map();
    commissions.forEach(c => {
      const uid = c.affiliate_user_id;
      if (!affiliateStats.has(uid)) {
        affiliateStats.set(uid, {
          userId: uid,
          totalCommission: 0,
          orderCount: 0,
          orders: []
        });
      }
      const stats = affiliateStats.get(uid);
      stats.totalCommission += parseFloat(c.commission_value || 0);
      stats.orderCount++;
      stats.orders.push(c.order_id);
    });

    // Top affiliates
    const topAffiliates = Array.from(affiliateStats.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 20);

    console.log('🏆 TOP 20 AFFILIATES BY COMMISSION:');
    topAffiliates.forEach((aff, idx) => {
      const user = users.find(u => u.user_id === aff.userId);
      console.log(`${idx + 1}. User ${aff.userId} (${user ? user.user_email : 'N/A'})`);
      console.log(`   Orders: ${aff.orderCount}, Total Commission: Rp ${aff.totalCommission.toLocaleString()}`);
    });
    console.log('');

    await connection.end();
    console.log('✅ Database connection closed\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    if (connection) await connection.end();
    process.exit(1);
  }
})();
