/**
 * SYNC LATEST DATA FROM WORDPRESS SEJOLI DATABASE
 * 
 * Mengambil data terbaru dari database WordPress Sejoli (member.eksporyuk.com)
 * dan menyinkronkan ke database Neon PostgreSQL
 * 
 * Run: node sync-latest-sejoli.js
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// WordPress MySQL connection config
const wpConfig = {
  host: '103.125.181.47',
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  connectTimeout: 60000,
  waitForConnections: true,
  connectionLimit: 5
};

// Membership mapping dari Sejoli product ke Next.js membership
const MEMBERSHIP_MAP = {
  'bronze': 'bronze',
  'silver': 'silver', 
  'gold': 'gold',
  'platinum': 'platinum'
};

// Status mapping dari Sejoli ke Next.js
const STATUS_MAP = {
  'completed': 'SUCCESS',
  'on-hold': 'PENDING',
  'pending': 'PENDING',
  'processing': 'PENDING',
  'refunded': 'REFUNDED',
  'cancelled': 'CANCELLED',
  'failed': 'FAILED'
};

async function fetchSejoliData() {
  console.log('🔄 SYNC LATEST DATA FROM WORDPRESS SEJOLI');
  console.log('=========================================\n');
  
  let wpConnection;
  
  try {
    // 1. Connect to WordPress MySQL
    console.log('📡 Connecting to WordPress MySQL...');
    wpConnection = await mysql.createConnection(wpConfig);
    console.log('✅ Connected to:', wpConfig.host);
    console.log('📦 Database:', wpConfig.database);
    console.log('');

    // 2. Fetch ALL orders from Sejoli
    console.log('📥 Fetching orders from wp_sejoli_order...');
    const [orders] = await wpConnection.execute(`
      SELECT 
        o.ID,
        o.user_id,
        o.product_id,
        o.status,
        o.grand_total,
        o.payment_gateway,
        o.affiliate_id,
        o.created_at,
        o.updated_at,
        u.user_email,
        u.display_name,
        p.post_title as product_name
      FROM wp_sejoli_order o
      LEFT JOIN wp_users u ON o.user_id = u.ID
      LEFT JOIN wp_posts p ON o.product_id = p.ID
      ORDER BY o.created_at DESC
    `);
    
    console.log(`✅ Found ${orders.length.toLocaleString()} orders\n`);

    // 3. Fetch affiliates/commissions
    console.log('📥 Fetching affiliate commissions...');
    const [commissions] = await wpConnection.execute(`
      SELECT 
        c.ID,
        c.order_id,
        c.affiliate_id,
        c.product_id,
        c.tier,
        c.rate,
        c.amount,
        c.status as commission_status,
        c.created_at,
        u.user_email as affiliate_email,
        u.display_name as affiliate_name,
        um.meta_value as affiliate_code
      FROM wp_sejoli_armada_commissions c
      LEFT JOIN wp_users u ON c.affiliate_id = u.ID
      LEFT JOIN wp_usermeta um ON c.affiliate_id = um.user_id AND um.meta_key = 'sejoli_armada_code'
      ORDER BY c.created_at DESC
    `);
    
    console.log(`✅ Found ${commissions.length.toLocaleString()} commission records\n`);

    // 4. Fetch users with affiliate codes
    console.log('📥 Fetching users with affiliate data...');
    const [users] = await wpConnection.execute(`
      SELECT 
        u.ID as wp_user_id,
        u.user_email,
        u.user_login,
        u.display_name,
        u.user_registered,
        um_code.meta_value as affiliate_code,
        um_phone.meta_value as phone,
        um_whatsapp.meta_value as whatsapp
      FROM wp_users u
      LEFT JOIN wp_usermeta um_code ON u.ID = um_code.user_id AND um_code.meta_key = 'sejoli_armada_code'
      LEFT JOIN wp_usermeta um_phone ON u.ID = um_phone.user_id AND um_phone.meta_key = 'billing_phone'
      LEFT JOIN wp_usermeta um_whatsapp ON u.ID = um_whatsapp.user_id AND um_whatsapp.meta_key = 'whatsapp'
      ORDER BY u.ID
    `);
    
    console.log(`✅ Found ${users.length.toLocaleString()} users\n`);

    // 5. Get statistics summary
    console.log('📊 STATISTIK DATA SEJOLI:');
    console.log('========================');
    
    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingOrders = orders.filter(o => ['on-hold', 'pending', 'processing'].includes(o.status));
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
    const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const affiliatesWithCode = users.filter(u => u.affiliate_code);
    
    console.log(`Total Orders: ${orders.length.toLocaleString()}`);
    console.log(`  - Completed: ${completedOrders.length.toLocaleString()}`);
    console.log(`  - Pending: ${pendingOrders.length.toLocaleString()}`);
    console.log(`Total Revenue: Rp ${totalRevenue.toLocaleString()}`);
    console.log(`Total Users: ${users.length.toLocaleString()}`);
    console.log(`Users with Affiliate Code: ${affiliatesWithCode.length.toLocaleString()}`);
    console.log(`Total Commission Records: ${commissions.length.toLocaleString()}`);
    console.log(`Total Commission Amount: Rp ${totalCommission.toLocaleString()}`);
    console.log('');

    // 6. Save to JSON file for backup
    const backupData = {
      exportedAt: new Date().toISOString(),
      source: 'WordPress Sejoli Live Database',
      database: wpConfig.database,
      statistics: {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue,
        totalUsers: users.length,
        affiliatesWithCode: affiliatesWithCode.length,
        totalCommissions: commissions.length,
        totalCommissionAmount: totalCommission
      },
      orders,
      commissions,
      users
    };

    const backupFile = `./scripts/migration/wp-data/sejoli-live-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}\n`);

    // Close WordPress connection
    await wpConnection.end();
    
    return backupData;
    
  } catch (error) {
    console.error('❌ Error fetching Sejoli data:', error.message);
    if (wpConnection) await wpConnection.end();
    throw error;
  }
}

async function syncToNextJS(sejoliData) {
  console.log('\n🔄 SYNCING TO NEXTJS DATABASE (NEON)...');
  console.log('========================================\n');
  
  try {
    // Get current NextJS stats for comparison
    const currentUsers = await prisma.user.count();
    const currentTransactions = await prisma.transaction.count();
    const currentAffiliateConversions = await prisma.affiliateConversion.count();
    
    console.log('📊 Current NextJS Database:');
    console.log(`  - Users: ${currentUsers.toLocaleString()}`);
    console.log(`  - Transactions: ${currentTransactions.toLocaleString()}`);
    console.log(`  - Affiliate Conversions: ${currentAffiliateConversions.toLocaleString()}`);
    console.log('');

    console.log('📊 Sejoli Source Data:');
    console.log(`  - Users: ${sejoliData.users.length.toLocaleString()}`);
    console.log(`  - Orders: ${sejoliData.orders.length.toLocaleString()}`);
    console.log(`  - Commissions: ${sejoliData.commissions.length.toLocaleString()}`);
    console.log('');

    // Show what needs to be synced
    const usersDiff = sejoliData.users.length - currentUsers;
    const ordersDiff = sejoliData.orders.length - currentTransactions;
    
    console.log('📈 Difference:');
    console.log(`  - Users: ${usersDiff > 0 ? '+' : ''}${usersDiff}`);
    console.log(`  - Orders/Transactions: ${ordersDiff > 0 ? '+' : ''}${ordersDiff}`);
    console.log('');
    
    console.log('⚠️  SYNC BELUM DIJALANKAN - PREVIEW MODE');
    console.log('');
    console.log('Untuk menjalankan sync penuh, uncomment fungsi syncUsers(), syncTransactions(), dll');
    console.log('');
    
    // Uncomment these to actually sync:
    // await syncUsers(sejoliData.users);
    // await syncTransactions(sejoliData.orders);
    // await syncCommissions(sejoliData.commissions);
    
    return {
      success: true,
      preview: true,
      currentStats: { currentUsers, currentTransactions, currentAffiliateConversions },
      sejoliStats: { 
        users: sejoliData.users.length, 
        orders: sejoliData.orders.length,
        commissions: sejoliData.commissions.length 
      }
    };
    
  } catch (error) {
    console.error('❌ Error syncing to NextJS:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Step 1: Fetch latest data from Sejoli
    const sejoliData = await fetchSejoliData();
    
    // Step 2: Preview sync to NextJS
    await syncToNextJS(sejoliData);
    
    console.log('✅ SYNC PREVIEW COMPLETED!');
    console.log('');
    console.log('Langkah selanjutnya:');
    console.log('1. Review data di file JSON backup');
    console.log('2. Uncomment fungsi sync untuk menjalankan sync penuh');
    console.log('3. Jalankan ulang script ini');
    
  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
