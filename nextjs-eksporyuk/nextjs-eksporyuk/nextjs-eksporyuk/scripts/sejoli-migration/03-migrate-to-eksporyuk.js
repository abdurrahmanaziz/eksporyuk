/**
 * Sejoli to Eksporyuk Migration
 * Imports exported Sejoli data into new Eksporyuk system
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, 'exports');

// Mapping functions
function mapUserRole(wpRoles) {
  if (!wpRoles) return 'MEMBER_FREE';
  
  const roles = JSON.parse(wpRoles);
  const roleKeys = Object.keys(roles);
  
  if (roleKeys.includes('administrator')) return 'ADMIN';
  if (roleKeys.includes('mentor') || roleKeys.includes('teacher')) return 'MENTOR';
  if (roleKeys.includes('affiliate')) return 'AFFILIATE';
  if (roleKeys.includes('subscriber') || roleKeys.includes('member')) return 'MEMBER_PREMIUM';
  
  return 'MEMBER_FREE';
}

function generateUsername(email, displayName) {
  if (displayName && displayName !== email) {
    return displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function migrateToEksporyuk() {
  console.log('🚀 SEJOLI → EKSPORYUK MIGRATION');
  console.log('================================\n');

  try {
    // 1. Load exported data
    console.log('📂 Loading exported data...\n');
    
    const users = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_users.json'), 'utf-8')
    );
    
    let userMeta = [];
    try {
      userMeta = JSON.parse(
        await fs.readFile(path.join(EXPORT_DIR, 'sejoli_usermeta.json'), 'utf-8')
      );
    } catch (e) {
      console.log('⚠️  No sejoli_usermeta.json found\n');
    }

    // Build meta lookup
    const metaByUser = {};
    userMeta.forEach(meta => {
      if (!metaByUser[meta.user_id]) metaByUser[meta.user_id] = {};
      metaByUser[meta.user_id][meta.meta_key] = meta.meta_value;
    });

    console.log(`📊 Loaded ${users.length} users\n`);

    // 2. Migrate Users
    console.log('👥 Migrating Users...');
    console.log('=====================\n');

    let migratedCount = 0;
    let skippedCount = 0;
    const userMapping = {}; // Sejoli ID → Eksporyuk ID

    for (const sejoliUser of users) {
      try {
        const role = mapUserRole(sejoliUser.roles);
        const username = generateUsername(sejoliUser.user_email, sejoliUser.display_name);
        const meta = metaByUser[sejoliUser.ID] || {};
        
        // Default password: same as Sejoli (will need reset)
        const hashedPassword = await bcrypt.hash('TempPassword123!', 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: sejoliUser.user_email }
        });

        if (existingUser) {
          console.log(`  ⏭️  Skipped: ${sejoliUser.user_email} (already exists)`);
          userMapping[sejoliUser.ID] = existingUser.id;
          skippedCount++;
          continue;
        }

        // Create user
        const newUser = await prisma.user.create({
          data: {
            email: sejoliUser.user_email,
            username: username,
            password: hashedPassword,
            name: sejoliUser.display_name || username,
            role: role,
            emailVerified: true, // Assume Sejoli users are verified
            whatsapp: meta.billing_phone || null,
            createdAt: new Date(sejoliUser.user_registered),
          }
        });

        userMapping[sejoliUser.ID] = newUser.id;

        // Create wallet
        await prisma.wallet.create({
          data: {
            userId: newUser.id,
            balance: 0,
            balancePending: 0,
          }
        });

        // Create profile based on role
        if (role === 'AFFILIATE') {
          const affiliateCode = `AFF${String(newUser.id).padStart(6, '0')}`;
          await prisma.affiliateProfile.create({
            data: {
              userId: newUser.id,
              affiliateCode: affiliateCode,
              shortLink: `https://eksporyuk.com/go/${username}`,
              commissionRate: 30, // Default 30%
              totalEarnings: 0,
              totalReferrals: 0,
            }
          });
        } else if (role === 'MENTOR') {
          await prisma.mentorProfile.create({
            data: {
              userId: newUser.id,
              bio: meta.description || '',
              expertise: meta.expertise || 'Export Business',
              totalStudents: 0,
              totalCourses: 0,
            }
          });
        }

        console.log(`  ✅ Migrated: ${sejoliUser.user_email} (${role})`);
        migratedCount++;

      } catch (error) {
        console.error(`  ❌ Failed: ${sejoliUser.user_email} - ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`\n📊 User Migration Summary:`);
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${users.length}\n`);

    // 3. Save user mapping for reference
    await fs.writeFile(
      path.join(EXPORT_DIR, '_user-mapping.json'),
      JSON.stringify(userMapping, null, 2)
    );

    // 4. Migrate Affiliates (if has affiliate data)
    try {
      const affiliates = JSON.parse(
        await fs.readFile(path.join(EXPORT_DIR, 'sejoli_affiliates.json'), 'utf-8')
      );

      console.log('💼 Updating Affiliate Profiles...');
      console.log('==================================\n');

      for (const aff of affiliates) {
        const eksporyukUserId = userMapping[aff.user_id];
        if (!eksporyukUserId) continue;

        try {
          await prisma.affiliateProfile.upsert({
            where: { userId: eksporyukUserId },
            create: {
              userId: eksporyukUserId,
              affiliateCode: aff.affiliate_code || `AFF${String(eksporyukUserId).padStart(6, '0')}`,
              shortLink: aff.short_link || `https://eksporyuk.com/go/${eksporyukUserId}`,
              commissionRate: aff.commission_rate || 30,
              totalEarnings: parseFloat(aff.total_earnings || 0),
              totalReferrals: parseInt(aff.total_referrals || 0),
            },
            update: {
              totalEarnings: parseFloat(aff.total_earnings || 0),
              totalReferrals: parseInt(aff.total_referrals || 0),
            }
          });

          console.log(`  ✅ Updated affiliate: User ID ${eksporyukUserId}`);
        } catch (error) {
          console.error(`  ❌ Failed affiliate: ${aff.user_id} - ${error.message}`);
        }
      }

      console.log(`\n✅ Migrated ${affiliates.length} affiliate profiles\n`);

    } catch (e) {
      console.log('⚠️  No affiliates data to migrate\n');
    }

    // 5. Migrate Orders/Transactions (if exists)
    try {
      const orders = JSON.parse(
        await fs.readFile(path.join(EXPORT_DIR, 'sejoli_orders.json'), 'utf-8')
      );

      console.log('💰 Migrating Transactions...');
      console.log('============================\n');

      let txCount = 0;

      for (const order of orders) {
        const eksporyukUserId = userMapping[order.user_id];
        if (!eksporyukUserId) continue;

        try {
          await prisma.transaction.create({
            data: {
              userId: eksporyukUserId,
              amount: parseFloat(order.grand_total || order.total || 0),
              type: 'MEMBERSHIP_PURCHASE',
              status: order.status === 'completed' ? 'COMPLETED' : 'PENDING',
              paymentMethod: order.payment_method || 'MANUAL',
              paymentGateway: 'SEJOLI_MIGRATION',
              description: `Migrated from Sejoli - Order #${order.order_id || order.ID}`,
              createdAt: new Date(order.created_at),
            }
          });

          txCount++;
        } catch (error) {
          console.error(`  ❌ Failed order: ${order.ID} - ${error.message}`);
        }
      }

      console.log(`\n✅ Migrated ${txCount} transactions\n`);

    } catch (e) {
      console.log('⚠️  No orders data to migrate\n');
    }

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Users need to reset passwords (default: TempPassword123!)');
    console.log('2. Review affiliate commission rates');
    console.log('3. Verify transaction data accuracy');
    console.log('4. Test user login with migrated accounts\n');

    console.log('📧 Send password reset emails to all users:');
    console.log('   Run: node scripts/send-password-reset-emails.js\n');

  } catch (error) {
    console.error('❌ Migration Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToEksporyuk().catch(console.error);
