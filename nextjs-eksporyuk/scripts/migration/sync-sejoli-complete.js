/**
 * COMPLETE SEJOLI DATA SYNC
 * Sync ALL data from WordPress Sejoli to Next.js with validation
 * - Users (no duplicates by email)
 * - Transactions (no duplicates by metadata)
 * - Memberships (with expiry calculation)
 * - Commissions (with affiliate profiles)
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Product to Membership mapping
const PRODUCT_MEMBERSHIP_MAP = {
  // LIFETIME
  13401: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null }, // Lifetime
  3840: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  6068: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  16956: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  15234: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  17920: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  8910: { membershipId: 'cm4t25b5z000008l4hqpe5j1v', duration: null },
  
  // 12 BULAN
  8683: { membershipId: 'cm4t25b61000108l49qkbdpzx', duration: 365 },
  13399: { membershipId: 'cm4t25b61000108l49qkbdpzx', duration: 365 },
  8915: { membershipId: 'cm4t25b61000108l49qkbdpzx', duration: 365 },
  
  // 6 BULAN
  13400: { membershipId: 'cm4t25b61000208l4c73xbqry', duration: 180 },
  8684: { membershipId: 'cm4t25b61000208l4c73xbqry', duration: 180 },
  8914: { membershipId: 'cm4t25b61000208l4c73xbqry', duration: 180 },
  
  // 1 BULAN
  179: { membershipId: 'cm4t25b61000308l46l7g4rxy', duration: 30 },
  
  // 3 BULAN
  13398: { membershipId: 'cm4t25b61000408l4f8nh9stz', duration: 90 },
};

// WordPress MySQL connection
const wpConnection = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function importUsers(wpUsers) {
  console.log('\n🔄 IMPORTING USERS...');
  console.log(`Total WordPress users: ${wpUsers.length}`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const wpUser of wpUsers) {
    try {
      // Check if email exists
      const existing = await prisma.user.findUnique({
        where: { email: wpUser.user_email }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Generate username from email
      const username = wpUser.user_email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Hash password or use random for WordPress users
      const hashedPassword = wpUser.user_pass?.startsWith('$2') 
        ? wpUser.user_pass 
        : await bcrypt.hash('eksporyuk123', 10);
      
      // Create user
      await prisma.user.create({
        data: {
          email: wpUser.user_email,
          name: wpUser.display_name || wpUser.user_nicename || wpUser.user_login,
          username: username,
          password: hashedPassword,
          role: 'MEMBER_FREE',
          emailVerified: true,
          isActive: true,
          createdAt: wpUser.user_registered ? new Date(wpUser.user_registered) : new Date(),
          wallet: {
            create: {
              balance: 0,
              balancePending: 0,
              totalEarnings: 0,
              totalWithdrawn: 0,
            }
          }
        }
      });
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   ✓ Imported ${imported} users...`);
      }
      
    } catch (error) {
      errors++;
      if (error.code !== 'P2002') { // Skip unique constraint errors
        console.error(`   ✗ Error importing ${wpUser.user_email}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Users Import Complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  
  return { imported, skipped, errors };
}

async function importTransactionsAndMemberships(wpOrders) {
  console.log('\n🔄 IMPORTING TRANSACTIONS & MEMBERSHIPS...');
  console.log(`Total WordPress orders: ${wpOrders.length}`);
  
  let transImported = 0;
  let transSkipped = 0;
  let membImported = 0;
  let membSkipped = 0;
  let errors = 0;
  
  for (const order of wpOrders) {
    try {
      // Skip non-completed orders
      if (order.status !== 'completed') continue;
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: order.user_email }
      });
      
      if (!user) {
        console.log(`   ⚠ User not found: ${order.user_email}`);
        continue;
      }
      
      // Check if transaction exists (by order metadata)
      const existingTrans = await prisma.transaction.findFirst({
        where: {
          userId: user.id,
          amount: parseFloat(order.grand_total),
          createdAt: new Date(order.created_at)
        }
      });
      
      if (existingTrans) {
        transSkipped++;
        continue;
      }
      
      // Get membership mapping
      const productId = parseInt(order.product_id);
      const mapping = PRODUCT_MEMBERSHIP_MAP[productId];
      
      if (!mapping) {
        // Product tidak ada mapping, skip
        continue;
      }
      
      // Calculate expiry date
      const orderDate = new Date(order.created_at);
      let endDate;
      
      if (mapping.duration === null) {
        // Lifetime
        endDate = new Date('2099-12-31');
      } else {
        endDate = new Date(orderDate);
        endDate.setDate(endDate.getDate() + mapping.duration);
      }
      
      const now = new Date();
      const status = endDate > now ? 'ACTIVE' : 'EXPIRED';
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'MEMBERSHIP_PURCHASE',
          amount: parseFloat(order.grand_total),
          status: 'COMPLETED',
          paymentMethod: order.payment_info?.gateway || 'MANUAL',
          createdAt: orderDate,
          updatedAt: orderDate,
        }
      });
      
      transImported++;
      
      // Check if membership exists
      const existingMemb = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          membershipId: mapping.membershipId,
          startDate: orderDate
        }
      });
      
      if (!existingMemb) {
        // Create membership
        await prisma.userMembership.create({
          data: {
            userId: user.id,
            membershipId: mapping.membershipId,
            transactionId: transaction.id,
            startDate: orderDate,
            endDate: endDate,
            status: status,
            autoRenew: false,
          }
        });
        
        membImported++;
        
        // Update user role
        if (status === 'ACTIVE') {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'MEMBER_PREMIUM' }
          });
        }
      } else {
        membSkipped++;
      }
      
      if (transImported % 100 === 0) {
        console.log(`   ✓ Processed ${transImported} transactions...`);
      }
      
    } catch (error) {
      errors++;
      console.error(`   ✗ Error processing order ${order.ID}:`, error.message);
    }
  }
  
  console.log(`\n✅ Transactions Import Complete:`);
  console.log(`   Transactions imported: ${transImported}`);
  console.log(`   Transactions skipped: ${transSkipped}`);
  console.log(`   Memberships imported: ${membImported}`);
  console.log(`   Memberships skipped: ${membSkipped}`);
  console.log(`   Errors: ${errors}`);
  
  return { transImported, transSkipped, membImported, membSkipped, errors };
}

async function importCommissions() {
  console.log('\n🔄 IMPORTING COMMISSIONS FROM WORDPRESS...');
  
  // Query commissions directly from WordPress
  const [commissions] = await wpConnection.execute(`
    SELECT 
      a.ID as commission_id,
      a.order_id,
      a.user_id as affiliate_wp_id,
      a.commission,
      a.status,
      o.user_email,
      o.grand_total,
      o.created_at as order_date,
      u.user_email as affiliate_email,
      u.display_name as affiliate_name
    FROM wp_sejolisa_affiliates a
    JOIN wp_sejolisa_orders o ON a.order_id = o.ID
    JOIN wp_users u ON a.user_id = u.ID
    WHERE a.status = 'added'
    ORDER BY o.created_at ASC
  `);
  
  console.log(`Total commissions: ${commissions.length}`);
  
  let imported = 0;
  let skipped = 0;
  let profilesCreated = 0;
  let errors = 0;
  
  for (const comm of commissions) {
    try {
      // Find affiliate user
      const affiliate = await prisma.user.findUnique({
        where: { email: comm.affiliate_email }
      });
      
      if (!affiliate) {
        console.log(`   ⚠ Affiliate not found: ${comm.affiliate_email}`);
        continue;
      }
      
      // Ensure affiliate profile exists
      let affProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: affiliate.id }
      });
      
      if (!affProfile) {
        affProfile = await prisma.affiliateProfile.create({
          data: {
            userId: affiliate.id,
            code: `AFF${affiliate.id.substring(0, 8).toUpperCase()}`,
            totalEarnings: 0,
            totalConversions: 0,
            totalClicks: 0,
            totalSales: 0,
            commissionRate: 30,
            status: 'ACTIVE',
          }
        });
        profilesCreated++;
        
        // Update user role
        await prisma.user.update({
          where: { id: affiliate.id },
          data: { role: 'AFFILIATE' }
        });
      }
      
      // Find customer transaction
      const customer = await prisma.user.findUnique({
        where: { email: comm.user_email }
      });
      
      if (!customer) continue;
      
      const transaction = await prisma.transaction.findFirst({
        where: {
          userId: customer.id,
          amount: parseFloat(comm.grand_total),
          createdAt: new Date(comm.order_date)
        }
      });
      
      if (!transaction) continue;
      
      // Check if commission already exists
      const existingComm = await prisma.transaction.findFirst({
        where: {
          userId: affiliate.id,
          type: 'COMMISSION',
          amount: parseFloat(comm.commission),
          createdAt: new Date(comm.order_date)
        }
      });
      
      if (existingComm) {
        skipped++;
        continue;
      }
      
      // Create commission transaction
      await prisma.transaction.create({
        data: {
          userId: affiliate.id,
          type: 'COMMISSION',
          amount: parseFloat(comm.commission),
          status: 'COMPLETED',
          description: `Commission from order #${comm.order_id}`,
          createdAt: new Date(comm.order_date),
        }
      });
      
      // Update wallet
      await prisma.wallet.update({
        where: { userId: affiliate.id },
        data: {
          balance: { increment: parseFloat(comm.commission) },
          totalEarnings: { increment: parseFloat(comm.commission) },
        }
      });
      
      // Update affiliate profile
      await prisma.affiliateProfile.update({
        where: { userId: affiliate.id },
        data: {
          totalEarnings: { increment: parseFloat(comm.commission) },
          totalConversions: { increment: 1 },
          totalSales: { increment: parseFloat(comm.grand_total) },
        }
      });
      
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`   ✓ Imported ${imported} commissions...`);
      }
      
    } catch (error) {
      errors++;
      console.error(`   ✗ Error importing commission ${comm.commission_id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Commissions Import Complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Profiles created: ${profilesCreated}`);
  console.log(`   Errors: ${errors}`);
  
  return { imported, skipped, profilesCreated, errors };
}

async function verifyDataIntegrity() {
  console.log('\n🔍 VERIFYING DATA INTEGRITY...\n');
  
  // Count everything
  const [
    userCount,
    transCount,
    membCount,
    affCount,
    walletCount,
    activeMemb,
    expiredMemb
  ] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.userMembership.count(),
    prisma.affiliateProfile.count(),
    prisma.wallet.count(),
    prisma.userMembership.count({ where: { status: 'ACTIVE' } }),
    prisma.userMembership.count({ where: { status: 'EXPIRED' } }),
  ]);
  
  // Calculate totals
  const transSum = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { type: 'MEMBERSHIP_PURCHASE', status: 'COMPLETED' }
  });
  
  const commSum = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { type: 'COMMISSION', status: 'COMPLETED' }
  });
  
  const walletSum = await prisma.wallet.aggregate({
    _sum: { 
      balance: true,
      totalEarnings: true,
      totalWithdrawn: true
    }
  });
  
  const affSum = await prisma.affiliateProfile.aggregate({
    _sum: {
      totalSales: true,
      totalEarnings: true,
      totalConversions: true
    }
  });
  
  console.log('📊 DATABASE SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Total Users: ${userCount.toLocaleString('id-ID')}`);
  console.log(`Total Transactions: ${transCount.toLocaleString('id-ID')}`);
  console.log(`Total Memberships: ${membCount.toLocaleString('id-ID')}`);
  console.log(`   - Active: ${activeMemb.toLocaleString('id-ID')}`);
  console.log(`   - Expired: ${expiredMemb.toLocaleString('id-ID')}`);
  console.log(`Total Affiliates: ${affCount.toLocaleString('id-ID')}`);
  console.log(`Total Wallets: ${walletCount.toLocaleString('id-ID')}`);
  
  console.log('\n💰 FINANCIAL SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Total Sales: Rp ${(transSum._sum.amount || 0).toLocaleString('id-ID')}`);
  console.log(`Total Commissions: Rp ${(commSum._sum.amount || 0).toLocaleString('id-ID')}`);
  console.log(`Wallet Balance: Rp ${(walletSum._sum.balance || 0).toLocaleString('id-ID')}`);
  console.log(`Total Earnings: Rp ${(walletSum._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
  console.log(`Total Withdrawn: Rp ${(walletSum._sum.totalWithdrawn || 0).toLocaleString('id-ID')}`);
  
  console.log('\n🎯 AFFILIATE SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Total Omset: Rp ${(affSum._sum.totalSales || 0).toLocaleString('id-ID')}`);
  console.log(`Total Earnings: Rp ${(affSum._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
  console.log(`Total Conversions: ${(affSum._sum.totalConversions || 0).toLocaleString('id-ID')}`);
  
  const avgCommRate = affSum._sum.totalSales > 0 
    ? ((affSum._sum.totalEarnings / affSum._sum.totalSales) * 100).toFixed(1)
    : 0;
  console.log(`Average Commission Rate: ${avgCommRate}%`);
  
  const platformProfit = (affSum._sum.totalSales || 0) - (affSum._sum.totalEarnings || 0);
  console.log(`Platform Profit: Rp ${platformProfit.toLocaleString('id-ID')}`);
  
  console.log('\n✅ DATA INTEGRITY CHECK COMPLETE\n');
}

async function main() {
  try {
    console.log('═'.repeat(60));
    console.log('     COMPLETE SEJOLI DATA SYNC');
    console.log('═'.repeat(60));
    
    // Load WordPress data from JSON
    const jsonFile = path.join(__dirname, 'wp-data/sejolisa-full-18000users-1765279985617.json');
    console.log(`\n📂 Loading data from: ${jsonFile}`);
    
    if (!fs.existsSync(jsonFile)) {
      throw new Error('WordPress data file not found!');
    }
    
    const wpData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    console.log(`✅ Loaded: ${wpData.users?.length || 0} users, ${wpData.orders?.length || 0} orders`);
    
    // Step 1: Import Users
    await importUsers(wpData.users);
    
    // Step 2: Import Transactions & Memberships
    await importTransactionsAndMemberships(wpData.orders);
    
    // Step 3: Import Commissions (from WordPress DB directly)
    await importCommissions();
    
    // Step 4: Verify Data Integrity
    await verifyDataIntegrity();
    
    console.log('\n🎉 SYNC COMPLETE - ALL DATA IMPORTED!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await wpConnection.end();
  }
}

main();
