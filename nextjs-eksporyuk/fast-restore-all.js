/**
 * FAST RESTORE - Import ALL data from Sejoli JSON
 * Users, Transactions, Memberships, Affiliates, Commissions
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Membership mapping
const MEMBERSHIP_MAP = {
  13401: 'cm4t25b5z000008l4hqpe5j1v', // Lifetime
  3840: 'cm4t25b5z000008l4hqpe5j1v',
  6068: 'cm4t25b5z000008l4hqpe5j1v',
  16956: 'cm4t25b5z000008l4hqpe5j1v',
  15234: 'cm4t25b5z000008l4hqpe5j1v',
  17920: 'cm4t25b5z000008l4hqpe5j1v',
  8910: 'cm4t25b5z000008l4hqpe5j1v',
  8683: 'cm4t25b61000108l49qkbdpzx', // 12 Bulan
  13399: 'cm4t25b61000108l49qkbdpzx',
  8915: 'cm4t25b61000108l49qkbdpzx',
  13400: 'cm4t25b61000208l4c73xbqry', // 6 Bulan
  8684: 'cm4t25b61000208l4c73xbqry',
  8914: 'cm4t25b61000208l4c73xbqry',
  179: 'cm4t25b61000308l46l7g4rxy', // 1 Bulan
  13398: 'cm4t25b61000408l4f8nh9stz', // 3 Bulan
};

const DURATION_MAP = {
  13401: null, 3840: null, 6068: null, 16956: null, 15234: null, 17920: null, 8910: null,
  8683: 365, 13399: 365, 8915: 365,
  13400: 180, 8684: 180, 8914: 180,
  179: 30,
  13398: 90,
};

async function main() {
  console.log('\n🚀 FAST RESTORE - SEMUA DATA SEJOLI\n');
  
  // Load JSON
  const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
  console.log('📂 Loading:', jsonPath);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`✅ Loaded: ${data.users.length} users, ${data.orders.length} orders\n`);
  
  // BATCH 1: Users with Wallets (FAST - no bcrypt, use default password)
  console.log('🔄 BATCH IMPORT USERS...');
  const defaultPassword = await bcrypt.hash('eksporyuk123', 10);
  const userBatch = [];
  const emailSet = new Set();
  
  for (const wp of data.users) {
    if (emailSet.has(wp.user_email)) continue;
    emailSet.add(wp.user_email);
    
    const username = wp.user_login.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50) || 
                    `user${wp.ID}`;
    
    userBatch.push({
      email: wp.user_email,
      name: wp.display_name || wp.user_nicename || wp.user_login,
      username: username,
      password: defaultPassword,
      role: 'MEMBER_FREE',
      emailVerified: true,
      isActive: true,
      createdAt: wp.user_registered ? new Date(wp.user_registered) : new Date(),
      wallet: {
        create: {
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalPayout: 0,
        }
      }
    });
    
    // Insert in batches of 100
    if (userBatch.length >= 100) {
      try {
        await Promise.all(
          userBatch.map(u => prisma.user.create({ data: u }).catch(() => null))
        );
        console.log(`   ✓ ${userBatch.length} users imported`);
      } catch (e) {
        console.log(`   ⚠ Batch error:`, e.message);
      }
      userBatch.length = 0;
    }
  }
  
  // Insert remaining
  if (userBatch.length > 0) {
    await Promise.all(
      userBatch.map(u => prisma.user.create({ data: u }).catch(() => null))
    );
    console.log(`   ✓ ${userBatch.length} users imported`);
  }
  
  const totalUsers = await prisma.user.count();
  console.log(`✅ Total users in DB: ${totalUsers}\n`);
  
  // BATCH 2: Transactions & User Memberships
  console.log('🔄 IMPORT TRANSAKSI & MEMBERSHIP...');
  let transactionCount = 0;
  let membershipCount = 0;
  
  for (const order of data.orders) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: order.user_email }
      });
      
      if (!user) continue;
      
      const productId = parseInt(order.product_id);
      const membershipId = MEMBERSHIP_MAP[productId];
      const duration = DURATION_MAP[productId];
      
      if (!membershipId) continue;
      
      // Create transaction
      const total = parseFloat(order.grand_total || order.total || 0);
      const affiliateCommission = parseFloat(order.affiliate_commission || 0);
      
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'MEMBERSHIP_PURCHASE',
          amount: total,
          status: order.status === 'completed' ? 'SUCCESS' : 'PENDING',
          description: `Purchase ${order.product_name}`,
          metadata: JSON.stringify({
            orderId: order.order_id,
            productId: productId,
            productName: order.product_name,
            affiliateId: order.affiliate_id,
            affiliateCommission: affiliateCommission,
          }),
          createdAt: order.order_date ? new Date(order.order_date) : new Date(),
        }
      });
      transactionCount++;
      
      // Create user membership
      if (order.status === 'completed') {
        const startDate = order.order_date ? new Date(order.order_date) : new Date();
        let expiryDate = null;
        
        if (duration) {
          expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + duration);
        }
        
        await prisma.userMembership.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            membershipId: membershipId,
            status: 'ACTIVE',
            startDate: startDate,
            expiryDate: expiryDate,
            autoRenew: false,
          }
        });
        membershipCount++;
      }
      
      if (transactionCount % 100 === 0) {
        console.log(`   ✓ ${transactionCount} transactions, ${membershipCount} memberships`);
      }
      
    } catch (e) {
      // Skip errors
    }
  }
  
  console.log(`✅ Total: ${transactionCount} transactions, ${membershipCount} memberships\n`);
  
  // BATCH 3: Affiliate Profiles & Commissions
  console.log('🔄 IMPORT AFFILIATE DATA...');
  let affiliateCount = 0;
  
  for (const order of data.orders) {
    try {
      if (!order.affiliate_id || !order.affiliate_email) continue;
      
      const affiliate = await prisma.user.findUnique({
        where: { email: order.affiliate_email }
      });
      
      if (!affiliate) continue;
      
      // Create/update affiliate profile
      await prisma.affiliateProfile.upsert({
        where: { userId: affiliate.id },
        update: {},
        create: {
          userId: affiliate.id,
          isActive: true,
          approvalStatus: 'APPROVED',
          totalSales: 0,
          totalCommission: 0,
        }
      });
      
      // Update wallet with commission
      const commission = parseFloat(order.affiliate_commission || 0);
      if (commission > 0 && order.status === 'completed') {
        await prisma.wallet.update({
          where: { userId: affiliate.id },
          data: {
            balance: { increment: commission },
            totalEarnings: { increment: commission },
          }
        });
        affiliateCount++;
      }
      
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`✅ Total: ${affiliateCount} affiliate commissions\n`);
  
  // Summary
  const finalUsers = await prisma.user.count();
  const finalTx = await prisma.transaction.count();
  const finalMembers = await prisma.userMembership.count();
  const finalAffiliates = await prisma.affiliateProfile.count();
  
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 RESTORE SELESAI!');
  console.log('═══════════════════════════════════════');
  console.log(`👥 Users: ${finalUsers}`);
  console.log(`💳 Transactions: ${finalTx}`);
  console.log(`🎫 Memberships: ${finalMembers}`);
  console.log(`🤝 Affiliates: ${finalAffiliates}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
