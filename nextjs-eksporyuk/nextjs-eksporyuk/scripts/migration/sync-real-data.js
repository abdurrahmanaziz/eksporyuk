const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// WordPress Database Connection
let wpConnection;

async function initWpConnection() {
  wpConnection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'aziz_member.eksporyuk.com',
    password: 'E%ds(xRh3T]AA|Qh',
    database: 'aziz_member.eksporyuk.com'
  });
}

// Product to Membership Mapping (dari script sebelumnya)
const PRODUCT_MAPPING = {
  LIFETIME: [13401, 3840, 6068, 16956, 15234, 17920, 8910],
  TWELVE_MONTH: [8683, 13399, 8915], 
  SIX_MONTH: [13400, 8684, 8914],
  ONE_MONTH: [179],
  THREE_MONTH: [13398]
};

// Get membership ID mapping
const getMembershipMapping = async () => {
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true }
  });
  
  return {
    LIFETIME: memberships.find(m => m.name.includes('Lifetime'))?.id,
    TWELVE_MONTH: memberships.find(m => m.name.includes('12 Bulan'))?.id,
    SIX_MONTH: memberships.find(m => m.name.includes('6 Bulan'))?.id,
    ONE_MONTH: memberships.find(m => m.name.includes('1 Bulan'))?.id,
    THREE_MONTH: memberships.find(m => m.name.includes('3 Bulan'))?.id
  };
};

// Map product ID to membership
const getProductMembership = (productId) => {
  for (const [type, products] of Object.entries(PRODUCT_MAPPING)) {
    if (products.includes(productId)) {
      return type;
    }
  }
  return null;
};

// Calculate expiry date
const calculateExpiryDate = (orderDate, membershipType) => {
  const date = new Date(orderDate);
  
  switch (membershipType) {
    case 'LIFETIME':
      return new Date('2099-12-31');
    case 'TWELVE_MONTH':
      date.setFullYear(date.getFullYear() + 1);
      return date;
    case 'SIX_MONTH':
      date.setMonth(date.getMonth() + 6);
      return date;
    case 'THREE_MONTH':
      date.setMonth(date.getMonth() + 3);
      return date;
    case 'ONE_MONTH':
      date.setMonth(date.getMonth() + 1);
      return date;
    default:
      return new Date(); // Expired
  }
};

// Step 1: Sync Users
async function syncUsers() {
  console.log('\n🚀 Syncing Users from WordPress...');
  
  const [wpUsers] = await wpConnection.execute(`
    SELECT 
      u.ID,
      u.user_login,
      u.user_email,
      u.user_nicename,
      u.display_name,
      u.user_registered,
      u.user_status,
      m1.meta_value as first_name,
      m2.meta_value as phone,
      m3.meta_value as profile_pic
    FROM wp_users u
    LEFT JOIN wp_usermeta m1 ON u.ID = m1.user_id AND m1.meta_key = 'first_name'
    LEFT JOIN wp_usermeta m2 ON u.ID = m2.user_id AND m2.meta_key = 'billing_phone'
    LEFT JOIN wp_usermeta m3 ON u.ID = m3.user_id AND m3.meta_key = 'profile_picture_url'
    ORDER BY u.ID
  `);

  console.log(`📊 Found ${wpUsers.length} WordPress users`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const wpUser of wpUsers) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: wpUser.user_email }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Generate username if needed
      let username = wpUser.user_login;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${wpUser.user_login}${counter}`;
        counter++;
      }
      
      // Create user
      await prisma.user.create({
        data: {
          email: wpUser.user_email,
          username: username,
          name: wpUser.display_name || wpUser.first_name || wpUser.user_nicename,
          password: await bcrypt.hash('defaultpassword123', 10),
          whatsapp: wpUser.phone || '',
          avatar: wpUser.profile_pic || null,
          role: 'MEMBER_FREE',
          isActive: wpUser.user_status === '0',
          createdAt: new Date(wpUser.user_registered),
          wallet: {
            create: {
              balance: 0,
              balancePending: 0,
              totalEarnings: 0,
              totalWithdrawals: 0
            }
          }
        }
      });
      
      created++;
      
      if (created % 100 === 0) {
        console.log(`   ✓ Created ${created} users...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error creating user ${wpUser.user_email}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Users sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
}

// Step 2: Sync Transactions  
async function syncTransactions() {
  console.log('\n🚀 Syncing Transactions from WordPress...');
  
  const [wpOrders] = await wpConnection.execute(`
    SELECT 
      o.*,
      p.post_title as product_name,
      u.user_email
    FROM wp_sejolisa_orders o
    LEFT JOIN wp_posts p ON o.product_id = p.ID
    LEFT JOIN wp_users u ON o.user_id = u.ID
    WHERE o.status IN ('completed', 'pending', 'failed', 'refunded')
    ORDER BY o.created_at DESC
  `);

  console.log(`📊 Found ${wpOrders.length} WordPress orders`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of wpOrders) {
    try {
      // Check if transaction already exists
      const existing = await prisma.transaction.findFirst({
        where: {
          AND: [
            { amount: parseFloat(order.grand_total) },
            { createdAt: new Date(order.created_at) }
          ]
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: order.user_email }
      });
      
      if (!user) {
        console.log(`   ⚠️  User not found for order ${order.id}`);
        errors++;
        continue;
      }
      
      // Map status
      const statusMap = {
        'completed': 'COMPLETED',
        'pending': 'PENDING', 
        'failed': 'FAILED',
        'refunded': 'REFUNDED'
      };
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: parseFloat(order.grand_total),
          currency: 'IDR',
          status: statusMap[order.status] || 'PENDING',
          description: `Purchase: ${order.product_name}`,
          paymentMethod: order.gateway || 'UNKNOWN',
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at || order.created_at),
          metadata: {
            wpOrderId: order.id,
            productId: order.product_id,
            couponCode: order.coupon_used,
            affiliateId: order.affiliate_id
          }
        }
      });
      
      created++;
      
      if (created % 50 === 0) {
        console.log(`   ✓ Created ${created} transactions...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error creating transaction ${order.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Transactions sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
}

// Step 3: Sync Memberships
async function syncMemberships() {
  console.log('\n🚀 Syncing Memberships from WordPress orders...');
  
  const membershipMapping = await getMembershipMapping();
  console.log('Membership mapping:', membershipMapping);
  
  const [wpOrders] = await wpConnection.execute(`
    SELECT 
      o.id,
      o.user_id,
      o.product_id,
      o.status,
      o.created_at,
      u.user_email
    FROM wp_sejolisa_orders o
    LEFT JOIN wp_users u ON o.user_id = u.ID
    WHERE o.status = 'completed'
    AND o.product_id IN (${Object.values(PRODUCT_MAPPING).flat().join(',')})
    ORDER BY o.created_at DESC
  `);

  console.log(`📊 Found ${wpOrders.length} completed orders with memberships`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of wpOrders) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: order.user_email }
      });
      
      if (!user) {
        errors++;
        continue;
      }
      
      // Get membership type
      const membershipType = getProductMembership(order.product_id);
      if (!membershipType) {
        continue;
      }
      
      const membershipId = membershipMapping[membershipType];
      if (!membershipId) {
        console.log(`   ⚠️  Membership ID not found for type: ${membershipType}`);
        continue;
      }
      
      // Check if membership already exists
      const existing = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          membershipId: membershipId
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Calculate expiry
      const endDate = calculateExpiryDate(order.created_at, membershipType);
      const now = new Date();
      const status = endDate > now ? 'ACTIVE' : 'EXPIRED';
      
      // Create membership
      await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId: membershipId,
          status: status,
          startDate: new Date(order.created_at),
          endDate: endDate,
          createdAt: new Date(order.created_at)
        }
      });
      
      // Update user role if active membership
      if (status === 'ACTIVE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'MEMBER_PREMIUM' }
        });
      }
      
      created++;
      
      if (created % 50 === 0) {
        console.log(`   ✓ Created ${created} memberships...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error creating membership for order ${order.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Memberships sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
}

// Step 4: Sync Commissions
async function syncCommissions() {
  console.log('\n🚀 Syncing Commissions from WordPress...');
  
  const [wpCommissions] = await wpConnection.execute(`
    SELECT 
      a.*,
      u.user_email,
      o.grand_total,
      o.created_at as order_date
    FROM wp_sejolisa_affiliates a
    LEFT JOIN wp_users u ON a.user_id = u.ID
    LEFT JOIN wp_sejolisa_orders o ON a.order_id = o.id
    WHERE a.status = 'added'
    ORDER BY a.created_at DESC
  `);

  console.log(`📊 Found ${wpCommissions.length} WordPress commissions`);
  
  let updated = 0;
  let created = 0;
  let errors = 0;
  
  for (const comm of wpCommissions) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: comm.user_email },
        include: {
          wallet: true,
          affiliateProfile: true
        }
      });
      
      if (!user) {
        console.log(`   ⚠️  User not found: ${comm.user_email}`);
        errors++;
        continue;
      }
      
      const commissionAmount = parseFloat(comm.commission);
      const salesAmount = parseFloat(comm.grand_total || 0);
      
      // Create/update affiliate profile
      if (!user.affiliateProfile) {
        await prisma.affiliateProfile.create({
          data: {
            userId: user.id,
            affiliateCode: user.username.toUpperCase(),
            totalSales: salesAmount,
            totalEarnings: commissionAmount,
            totalConversions: 1,
            isActive: true
          }
        });
        created++;
      } else {
        // Update existing
        await prisma.affiliateProfile.update({
          where: { userId: user.id },
          data: {
            totalSales: { increment: salesAmount },
            totalEarnings: { increment: commissionAmount },
            totalConversions: { increment: 1 }
          }
        });
        updated++;
      }
      
      // Update wallet
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: commissionAmount },
          totalEarnings: { increment: commissionAmount }
        }
      });
      
      // Update user role to AFFILIATE if not already
      if (user.role !== 'AFFILIATE' && user.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'AFFILIATE' }
        });
      }
      
      if ((updated + created) % 25 === 0) {
        console.log(`   ✓ Processed ${updated + created} commissions...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing commission ${comm.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Commissions sync complete: ${created} created, ${updated} updated, ${errors} errors`);
}

// Step 5: Final Verification
async function verifySync() {
  console.log('\n🔍 Running Final Verification...');
  
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
    prisma.user.count({ where: { role: 'MEMBER_FREE' } }),
    prisma.user.count({ where: { role: 'AFFILIATE' } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    prisma.userMembership.count(),
    prisma.userMembership.count({ where: { status: 'ACTIVE' } }),
    prisma.affiliateProfile.count()
  ]);
  
  console.log('\n📊 FINAL STATISTICS:');
  console.log('═'.repeat(50));
  console.log(`Total Users: ${stats[0]}`);
  console.log(`  - Premium Members: ${stats[1]}`);
  console.log(`  - Free Members: ${stats[2]}`);  
  console.log(`  - Affiliates: ${stats[3]}`);
  console.log(`Total Transactions: ${stats[4]}`);
  console.log(`  - Completed: ${stats[5]}`);
  console.log(`Total Memberships: ${stats[6]}`);
  console.log(`  - Active: ${stats[7]}`);
  console.log(`Affiliate Profiles: ${stats[8]}`);
  
  // Check for duplicates
  const duplicateEmails = await prisma.user.groupBy({
    by: ['email'],
    having: {
      email: {
        _count: {
          gt: 1
        }
      }
    }
  });
  
  if (duplicateEmails.length > 0) {
    console.log(`\n⚠️  Found ${duplicateEmails.length} duplicate emails!`);
  } else {
    console.log('\n✅ No duplicate emails found');
  }
  
  console.log('\n🎉 DATA SYNC COMPLETED SUCCESSFULLY!');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Real Data Sync from WordPress Sejoli...');
    console.log('⏰ Start time:', new Date().toLocaleString());
    
    // Initialize WordPress connection
    await initWpConnection();
    console.log('✅ WordPress database connected');
    
    await syncUsers();
    await syncTransactions();
    await syncMemberships();
    await syncCommissions();
    await verifySync();
    
    console.log('\n✅ All sync operations completed!');
    console.log('⏰ End time:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    if (wpConnection) {
      await wpConnection.end();
    }
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}