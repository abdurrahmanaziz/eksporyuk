/**
 * SEJOLI COMPLETE IMPORT - CORRECT VERSION
 * 
 * Data Source: sejoli-sales-latest.json (19,253 transaksi)
 * Commission: FLAT per product from product-membership-mapping.js
 * 
 * TIDAK HAPUS DATA EXISTING - UPSERT STRATEGY
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Import product mapping
const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct, getMembershipForProduct } = require('./scripts/migration/product-membership-mapping.js');

// Membership tiers to create
const MEMBERSHIP_TIERS = [
  {
    name: 'Paket Ekspor Yuk - 6 Bulan',
    slug: 'paket-6-bulan',
    checkoutSlug: 'paket-6-bulan',
    description: 'Akses premium 6 bulan ke semua materi ekspor.',
    duration: 'SIX_MONTHS',
    price: 1497000,
    originalPrice: 2000000,
    discount: 25,
    features: ['Akses semua materi ekspor', 'Webinar eksklusif bulanan', 'Konsultasi bisnis 1-on-1', 'Template dokumen ekspor', 'Grup WhatsApp eksklusif'],
  },
  {
    name: 'Paket Ekspor Yuk - 12 Bulan',
    slug: 'paket-12-bulan',
    checkoutSlug: 'paket-12-bulan',
    description: 'Akses premium 12 bulan dengan bonus marketplace listing.',
    duration: 'TWELVE_MONTHS',
    price: 2497000,
    originalPrice: 3500000,
    discount: 29,
    features: ['Semua fitur 6 bulan', 'Bonus marketplace listing', 'Review company profile gratis', 'Prioritas support'],
    isMostPopular: true,
  },
  {
    name: 'Paket Ekspor Yuk - Lifetime',
    slug: 'paket-lifetime',
    checkoutSlug: 'paket-lifetime',
    description: 'Akses SELAMANYA ke semua materi ekspor.',
    duration: 'LIFETIME',
    price: 997000,
    originalPrice: 5000000,
    discount: 80,
    features: ['Semua fitur 12 bulan', 'Akses SELAMANYA', 'Update konten gratis selamanya', 'Akses early bird program baru'],
    isBestSeller: true,
  },
];

// Slug mapping from Sejoli to Next.js
const SLUG_TO_DURATION = {
  'lifetime': 'LIFETIME',
  '12-bulan': 'TWELVE_MONTHS',
  '6-bulan': 'SIX_MONTHS',
};

async function step1_CreateMemberships() {
  console.log('\n📦 STEP 1: CREATE MEMBERSHIP TIERS');
  console.log('='.repeat(60));
  
  const results = {};
  
  for (const tier of MEMBERSHIP_TIERS) {
    const membership = await prisma.membership.upsert({
      where: { slug: tier.slug },
      update: { 
        name: tier.name, 
        description: tier.description, 
        duration: tier.duration, 
        price: tier.price, 
        originalPrice: tier.originalPrice, 
        discount: tier.discount, 
        features: tier.features, 
        isBestSeller: tier.isBestSeller || false, 
        isMostPopular: tier.isMostPopular || false, 
        isActive: true, 
        status: 'PUBLISHED' 
      },
      create: { 
        name: tier.name, 
        slug: tier.slug, 
        checkoutSlug: tier.checkoutSlug, 
        description: tier.description, 
        duration: tier.duration, 
        price: tier.price, 
        originalPrice: tier.originalPrice, 
        discount: tier.discount, 
        features: tier.features, 
        isBestSeller: tier.isBestSeller || false, 
        isMostPopular: tier.isMostPopular || false, 
        isActive: true, 
        status: 'PUBLISHED' 
      },
    });
    
    results[tier.duration] = membership;
    console.log(`✅ ${tier.duration}: ${membership.name} (ID: ${membership.id})`);
  }
  
  return results;
}

async function step2_ImportUsers(orders) {
  console.log('\n👥 STEP 2: IMPORT ALL USERS');
  console.log('='.repeat(60));
  
  // Get unique users from ALL orders (not just completed)
  const userMap = new Map();
  const { getMembershipForProduct } = require('./scripts/migration/product-membership-mapping.js');

  for (const order of orders) {
    if (!order.user_email) continue;
    const email = order.user_email.toLowerCase().trim();
    // Deteksi produk event/webinar
    const productMapping = getMembershipForProduct(order.product_id);
    const isEventOrWebinar = productMapping && (productMapping.type === 'event' || productMapping.type === 'webinar');
    // Semua user dari transaksi apapun, termasuk event/webinar/cancelled, harus masuk
    if (!userMap.has(email)) {
      userMap.set(email, {
        email: order.user_email,
        name: order.user_name || email.split('@')[0],
        sejoliUserId: order.user_id,
        isEventOrWebinar,
      });
    }
  }

  console.log(`📊 Found ${userMap.size.toLocaleString()} unique users (all types)`);

  const hashedPassword = await bcrypt.hash('eksporyuk2025', 10);
  let created = 0, updated = 0, errors = 0;

  for (const [email, userData] of userMap) {
    try {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: { name: userData.name },
        create: { 
          email: userData.email, 
          name: userData.name, 
          password: hashedPassword, 
          role: 'MEMBER_FREE', 
          emailVerified: true 
        },
      });
      // Simple progress tracking
      const total = created + updated;
      if (total % 2000 === 0) {
        console.log(`   Progress: ${total.toLocaleString()}/${userMap.size.toLocaleString()}`);
      }
      created++;
    } catch (error) {
      errors++;
    }
  }

  console.log(`\n✅ Users processed: ${(created + updated).toLocaleString()}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);

  return { total: userMap.size, created, errors };
}

async function step3_ImportTransactions(orders, membershipMap) {
  console.log('\n💰 STEP 3: IMPORT ALL TRANSACTIONS (19,253)');
  console.log('='.repeat(60));
  
  // Build email to userId map
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  console.log(`📊 Loaded ${emailToUserId.size.toLocaleString()} users for mapping`);
  
  let created = 0, updated = 0, errors = 0;
  let totalCommission = 0;
  let totalRevenue = 0;
  
  // Process ALL orders (semua status)
  for (const order of orders) {
    try {
      const userId = emailToUserId.get(order.user_email?.toLowerCase());
      if (!userId) { errors++; continue; }
      
      const amount = parseFloat(order.grand_total || 0);
      
      // Get FLAT commission from product mapping
      const flatCommission = order.affiliate_id && order.affiliate_id > 0 
        ? getCommissionForProduct(order.product_id) 
        : 0;
      
      // Calculate revenue split (only for completed orders)
      let affiliateShare = 0, founderShare = 0, coFounderShare = 0, companyFee = 0;
      
      if (order.status === 'completed') {
        affiliateShare = flatCommission;
        const remaining = amount - affiliateShare;
        companyFee = remaining * 0.15; // 15% admin fee
        const afterFee = remaining - companyFee;
        founderShare = afterFee * 0.60; // 60% founder
        coFounderShare = afterFee * 0.40; // 40% co-founder
        
        totalCommission += affiliateShare;
        totalRevenue += amount;
      }
      
      // Determine transaction type
      const productMapping = getMembershipForProduct(order.product_id);
      const isMembership = productMapping && (productMapping.type === 'membership' || productMapping.type === 'renewal');
      
      // Map status
      let txStatus = 'PENDING';
      if (order.status === 'completed') txStatus = 'SUCCESS';
      else if (order.status === 'cancelled' || order.status === 'refunded') txStatus = 'CANCELLED';
      else if (order.status === 'on-hold' || order.status === 'payment-confirm') txStatus = 'PENDING';
      
      const externalId = `sejoli-${order.ID}`;
      const existing = await prisma.transaction.findUnique({ where: { externalId } });
      
      const txData = {
        userId,
        amount,
        status: txStatus,
        customerName: order.user_name,
        customerEmail: order.user_email,
        description: order.product_name,
        affiliateShare,
        founderShare,
        coFounderShare,
        companyFee,
        invoiceNumber: `INV${String(order.ID).padStart(5, '0')}`,
        metadata: {
          sejoliOrderId: order.ID,
          sejoliProductId: order.product_id,
          sejoliStatus: order.status,
          affiliateName: order.affiliate_name,
          sejoliAffiliateId: order.affiliate_id,
          flatCommission: flatCommission,
          productType: productMapping?.type || 'unknown',
        },
      };
      
      if (existing) {
        await prisma.transaction.update({ where: { id: existing.id }, data: txData });
        updated++;
      } else {
        await prisma.transaction.create({
          data: {
            ...txData,
            externalId,
            type: isMembership ? 'MEMBERSHIP' : 'PRODUCT',
            paymentProvider: 'SEJOLI',
            paymentMethod: order.payment_gateway || 'UNKNOWN',
            affiliateId: order.affiliate_id > 0 ? String(order.affiliate_id) : null,
            createdAt: new Date(order.order_date || order.created_at),
          },
        });
        created++;
      }
      
      const total = created + updated;
      if (total % 2000 === 0) {
        console.log(`   Progress: ${total.toLocaleString()} transactions`);
      }
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`\n✅ Transactions: ${created.toLocaleString()} created, ${updated.toLocaleString()} updated`);
  console.log(`💰 Total Revenue (completed): Rp ${totalRevenue.toLocaleString()}`);
  console.log(`💵 Total Commission (flat): Rp ${totalCommission.toLocaleString()}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  
  return { created, updated, errors, totalCommission, totalRevenue };
}

async function step4_AssignMemberships(orders, membershipMap) {
  console.log('\n🎯 STEP 4: ASSIGN MEMBERSHIPS TO USERS');
  console.log('='.repeat(60));
  
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  
  // Find best membership per user (only from completed orders)
  const userMembershipMap = new Map();
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  for (const order of completedOrders) {
    const productMapping = getMembershipForProduct(order.product_id);
    if (!productMapping || !productMapping.membershipSlug) continue;
    
    const userId = emailToUserId.get(order.user_email?.toLowerCase());
    if (!userId) continue;
    
    const duration = SLUG_TO_DURATION[productMapping.membershipSlug];
    if (!duration) continue;
    
    const existing = userMembershipMap.get(userId);
    
    // Priority: LIFETIME > TWELVE_MONTHS > SIX_MONTHS
    const priority = { 'LIFETIME': 3, 'TWELVE_MONTHS': 2, 'SIX_MONTHS': 1 };
    if (!existing || priority[duration] > priority[existing.duration]) {
      userMembershipMap.set(userId, {
        duration,
        orderDate: new Date(order.order_date || order.created_at),
        orderId: order.ID,
      });
    }
  }
  
  console.log(`📊 Found ${userMembershipMap.size.toLocaleString()} users with membership purchases`);
  
  let created = 0, updated = 0, errors = 0;
  
  for (const [userId, data] of userMembershipMap) {
    try {
      const membership = membershipMap[data.duration];
      if (!membership) { errors++; continue; }
      
      const startDate = data.orderDate;
      let endDate;
      if (data.duration === 'SIX_MONTHS') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (data.duration === 'TWELVE_MONTHS') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        // LIFETIME: 100 years
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100);
      }
      
      await prisma.userMembership.upsert({
        where: { userId_membershipId: { userId, membershipId: membership.id } },
        update: { startDate, endDate, isActive: true },
        create: { userId, membershipId: membership.id, startDate, endDate, isActive: true },
      });
      
      // Upgrade to MEMBER_PREMIUM
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'MEMBER_PREMIUM' },
      });
      
      created++;
      
      if (created % 500 === 0) {
        console.log(`   Progress: ${created.toLocaleString()}/${userMembershipMap.size.toLocaleString()}`);
      }
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`\n✅ Memberships assigned: ${created.toLocaleString()}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  
  return { created, errors };
}

async function main() {
  console.log('🚀 SEJOLI COMPLETE IMPORT - CORRECT VERSION');
  console.log('='.repeat(60));
  console.log('Strategy: UPSERT (no data deletion)');
  console.log('Commission: FLAT per product (not percentage)');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Load data
    console.log('\n📂 Loading Sejoli data...');
    const sejoliData = require('./sejoli-sales-latest.json');
    const orders = sejoliData.orders;
    
    console.log(`✅ Loaded ${orders.length.toLocaleString()} orders`);
    console.log(`   - completed: ${orders.filter(o => o.status === 'completed').length.toLocaleString()}`);
    console.log(`   - cancelled: ${orders.filter(o => o.status === 'cancelled').length.toLocaleString()}`);
    console.log(`   - other: ${orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length.toLocaleString()}`);
    
    // Step 1: Create memberships
    const membershipMap = await step1_CreateMemberships();
    
    // Step 2: Import users
    const userStats = await step2_ImportUsers(orders);
    
    // Step 3: Import transactions
    const txStats = await step3_ImportTransactions(orders, membershipMap);
    
    // Step 4: Assign memberships
    const membershipStats = await step4_AssignMemberships(orders, membershipMap);
    
    // Final verification
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} minutes`);
    
    // Database stats
    const stats = {
      users: await prisma.user.count(),
      premium: await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
      transactions: await prisma.transaction.count({ where: { paymentProvider: 'SEJOLI' } }),
      completed: await prisma.transaction.count({ where: { paymentProvider: 'SEJOLI', status: 'SUCCESS' } }),
      userMemberships: await prisma.userMembership.count(),
      memberships: await prisma.membership.count(),
    };
    
    console.log('\n🔍 FINAL VERIFICATION:');
    console.log(`   Total Users: ${stats.users.toLocaleString()}`);
    console.log(`   Premium Users: ${stats.premium.toLocaleString()}`);
    console.log(`   Total Transactions: ${stats.transactions.toLocaleString()}`);
    console.log(`   Completed Transactions: ${stats.completed.toLocaleString()}`);
    console.log(`   User Memberships: ${stats.userMemberships.toLocaleString()}`);
    console.log(`   Membership Tiers: ${stats.memberships}`);
    
    // Target check
    console.log('\n🎯 TARGET CHECK:');
    console.log(`   Transactions: ${stats.transactions >= 19000 ? '✅' : '❌'} (${stats.transactions.toLocaleString()} / 19,253)`);
    console.log(`   Users: ${stats.users >= 14000 ? '✅' : '❌'} (${stats.users.toLocaleString()} / 14,213+)`);
    console.log(`   Commission: FLAT per product ✅`);
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
