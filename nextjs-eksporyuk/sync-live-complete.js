/**
 * COMPLETE LIVE SYNC FROM WORDPRESS SEJOLI
 * - Fetch fresh data from live database
 * - Import transactions with real commission data
 * - Create affiliate profiles ONLY for users who earned commission
 * - Map products to correct membership tiers
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const LIVE_DB = {
  host: '103.125.181.47',
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  port: 3306
};

const prisma = new PrismaClient();

// Membership IDs in new system
const MEMBERSHIPS = {
  LIFETIME: 'cmj547h7y001eit1eirlzdklz',
  M12: 'cmj547h4d001dit1edotcuy8b',
  M6: 'cmj547h01001cit1e7n2znhuo',
  M3: 'cmj547gwo001bit1egx205tsi',
  M1: 'cmj547gmc001ait1en83tmjdc'
};

const DURATION_DAYS = {
  [MEMBERSHIPS.LIFETIME]: null,
  [MEMBERSHIPS.M12]: 365,
  [MEMBERSHIPS.M6]: 180,
  [MEMBERSHIPS.M3]: 90,
  [MEMBERSHIPS.M1]: 30
};

(async () => {
  console.log('🚀 STARTING LIVE SYNC FROM WORDPRESS SEJOLI\n');
  console.log('═'.repeat(80));
  
  let mysqlConn;
  
  try {
    // Connect to live MySQL
    console.log('🔌 Connecting to live WordPress database...');
    mysqlConn = await mysql.createConnection(LIVE_DB);
    console.log('✅ Connected to:', LIVE_DB.host, '\n');
    
    // ========================================
    // STEP 1: Get product-to-membership mapping from live DB
    // ========================================
    console.log('📦 STEP 1: Fetching product metadata from live...\n');
    
    const [products] = await mysqlConn.execute(`
      SELECT 
        p.ID as product_id,
        p.post_title as product_name,
        MAX(CASE WHEN pm.meta_key = 'duration_value' THEN pm.meta_value END) as duration_value,
        MAX(CASE WHEN pm.meta_key = 'duration_type' THEN pm.meta_value END) as duration_type,
        MAX(CASE WHEN pm.meta_key = 'price' THEN pm.meta_value END) as price
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'sejoli-product'
      AND p.post_status = 'publish'
      GROUP BY p.ID, p.post_title
      ORDER BY p.ID
    `);
    
    console.log(`Found ${products.length} products\n`);
    
    // Build product mapping based on duration
    const productMapping = {};
    
    products.forEach(p => {
      const duration = parseInt(p.duration_value) || 0;
      const type = p.duration_type || 'day';
      
      let membershipId;
      
      if (type === 'lifetime' || duration === 0) {
        membershipId = MEMBERSHIPS.LIFETIME;
      } else if (type === 'year' || duration >= 365) {
        membershipId = MEMBERSHIPS.M12;
      } else if (duration >= 180) {
        membershipId = MEMBERSHIPS.M6;
      } else if (duration >= 90) {
        membershipId = MEMBERSHIPS.M3;
      } else {
        membershipId = MEMBERSHIPS.M1;
      }
      
      productMapping[p.product_id] = {
        membershipId,
        name: p.product_name,
        duration,
        type,
        price: parseFloat(p.price) || 0
      };
      
      console.log(`  Product ${p.product_id}: ${p.product_name.substring(0, 40)} → ${duration} ${type} → ${membershipId === MEMBERSHIPS.LIFETIME ? 'LIFETIME' : membershipId === MEMBERSHIPS.M12 ? '12 BULAN' : membershipId === MEMBERSHIPS.M6 ? '6 BULAN' : membershipId === MEMBERSHIPS.M3 ? '3 BULAN' : '1 BULAN'}`);
    });
    
    console.log('\n');
    
    // ========================================
    // STEP 2: Fetch all orders from live
    // ========================================
    console.log('💳 STEP 2: Fetching orders from live...\n');
    
    const [orders] = await mysqlConn.execute(`
      SELECT 
        o.ID,
        o.user_id,
        o.product_id,
        o.grand_total,
        o.affiliate_id,
        o.affiliate_commission,
        o.status,
        o.created_at,
        u.user_email
      FROM wp_sejoli_order o
      LEFT JOIN wp_users u ON o.user_id = u.ID
      WHERE o.status = 'completed'
      ORDER BY o.created_at ASC
    `);
    
    console.log(`Found ${orders.length} completed orders\n`);
    
    // ========================================
    // STEP 3: Build user mapping
    // ========================================
    console.log('👥 STEP 3: Building user mapping...\n');
    
    const dbUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    const userEmailToId = new Map();
    dbUsers.forEach(u => userEmailToId.set(u.email, u.id));
    
    console.log(`Mapped ${userEmailToId.size} users\n`);
    
    // ========================================
    // STEP 4: Track affiliate earnings
    // ========================================
    console.log('🤝 STEP 4: Calculating affiliate earnings...\n');
    
    const affiliateEarnings = new Map(); // userId => total commission
    
    orders.forEach(order => {
      if (order.affiliate_id && order.affiliate_id > 0 && order.affiliate_commission && order.affiliate_commission > 0) {
        // Get affiliate email from live DB
        const affUserId = userEmailToId.get(order.user_email);
        if (affUserId) {
          if (!affiliateEarnings.has(affUserId)) {
            affiliateEarnings.set(affUserId, { totalCommission: 0, orders: 0 });
          }
          const stats = affiliateEarnings.get(affUserId);
          stats.totalCommission += parseFloat(order.affiliate_commission);
          stats.orders += 1;
        }
      }
    });
    
    console.log(`Found ${affiliateEarnings.size} users with affiliate commissions\n`);
    
    // ========================================
    // STEP 5: Import transactions & memberships
    // ========================================
    console.log('💾 STEP 5: Importing transactions & memberships...\n');
    console.log('═'.repeat(80));
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const order of orders) {
      try {
        // Get user ID
        const userId = userEmailToId.get(order.user_email);
        if (!userId) {
          skipped++;
          continue;
        }
        
        // Get membership mapping
        const productInfo = productMapping[order.product_id];
        if (!productInfo) {
          skipped++;
          continue;
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        
        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            type: 'MEMBERSHIP',
            amount,
            status: 'SUCCESS',
            description: `Purchase: ${productInfo.name}`,
            metadata: JSON.stringify({
              sejoliOrderId: order.ID,
              productId: order.product_id,
              affiliateId: order.affiliate_id,
              affiliateCommission: order.affiliate_commission
            }),
            createdAt: new Date(order.created_at)
          }
        });
        
        // Create/update membership
        const startDate = new Date(order.created_at);
        const duration = DURATION_DAYS[productInfo.membershipId];
        let expiryDate = null;
        
        if (duration) {
          expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + duration);
        }
        
        await prisma.userMembership.upsert({
          where: { userId },
          update: {
            membershipId: productInfo.membershipId,
            status: 'ACTIVE',
            startDate,
            expiryDate
          },
          create: {
            userId,
            membershipId: productInfo.membershipId,
            status: 'ACTIVE',
            startDate,
            expiryDate,
            autoRenew: false
          }
        });
        
        imported++;
        
        if (imported % 500 === 0) {
          console.log(`  ✓ Imported ${imported} / ${orders.length} orders...`);
        }
        
      } catch (error) {
        errors++;
        if (errors <= 3) {
          console.log(`  ⚠️  Error on order ${order.ID}:`, error.message);
        }
      }
    }
    
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('✅ TRANSACTION IMPORT COMPLETE');
    console.log('═'.repeat(80));
    console.log(`  Imported: ${imported}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log('');
    
    // ========================================
    // STEP 6: Create affiliate profiles
    // ========================================
    console.log('🤝 STEP 6: Creating affiliate profiles (only who earned commission)...\n');
    
    let affiliatesCreated = 0;
    
    for (const [userId, stats] of affiliateEarnings.entries()) {
      try {
        // Create affiliate profile
        await prisma.affiliateProfile.upsert({
          where: { userId },
          update: {
            totalCommission: stats.totalCommission,
            totalSales: stats.orders
          },
          create: {
            userId,
            isActive: true,
            approvalStatus: 'APPROVED',
            totalSales: stats.orders,
            totalCommission: stats.totalCommission,
            commissionRate: '30'
          }
        });
        
        // Update wallet balance
        await prisma.wallet.update({
          where: { userId },
          data: {
            balance: { increment: stats.totalCommission },
            totalEarnings: { increment: stats.totalCommission }
          }
        });
        
        affiliatesCreated++;
        
        if (affiliatesCreated % 50 === 0) {
          console.log(`  ✓ Created ${affiliatesCreated} affiliate profiles...`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Error creating affiliate for user ${userId}:`, error.message);
      }
    }
    
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('✅ AFFILIATE SYNC COMPLETE');
    console.log('═'.repeat(80));
    console.log(`  Affiliates created: ${affiliatesCreated}`);
    console.log(`  Total commission: Rp ${Array.from(affiliateEarnings.values()).reduce((sum, s) => sum + s.totalCommission, 0).toLocaleString()}`);
    console.log('');
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    const [finalUsers, finalTx, finalMem, finalAff] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.userMembership.count(),
      prisma.affiliateProfile.count()
    ]);
    
    console.log('═'.repeat(80));
    console.log('🎉 LIVE SYNC COMPLETE!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📊 FINAL DATABASE STATUS:');
    console.log(`  👥 Users: ${finalUsers.toLocaleString()}`);
    console.log(`  💳 Transactions: ${finalTx.toLocaleString()}`);
    console.log(`  🎫 Active Memberships: ${finalMem.toLocaleString()}`);
    console.log(`  🤝 Affiliates: ${finalAff.toLocaleString()}`);
    console.log('');
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    await prisma.$disconnect();
  }
})();
