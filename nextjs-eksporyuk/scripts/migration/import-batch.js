/**
 * SEJOLI → EKSPORYUK BATCH IMPORT
 * ================================
 * Import dengan batch processing untuk 18K user
 * Batch size: 1000 records per batch
 */

const { PrismaClient, TransactionType, TransactionStatus } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Config
const BATCH_SIZE = 1000;
const DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

// Stats
const stats = {
  users: { created: 0, skipped: 0, failed: 0 },
  affiliates: { created: 0, skipped: 0, failed: 0 },
  transactions: { created: 0, skipped: 0, failed: 0 },
  memberships: { created: 0, skipped: 0, failed: 0 }
};

// Maps
const wpUserIdToEksporyukId = new Map();
const wpAffiliateIdToProfileId = new Map();

// Helpers
function generateAffiliateCode(username) {
  const clean = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `${clean}${Date.now().toString(36).slice(-4)}`;
}

function generateShortLink(username) {
  const clean = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `${clean}-${Date.now().toString(36).slice(-6)}`;
}

// Process in batches
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function importUsers(users) {
  console.log(`\n📥 Importing ${users.length} users...`);
  
  // Pre-load existing emails ONCE per batch
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, username: true }
  });
  
  // Create lookup maps
  const existingByEmail = new Map();
  const existingUsernames = new Set();
  
  for (const eu of existingUsers) {
    if (eu.email) existingByEmail.set(eu.email.toLowerCase(), eu.id);
    if (eu.username) existingUsernames.add(eu.username.toLowerCase());
  }
  
  // Pre-map WP users to existing Eksporyuk users by email
  for (const wpUser of users) {
    const email = wpUser.user_email?.toLowerCase();
    if (email && existingByEmail.has(email)) {
      wpUserIdToEksporyukId.set(wpUser.id, existingByEmail.get(email));
    }
  }
  
  const preMapped = wpUserIdToEksporyukId.size;
  const toCreate = Math.max(0, users.length - preMapped);
  console.log(`   📋 Pre-mapped ${preMapped} existing users from this batch`);
  console.log(`   📊 To create: ~${toCreate} new users`);
  
  // Hash password once
  const hashedPassword = await bcrypt.hash('eksporyuk2024', 10);
  
  const errors = [];
  
  for (const wpUser of users) {
    try {
      const wpUserId = wpUser.id || wpUser.ID;
      const email = wpUser.user_email?.toLowerCase();
      
      // Skip if no email
      if (!email) {
        stats.users.failed++;
        continue;
      }
      
      // Skip if already mapped (exists in DB)
      if (wpUserIdToEksporyukId.has(wpUserId)) {
        stats.users.skipped++;
        continue;
      }
      
      // Generate unique username
      let username = wpUser.user_login || `user${wpUserId}`;
      if (existingUsernames.has(username.toLowerCase())) {
        username = `${username}_${wpUserId}`;
      }
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          name: wpUser.display_name || wpUser.user_login || 'User',
          username,
          password: hashedPassword,
          role: 'MEMBER_FREE',
          isActive: true,
          emailVerified: !!wpUser.user_registered, // Boolean, not Date
          createdAt: wpUser.user_registered ? new Date(wpUser.user_registered) : new Date()
        }
      });
      
      wpUserIdToEksporyukId.set(wpUserId, newUser.id);
      existingUsernames.add(username.toLowerCase());
      stats.users.created++;
      
      // Progress indicator
      if (stats.users.created % 100 === 0) {
        process.stdout.write(`   📊 Created ${stats.users.created} users...\r`);
      }
    } catch (e) {
      stats.users.failed++;
      if (errors.length < 3) {
        errors.push({
          email: wpUser.user_email,
          error: e.message,
          code: e.code
        });
      }
    }
  }
  
  if (errors.length > 0) {
    console.log(`\n   ⚠️  Sample errors:`);
    errors.forEach(err => {
      console.log(`      - ${err.email}:`);
      console.log(`        ${err.error.substring(0, 300)}`);
    });
  }
  
  console.log(`\n   ✅ Users complete: ${stats.users.created} created, ${stats.users.skipped} skipped, ${stats.users.failed} failed`);
}

async function importAffiliates(affiliates) {
  console.log(`   Importing ${affiliates.length} affiliates...`);
  
  // Pre-map existing affiliate profiles untuk batch ini
  const userIdsInBatch = affiliates
    .map(a => wpUserIdToEksporyukId.get(a.user_id))
    .filter(Boolean);
  
  if (userIdsInBatch.length > 0) {
    const existingProfiles = await prisma.affiliateProfile.findMany({
      where: { userId: { in: userIdsInBatch } },
      select: { id: true, userId: true }
    });
    
    // Build map userId -> profileId
    const userIdToProfileId = new Map();
    existingProfiles.forEach(profile => {
      userIdToProfileId.set(profile.userId, profile.id);
    });
    
    // Map back to WP IDs
    for (const wpAff of affiliates) {
      const userId = wpUserIdToEksporyukId.get(wpAff.user_id);
      if (userId && userIdToProfileId.has(userId)) {
        wpAffiliateIdToProfileId.set(wpAff.user_id, userIdToProfileId.get(userId));
      }
    }
  }
  
  console.log(`   📋 Found ${wpAffiliateIdToProfileId.size} existing affiliates`);
  
  for (const wpAff of affiliates) {
    try {
      const wpUserId = wpAff.user_id;
      const userId = wpUserIdToEksporyukId.get(wpUserId);
      
      if (!userId) {
        stats.affiliates.failed++;
        continue;
      }
      
      // Skip if already exists (pre-mapped)
      if (wpAffiliateIdToProfileId.has(wpUserId)) {
        stats.affiliates.skipped++;
        continue;
      }
      
      // Create affiliate profile with unique codes
      let affiliateCode = wpAff.affiliate_code || generateAffiliateCode(wpAff.display_name);
      let shortLink = generateShortLink(wpAff.display_name);
      
      // Try creating with retry on unique constraint error
      let created = false;
      for (let attempt = 0; attempt < 3 && !created; attempt++) {
        try {
          const newAff = await prisma.affiliateProfile.create({
            data: {
              user: { connect: { id: userId } },
              affiliateCode,
              shortLink,
              tier: 1,
              commissionRate: 30,
              totalConversions: parseInt(wpAff.total_referrals) || 0,
              totalEarnings: parseFloat(wpAff.total_commission) || 0,
              isActive: true,
              applicationStatus: 'APPROVED',
              approvedAt: new Date()
            }
          });
          
          wpAffiliateIdToProfileId.set(wpUserId, newAff.id);
          stats.affiliates.created++;
          created = true;
          
          if (stats.affiliates.created % 50 === 0) {
            console.log(`      ... ${stats.affiliates.created} affiliates created`);
          }
        } catch (e) {
          if (e.code === 'P2002' && attempt < 2) {
            // Unique constraint violation, retry with new codes
            affiliateCode = generateAffiliateCode(wpAff.display_name);
            shortLink = generateShortLink(wpAff.display_name);
          } else {
            stats.affiliates.failed++;
            if (stats.affiliates.failed <= 3) {
              console.log(`      ⚠️  Error creating affiliate for user ${wpAff.user_id}: ${e.message.substring(0, 100)}`);
            }
            break;
          }
        }
      }
    } catch (e) {
      stats.affiliates.failed++;
    }
  }
  
  console.log(`   ✅ Affiliates complete: ${stats.affiliates.created} created, ${stats.affiliates.skipped} skipped`);
}

async function importTransactions(orders, defaultMembershipId) {
  console.log(`   Importing ${orders.length} transactions...`);
  
  // Pre-map existing transactions untuk batch ini
  const externalIds = orders.map(o => `sejoli-${o.id}`);
  const references = orders.map(o => `SEJOLI-${o.id}`);
  
  const existingTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { externalId: { in: externalIds } },
        { reference: { in: references } }
      ]
    },
    select: { externalId: true, reference: true }
  });
  
  const existingIds = new Set([
    ...existingTxs.map(tx => tx.externalId),
    ...existingTxs.map(tx => tx.reference)
  ]);
  
  console.log(`   📋 Found ${existingTxs.length} existing transactions`);
  
  // Pre-fetch all users in this batch
  const userIds = [...new Set(orders.map(o => wpUserIdToEksporyukId.get(o.user_id)).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  
  const userMap = new Map(users.map(u => [u.id, u]));
  
  // Pre-fetch existing memberships
  const existingMemberships = await prisma.userMembership.findMany({
    where: {
      userId: { in: userIds },
      membershipId: defaultMembershipId
    },
    select: { userId: true }
  });
  
  const hasMembership = new Set(existingMemberships.map(m => m.userId));
  
  console.log(`   📋 Loaded ${users.length} users, ${hasMembership.size} have memberships`);
  
  for (const order of orders) {
    try {
      const userId = wpUserIdToEksporyukId.get(order.user_id);
      
      if (!userId) {
        stats.transactions.failed++;
        continue;
      }
      
      // Check if already exists (pre-mapped)
      if (existingIds.has(`sejoli-${order.id}`) || existingIds.has(`SEJOLI-${order.id}`)) {
        stats.transactions.skipped++;
        continue;
      }
      
      // Get user from pre-fetched map
      const user = userMap.get(userId);
      
      if (!user) {
        stats.transactions.failed++;
        continue;
      }
      
      // Map status
      const isCompleted = order.status === 'completed';
      const isCancelled = order.status === 'cancelled' || order.status === 'failed';
      const txStatus = isCompleted ? TransactionStatus.SUCCESS : 
                      (isCancelled ? TransactionStatus.FAILED : TransactionStatus.PENDING);
      
      // Get affiliate profile ID if order has affiliate
      let affiliateProfileId = null;
      if (order.affiliate_id && order.affiliate_id > 0) {
        affiliateProfileId = wpAffiliateIdToProfileId.get(order.affiliate_id);
      }
      
      // Create transaction
      const tx = await prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.MEMBERSHIP,
          status: txStatus,
          amount: parseFloat(order.grand_total) || 0,
          originalAmount: parseFloat(order.grand_total) || 0,
          customerName: user.name,
          customerEmail: user.email,
          description: `Sejoli Import - Order #${order.id}`,
          reference: `SEJOLI-${order.id}`,
          externalId: `sejoli-${order.id}`,
          paymentMethod: order.payment_gateway || 'IMPORTED',
          paymentProvider: 'SEJOLI',
          paidAt: isCompleted ? (order.created_at ? new Date(order.created_at) : new Date()) : null,
          affiliateId: affiliateProfileId, // Link to affiliate profile
          metadata: {
            imported: true,
            source: 'sejoli',
            originalOrderId: order.id,
            originalStatus: order.status,
            originalAffiliateId: order.affiliate_id || null
          },
          createdAt: order.created_at ? new Date(order.created_at) : new Date()
        }
      });
      
      stats.transactions.created++;
      
      // Create membership for completed orders
      if (isCompleted && defaultMembershipId) {
        try {
          // Check from pre-fetched set
          if (!hasMembership.has(userId)) {
            await prisma.userMembership.create({
              data: {
                userId,
                membershipId: defaultMembershipId,
                transactionId: tx.id,
                startDate: order.created_at ? new Date(order.created_at) : new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 100),
                status: 'ACTIVE'
              }
            });
            hasMembership.add(userId); // Mark as created
            stats.memberships.created++;
          } else {
            stats.memberships.skipped++;
          }
        } catch (e) {
          // Ignore membership errors
        }
      }
      
      // Progress indicator
      if (stats.transactions.created % 50 === 0) {
        process.stdout.write(`   📊 Created ${stats.transactions.created} transactions...\r`);
      }
    } catch (e) {
      stats.transactions.failed++;
    }
  }
  
  console.log(`\n   ✅ Transactions complete: ${stats.transactions.created} created, ${stats.transactions.skipped} skipped`);
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🚀 SEJOLI → EKSPORYUK BATCH IMPORT (18K USERS)');
  console.log('═'.repeat(70));
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log(`📦 Batch Size: ${BATCH_SIZE} (complete each batch fully)`);
  
  // Load data
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ File not found: ${DATA_FILE}`);
    process.exit(1);
  }
  
  console.log(`\n📂 Loading data from ${path.basename(DATA_FILE)}...`);
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  console.log(`📊 Data Summary:`);
  console.log(`   👤 Users: ${data.users?.length || 0}`);
  console.log(`   💳 Orders: ${data.orders?.length || 0}`);
  console.log(`   🔗 Affiliates: ${data.affiliates?.length || 0}`);
  
  // Get default membership
  const defaultMembership = await prisma.membership.findFirst({
    where: { slug: 'lifetime' }
  }) || await prisma.membership.findFirst({ orderBy: { price: 'desc' } });
  
  console.log(`\n🎫 Default Membership: ${defaultMembership?.name || 'None'}`);
  
  // Start import
  const startTime = Date.now();
  
  // Process in complete batches: 1000 users → their affiliates → their transactions
  const userBatches = chunk(data.users || [], BATCH_SIZE);
  
  for (let batchNum = 0; batchNum < userBatches.length; batchNum++) {
    const userBatch = userBatches[batchNum];
    const batchUserIds = new Set(userBatch.map(u => u.id));
    
    console.log('\n' + '═'.repeat(70));
    console.log(`📦 BATCH ${batchNum + 1}/${userBatches.length} - Processing ${userBatch.length} users completely`);
    console.log('═'.repeat(70));
    
    // 1. Import Users in this batch
    await importUsers(userBatch);
    
    // 2. Import Affiliates for these users
    const batchAffiliates = (data.affiliates || []).filter(a => batchUserIds.has(a.user_id));
    if (batchAffiliates.length > 0) {
      console.log(`\n🔗 Processing ${batchAffiliates.length} affiliates for this batch...`);
      await importAffiliates(batchAffiliates);
    }
    
    // 3. Import Transactions for these users
    const batchOrders = (data.orders || []).filter(o => batchUserIds.has(o.user_id));
    if (batchOrders.length > 0) {
      console.log(`\n💳 Processing ${batchOrders.length} orders for this batch...`);
      await importTransactions(batchOrders, defaultMembership?.id);
    }
    
    // Show batch summary
    console.log(`\n✅ Batch ${batchNum + 1} Complete:`);
    console.log(`   Users: ${stats.users.created} created`);
    console.log(`   Affiliates: ${stats.affiliates.created} created`);
    console.log(`   Transactions: ${stats.transactions.created} created`);
    console.log(`   Memberships: ${stats.memberships.created} created`);
  }
  
  // Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`
👤 Users:        ${stats.users.created} created, ${stats.users.skipped} skipped, ${stats.users.failed} failed
🔗 Affiliates:   ${stats.affiliates.created} created, ${stats.affiliates.skipped} skipped, ${stats.affiliates.failed} failed
💳 Transactions: ${stats.transactions.created} created, ${stats.transactions.skipped} skipped, ${stats.transactions.failed} failed
🎫 Memberships:  ${stats.memberships.created} created, ${stats.memberships.skipped} skipped

⏱️  Duration: ${duration} seconds
`);

  // Verify counts
  const userCount = await prisma.user.count();
  const txCount = await prisma.transaction.count();
  const affCount = await prisma.affiliateProfile.count();
  const memCount = await prisma.userMembership.count();
  
  console.log('📊 DATABASE TOTALS:');
  console.log(`   👤 Users: ${userCount}`);
  console.log(`   💳 Transactions: ${txCount}`);
  console.log(`   🔗 Affiliates: ${affCount}`);
  console.log(`   🎫 Memberships: ${memCount}`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('✅ IMPORT COMPLETED!');
  console.log('═'.repeat(70));
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
