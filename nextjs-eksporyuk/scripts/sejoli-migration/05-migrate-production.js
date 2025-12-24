/**
 * Sejoli to Eksporyuk Migration - PRODUCTION VERSION
 * Migrates users, orders, and commissions in efficient batches
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, 'exports');
const BATCH_SIZE = 100; // Process 100 users at a time

// Mapping functions
function mapUserRole(metaValue) {
  if (!metaValue) return 'MEMBER_FREE';
  
  try {
    const roles = JSON.parse(metaValue);
    const roleKeys = Object.keys(roles);
    
    if (roleKeys.includes('administrator')) return 'ADMIN';
    if (roleKeys.includes('mentor') || roleKeys.includes('teacher')) return 'MENTOR';
    if (roleKeys.includes('subscriber') || roleKeys.includes('member')) return 'MEMBER_PREMIUM';
    
    return 'MEMBER_FREE';
  } catch (e) {
    return 'MEMBER_FREE';
  }
}

function generateUsername(email, displayName) {
  if (displayName && displayName !== email && displayName.length > 2) {
    return displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  }
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
}

function parseSejoliDate(dateStr) {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return new Date();
  try {
    return new Date(dateStr);
  } catch (e) {
    return new Date();
  }
}

async function migrateUsers() {
  console.log('👥 MIGRATING USERS');
  console.log('==================\n');

  // Load data
  const users = JSON.parse(
    await fs.readFile(path.join(EXPORT_DIR, 'sejoli_users.json'), 'utf-8')
  );
  
  const userMetaRaw = JSON.parse(
    await fs.readFile(path.join(EXPORT_DIR, 'sejoli_usermeta.json'), 'utf-8')
  );

  // Build meta lookup
  const metaByUser = {};
  userMetaRaw.forEach(meta => {
    if (!metaByUser[meta.user_id]) metaByUser[meta.user_id] = {};
    metaByUser[meta.user_id][meta.meta_key] = meta.meta_value;
  });

  console.log(`📊 Total users to migrate: ${users.length}\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const userMapping = {}; // Sejoli ID → Eksporyuk ID

  // Process in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, users.length)})...`);

    for (const sejoliUser of batch) {
      try {
        const meta = metaByUser[sejoliUser.ID] || {};
        const role = mapUserRole(meta.wp_capabilities);
        const username = generateUsername(sejoliUser.user_email, sejoliUser.display_name);
        
        // Check if exists
        const existing = await prisma.user.findUnique({
          where: { email: sejoliUser.user_email }
        });

        if (existing) {
          userMapping[sejoliUser.ID] = existing.id;
          skippedCount++;
          continue;
        }

        // Create user
        const hashedPassword = await bcrypt.hash('EksporyukTemp2024!', 10);
        
        const newUser = await prisma.user.create({
          data: {
            email: sejoliUser.user_email,
            username: username,
            password: hashedPassword,
            name: sejoliUser.display_name || meta.first_name || username,
            role: role,
            emailVerified: true,
            whatsapp: meta.billing_phone || null,
            createdAt: parseSejoliDate(sejoliUser.user_registered),
          }
        });

        userMapping[sejoliUser.ID] = newUser.id;

        // Create wallet
        await prisma.wallet.upsert({
          where: { userId: newUser.id },
          create: {
            userId: newUser.id,
            balance: 0,
            balancePending: 0,
          },
          update: {}
        });

        // Create affiliate profile for all users (Sejoli concept)
        const affiliateCode = `SEJOLI${String(sejoliUser.ID).padStart(6, '0')}`;
        await prisma.affiliateProfile.create({
          data: {
            userId: newUser.id,
            affiliateCode: affiliateCode,
            shortLink: `https://eksporyuk.com/go/${username}`,
            commissionRate: 30,
            totalEarnings: 0,
            totalReferrals: 0,
          }
        }).catch(() => {}); // Ignore if already exists

        migratedCount++;

      } catch (error) {
        console.error(`  ❌ ${sejoliUser.user_email}: ${error.message}`);
        errorCount++;
      }
    }

    // Progress update
    console.log(`  Progress: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors\n`);
  }

  // Save mapping
  await fs.writeFile(
    path.join(EXPORT_DIR, '_user_mapping.json'),
    JSON.stringify(userMapping, null, 2)
  );

  console.log('✅ USER MIGRATION COMPLETE');
  console.log(`   Migrated: ${migratedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Errors: ${errorCount}\n`);

  return userMapping;
}

async function migrateOrders(userMapping) {
  console.log('💰 MIGRATING ORDERS');
  console.log('===================\n');

  // Convert TSV to JSON
  const ordersContent = await fs.readFile(path.join(EXPORT_DIR, 'sejoli_orders_fixed.tsv'), 'utf-8');
  const ordersLines = ordersContent.trim().split('\n');
  
  const orders = ordersLines.map(line => {
    const [ID, created_at, user_id, product_id, affiliate_id, grand_total, quantity, payment_gateway, status, type] = line.split('\t');
    return { ID, created_at, user_id, product_id, affiliate_id, grand_total, quantity, payment_gateway, status, type };
  });

  console.log(`📊 Total orders: ${orders.length}\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orders.length / BATCH_SIZE)}...`);

    for (const order of batch) {
      const eksporyukUserId = userMapping[order.user_id];
      if (!eksporyukUserId) {
        skippedCount++;
        continue;
      }

      try {
        await prisma.transaction.create({
          data: {
            userId: eksporyukUserId,
            amount: parseFloat(order.grand_total) || 0,
            type: 'MEMBERSHIP_PURCHASE',
            status: order.status === 'completed' ? 'COMPLETED' : 'PENDING',
            paymentMethod: order.payment_gateway || 'MANUAL',
            paymentGateway: 'SEJOLI_MIGRATION',
            description: `Migrated from Sejoli - Order #${order.ID}`,
            createdAt: parseSejoliDate(order.created_at),
          }
        });

        migratedCount++;
      } catch (error) {
        skippedCount++;
      }
    }
  }

  console.log('✅ ORDERS MIGRATION COMPLETE');
  console.log(`   Migrated: ${migratedCount}`);
  console.log(`   Skipped: ${skippedCount}\n`);
}

async function migrateCommissions(userMapping) {
  console.log('💵 MIGRATING COMMISSIONS');
  console.log('========================\n');

  // Convert TSV to JSON
  const commissionsContent = await fs.readFile(path.join(EXPORT_DIR, 'sejoli_commissions.tsv'), 'utf-8');
  const commissionsLines = commissionsContent.trim().split('\n');
  
  const commissions = commissionsLines.map(line => {
    const [ID, created_at, order_id, affiliate_id, product_id, tier, commission, status] = line.split('\t');
    return { ID, created_at, order_id, affiliate_id, product_id, tier, commission, status };
  });

  console.log(`📊 Total commissions: ${commissions.length}\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  // Group by affiliate to update totals
  const affiliateTotals = {};
  
  for (const comm of commissions) {
    const eksporyukUserId = userMapping[comm.affiliate_id];
    if (!eksporyukUserId) continue;

    if (!affiliateTotals[eksporyukUserId]) {
      affiliateTotals[eksporyukUserId] = { total: 0, count: 0 };
    }

    if (comm.status === 'paid') {
      affiliateTotals[eksporyukUserId].total += parseFloat(comm.commission) || 0;
    }
    affiliateTotals[eksporyukUserId].count += 1;
  }

  // Update affiliate profiles
  for (const [userId, totals] of Object.entries(affiliateTotals)) {
    try {
      await prisma.affiliateProfile.update({
        where: { userId: parseInt(userId) },
        data: {
          totalEarnings: totals.total,
          totalReferrals: totals.count,
        }
      });

      // Update wallet balance
      await prisma.wallet.update({
        where: { userId: parseInt(userId) },
        data: {
          balance: { increment: totals.total }
        }
      });

      migratedCount++;
    } catch (error) {
      skippedCount++;
    }
  }

  console.log('✅ COMMISSIONS MIGRATION COMPLETE');
  console.log(`   Affiliates updated: ${migratedCount}`);
  console.log(`   Total commission records: ${commissions.length}\n`);
}

async function main() {
  console.log('🚀 SEJOLI → EKSPORYUK MIGRATION');
  console.log('================================\n');
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  try {
    // Step 1: Migrate Users
    const userMapping = await migrateUsers();

    // Step 2: Migrate Orders
    await migrateOrders(userMapping);

    // Step 3: Migrate Commissions
    await migrateCommissions(userMapping);

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================\n');
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. All users have temporary password: EksporyukTemp2024!');
    console.log('2. Send password reset emails to all users');
    console.log('3. Verify data in Prisma Studio: npx prisma studio');
    console.log('4. Test login with migrated accounts\n');

  } catch (error) {
    console.error('\n❌ MIGRATION ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
