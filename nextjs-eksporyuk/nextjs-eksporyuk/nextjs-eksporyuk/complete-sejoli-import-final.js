/**
 * COMPLETE SEJOLI IMPORT - FINAL VERSION
 * WITHOUT DATABASE DELETION (UPSERT STRATEGY)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PRODUCT_TO_MEMBERSHIP = {
  13401: 'LIFETIME', 8910: 'LIFETIME', 15234: 'LIFETIME',
  16956: 'LIFETIME', 17920: 'LIFETIME', 19296: 'LIFETIME', 20852: 'LIFETIME',
  13399: 'TWELVE_MONTHS', 8915: 'TWELVE_MONTHS', 8683: 'TWELVE_MONTHS',
  13400: 'SIX_MONTHS', 8914: 'SIX_MONTHS', 8684: 'SIX_MONTHS',
};

const MEMBERSHIP_TIERS = [
  {
    name: 'Paket Ekspor Yuk - 6 Bulan',
    slug: 'paket-6-bulan',
    checkoutSlug: 'paket-6-bulan',
    description: 'Akses premium 6 bulan ke semua materi ekspor, webinar eksklusif, dan konsultasi bisnis.',
    duration: 'SIX_MONTHS',
    price: 1497000,
    originalPrice: 2000000,
    discount: 25,
    features: ['Akses semua materi ekspor', 'Webinar eksklusif bulanan', 'Konsultasi bisnis 1-on-1', 'Template dokumen ekspor', 'Grup WhatsApp eksklusif', 'Sertifikat kelulusan'],
  },
  {
    name: 'Paket Ekspor Yuk - 12 Bulan',
    slug: 'paket-12-bulan',
    checkoutSlug: 'paket-12-bulan',
    description: 'Akses premium 12 bulan ke semua materi ekspor, webinar eksklusif, konsultasi bisnis, dan bonus marketplace listing.',
    duration: 'TWELVE_MONTHS',
    price: 2497000,
    originalPrice: 3500000,
    discount: 29,
    features: ['Semua fitur paket 6 bulan', 'Bonus marketplace listing', 'Review company profile gratis', 'Akses materi update selamanya', 'Prioritas support', 'Workshop offline (bila ada)'],
    isMostPopular: true,
  },
  {
    name: 'Paket Ekspor Yuk - Lifetime',
    slug: 'paket-lifetime',
    checkoutSlug: 'paket-lifetime',
    description: 'Akses SELAMANYA ke semua materi ekspor, webinar eksklusif, konsultasi bisnis, dan semua update konten di masa depan.',
    duration: 'LIFETIME',
    price: 997000,
    originalPrice: 5000000,
    discount: 80,
    features: ['Semua fitur paket 12 bulan', 'Akses SELAMANYA', 'Update konten gratis selamanya', 'Prioritas tertinggi support', 'Akses early bird program baru', 'Kesempatan jadi affiliate premium'],
    isBestSeller: true,
  },
];

async function step1_CreateMemberships() {
  console.log('\n📦 STEP 1: CREATE MEMBERSHIP TIERS');
  console.log('='.repeat(60));
  
  const results = [];
  for (const tier of MEMBERSHIP_TIERS) {
    try {
      const membership = await prisma.membership.upsert({
        where: { slug: tier.slug },
        update: { name: tier.name, description: tier.description, duration: tier.duration, price: tier.price, originalPrice: tier.originalPrice, discount: tier.discount, features: tier.features, isBestSeller: tier.isBestSeller || false, isMostPopular: tier.isMostPopular || false, isActive: true, status: 'PUBLISHED' },
        create: { name: tier.name, slug: tier.slug, checkoutSlug: tier.checkoutSlug, description: tier.description, duration: tier.duration, price: tier.price, originalPrice: tier.originalPrice, discount: tier.discount, features: tier.features, isBestSeller: tier.isBestSeller || false, isMostPopular: tier.isMostPopular || false, isActive: true, status: 'PUBLISHED' },
      });
      console.log(`✅ ${tier.duration}: ${membership.name}`);
      results.push(membership);
    } catch (error) {
      console.error(`❌ Error creating ${tier.duration}:`, error.message);
    }
  }
  console.log(`\n✅ Created/updated ${results.length} membership tiers`);
  return results;
}

async function step2_ImportUsers(orders) {
  console.log('\n👥 STEP 2: IMPORT/UPDATE USERS');
  console.log('='.repeat(60));
  
  const userMap = new Map();
  for (const order of orders) {
    if (!order.user_email) continue;
    const key = order.user_email.toLowerCase();
    if (!userMap.has(key)) {
      userMap.set(key, { email: order.user_email, name: order.user_name || order.user_email.split('@')[0], sejoliUserId: order.user_id });
    }
  }
  
  console.log(`Found ${userMap.size} unique users from orders`);
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  let created = 0, updated = 0, errors = 0;
  for (const [email, userData] of userMap) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: { name: userData.name },
        create: { email: userData.email, name: userData.name, password: hashedPassword, role: 'MEMBER_FREE', emailVerified: true },
      });
      const isNew = user.updatedAt.getTime() - user.createdAt.getTime() < 1000;
      if (isNew) created++; else updated++;
      if ((created + updated) % 1000 === 0) console.log(`Progress: ${created + updated}/${userMap.size} users...`);
    } catch (error) {
      errors++;
      if (errors <= 5) console.error(`❌ Error for ${userData.email}:`, error.message);
    }
  }
  
  console.log(`\n✅ Created: ${created} users`);
  console.log(`✅ Updated: ${updated} users`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  return { created, updated, errors, total: userMap.size };
}

async function step3_ImportTransactions(orders) {
  console.log('\n💰 STEP 3: IMPORT/UPDATE TRANSACTIONS');
  console.log('='.repeat(60));
  
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  console.log(`Loaded ${emailToUserId.size} users for mapping`);
  
  let created = 0, updated = 0, errors = 0;
  for (const order of orders) {
    if (order.status !== 'completed') continue;
    
    try {
      const userId = emailToUserId.get(order.user_email?.toLowerCase());
      if (!userId) { errors++; continue; }
      
      const amount = parseFloat(order.grand_total || 0);
      const affiliateCommission = amount * 0.30;
      const remaining = amount - affiliateCommission;
      const adminFee = remaining * 0.15;
      const founderShare = (remaining - adminFee) * 0.60;
      const coFounderShare = (remaining - adminFee) * 0.40;
      
      const productName = (order.product_name || '').toLowerCase();
      const isMembership = productName.includes('paket') || productName.includes('bulan') || productName.includes('lifetime');
      
      const externalId = `sejoli-${order.ID}`;
      const existing = await prisma.transaction.findUnique({ where: { externalId } });
      
      const transactionData = {
        userId, amount, status: 'SUCCESS', customerName: order.user_name, customerEmail: order.user_email,
        description: order.product_name, affiliateShare: affiliateCommission, founderShare, coFounderShare,
        companyFee: adminFee, invoiceNumber: `INV${String(order.ID).padStart(5, '0')}`,
        metadata: { sejoliOrderId: order.ID, sejoliProductId: order.product_id, affiliateName: order.affiliate_name, sejoliAffiliateId: order.affiliate_id },
      };
      
      if (existing) {
        await prisma.transaction.update({ where: { id: existing.id }, data: transactionData });
        updated++;
      } else {
        await prisma.transaction.create({
          data: {
            ...transactionData,
            externalId,
            type: isMembership ? 'MEMBERSHIP' : 'PRODUCT',
            paymentProvider: 'SEJOLI',
            paymentMethod: order.payment_gateway || 'UNKNOWN',
            affiliateId: order.affiliate_id ? String(order.affiliate_id) : null,
            createdAt: new Date(order.order_date || order.created_at),
          },
        });
        created++;
      }
      
      if ((created + updated) % 1000 === 0) console.log(`Progress: ${created + updated} transactions...`);
    } catch (error) {
      errors++;
      if (errors <= 5) console.error(`❌ Error for order ${order.ID}:`, error.message);
    }
  }
  
  console.log(`\n✅ Created: ${created} transactions`);
  console.log(`✅ Updated: ${updated} transactions`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  return { created, updated, errors };
}

async function step4_AssignMemberships(orders, memberships) {
  console.log('\n🎯 STEP 4: ASSIGN MEMBERSHIPS TO USERS');
  console.log('='.repeat(60));
  
  const membershipMap = new Map(memberships.map(m => [m.duration, m]));
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  
  const userMembershipMap = new Map();
  for (const order of orders) {
    if (order.status !== 'completed') continue;
    const membershipDuration = PRODUCT_TO_MEMBERSHIP[order.product_id];
    if (!membershipDuration) continue;
    const userId = emailToUserId.get(order.user_email?.toLowerCase());
    if (!userId) continue;
    const existing = userMembershipMap.get(userId);
    if (!existing || (membershipDuration === 'LIFETIME') || (membershipDuration === 'TWELVE_MONTHS' && existing.duration === 'SIX_MONTHS')) {
      userMembershipMap.set(userId, { duration: membershipDuration, orderDate: new Date(order.order_date || order.created_at), orderId: order.ID });
    }
  }
  
  console.log(`Found ${userMembershipMap.size} users with membership purchases`);
  
  let created = 0, updated = 0, roleUpdates = 0, errors = 0;
  for (const [userId, membershipData] of userMembershipMap) {
    try {
      const membership = membershipMap.get(membershipData.duration);
      if (!membership) { errors++; continue; }
      
      const startDate = membershipData.orderDate;
      let endDate;
      if (membershipData.duration === 'SIX_MONTHS') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (membershipData.duration === 'TWELVE_MONTHS') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        // LIFETIME: set to 100 years in future
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100);
      }
      
      const updateData = { startDate, endDate, isActive: true };
      const createData = { userId, membershipId: membership.id, startDate, endDate, isActive: true };
      
      const userMembership = await prisma.userMembership.upsert({
        where: { userId_membershipId: { userId, membershipId: membership.id } },
        update: updateData,
        create: createData,
      });
      
      const isNew = userMembership.updatedAt.getTime() - userMembership.createdAt.getTime() < 1000;
      if (isNew) created++; else updated++;
      
      await prisma.user.update({ where: { id: userId }, data: { role: 'MEMBER_PREMIUM' } });
      roleUpdates++;
      
      if ((created + updated) % 100 === 0) console.log(`Progress: ${created + updated}/${userMembershipMap.size}...`);
    } catch (error) {
      errors++;
      if (errors <= 5) console.error(`❌ Error assigning membership:`, error.message);
    }
  }
  
  console.log(`\n✅ Created: ${created} user memberships`);
  console.log(`✅ Updated: ${updated} user memberships`);
  console.log(`✅ Role updates: ${roleUpdates} users → MEMBER_PREMIUM`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  return { created, updated, roleUpdates, errors };
}

async function main() {
  console.log('🚀 COMPLETE SEJOLI IMPORT - FINAL VERSION');
  console.log('='.repeat(60));
  console.log('Strategy: UPSERT (no data deletion)');
  console.log('Source: sejoli-sales-raw.json');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    console.log('\n📂 Loading Sejoli data...');
    const sejoliData = require('./sejoli-sales-raw.json');
    const orders = sejoliData.orders;
    console.log(`✅ Loaded ${orders.length.toLocaleString()} orders`);
    const completedOrders = orders.filter(o => o.status === 'completed');
    console.log(`✅ Completed orders: ${completedOrders.length.toLocaleString()}`);
    
    const memberships = await step1_CreateMemberships();
    const userStats = await step2_ImportUsers(orders);
    const transactionStats = await step3_ImportTransactions(completedOrders);
    const membershipStats = await step4_AssignMemberships(completedOrders, memberships);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log('\n📊 SUMMARY:');
    console.log(`   Memberships: ${memberships.length} tiers created`);
    console.log(`   Users: ${userStats.created} created, ${userStats.updated} updated`);
    console.log(`   Transactions: ${transactionStats.created} created, ${transactionStats.updated} updated`);
    console.log(`   User Memberships: ${membershipStats.created} created, ${membershipStats.updated} updated`);
    console.log(`   Premium Upgrades: ${membershipStats.roleUpdates} users`);
    console.log('='.repeat(60));
    
    console.log('\n🔍 VERIFICATION:');
    const finalStats = {
      users: await prisma.user.count(),
      premium: await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
      transactions: await prisma.transaction.count({ where: { paymentProvider: 'SEJOLI' } }),
      userMemberships: await prisma.userMembership.count(),
      memberships: await prisma.membership.count(),
    };
    console.log(`   Total Users: ${finalStats.users.toLocaleString()}`);
    console.log(`   Premium Users: ${finalStats.premium.toLocaleString()}`);
    console.log(`   Transactions: ${finalStats.transactions.toLocaleString()}`);
    console.log(`   User Memberships: ${finalStats.userMemberships.toLocaleString()}`);
    console.log(`   Membership Tiers: ${finalStats.memberships}`);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
