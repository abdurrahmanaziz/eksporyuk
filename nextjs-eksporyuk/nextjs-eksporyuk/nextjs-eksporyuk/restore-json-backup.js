/**
 * Restore Database from JSON Backup
 * Usage: node restore-json-backup.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Restore order based on foreign key dependencies
const RESTORE_ORDER = [
  'users',
  'wallets',
  'memberships',
  'courses',
  'courseModules',
  'courseLessons',
  'products',
  'coupons',
  'affiliateProfiles',
  'userMemberships',
  'courseEnrollments',
  'transactions',
  'affiliateLinks',
  'affiliateConversions',
  'affiliateCommissions',
  'affiliateShortLinks',
  'shortLinkDomains',
];

// Model name mapping from backup to Prisma
const MODEL_MAP = {
  users: 'user',
  wallets: 'wallet',
  memberships: 'membership',
  courses: 'course',
  courseModules: 'courseModule',
  courseLessons: 'courseLesson',
  products: 'product',
  coupons: 'coupon',
  affiliateProfiles: 'affiliateProfile',
  userMemberships: 'userMembership',
  courseEnrollments: 'courseEnrollment',
  transactions: 'transaction',
  affiliateLinks: 'affiliateLink',
  affiliateConversions: 'affiliateConversion',
  affiliateCommissions: 'affiliateCommission',
  affiliateShortLinks: 'affiliateShortLink',
  shortLinkDomains: 'shortLinkDomain',
};

// Fields that need Date conversion
const DATE_FIELDS = [
  'createdAt', 'updatedAt', 'expiresAt', 'startDate', 'endDate',
  'lastActiveAt', 'lastSeenAt', 'suspendedAt', 'emailVerifiedAt',
  'completedAt', 'paidAt', 'purchasedAt', 'activatedAt', 'lastLoginAt',
  'lastClickedAt', 'convertedAt', 'approvedAt', 'rejectedAt',
  'oneSignalSubscribedAt', 'withdrawalPinSetAt'
];

// Fields that are JSON type and should skip null values
const JSON_FIELDS = [
  'metadata', 'data', 'tags', 'settings', 'config', 'options', 'params',
  'extra', 'json', 'attributes', 'properties', 'detail', 'details',
  'commissionData', 'paymentData', 'orderData', 'transactionData',
  'oneSignalTags', 'mailketingLists', 'customFields', 'features',
  'reminders', 'images', 'faqs', 'testimonials', 'bonuses',
  'downloadableFiles', 'trackingPixels', 'productIds', 'membershipIds',
  'courseIds', 'upsaleTargetMemberships'
];

function cleanRecord(record) {
  const cleaned = {};
  for (const [key, value] of Object.entries(record)) {
    // Skip null for JSON fields - Prisma requires undefined, not null
    if (value === null && JSON_FIELDS.includes(key)) {
      continue;
    }
    // Convert date strings to Date objects
    if (DATE_FIELDS.includes(key) && value) {
      cleaned[key] = new Date(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function restoreTable(tableName, records, prismaModel) {
  if (!records || records.length === 0) {
    console.log(`⏭️  ${tableName}: No records to restore`);
    return { restored: 0, skipped: 0, errors: 0 };
  }

  let restored = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const cleanedRecord = cleanRecord(record);
      
      await prisma[prismaModel].upsert({
        where: { id: cleanedRecord.id },
        update: cleanedRecord,
        create: cleanedRecord,
      });
      restored++;
    } catch (error) {
      // Check if it's a unique constraint error (record might already exist)
      if (error.code === 'P2002') {
        skipped++;
      } else {
        errors++;
        if (errors <= 3) {
          console.error(`   ❌ Error on ${tableName}: ${error.message}`);
        }
      }
    }
  }

  console.log(`✅ ${tableName}: ${restored} restored, ${skipped} skipped, ${errors} errors`);
  return { restored, skipped, errors };
}

async function main() {
  console.log('🔄 Database Restore from JSON Backup');
  console.log('=====================================\n');

  try {
    // Load backup
    console.log('📂 Loading backup file...');
    const backupPath = '/tmp/db-backup.json';
    const backupRaw = fs.readFileSync(backupPath, 'utf-8');
    const backup = JSON.parse(backupRaw);

    console.log(`📅 Backup from: ${backup.exportedAt}`);
    console.log('');

    // Show stats
    console.log('📊 Backup contents:');
    for (const key of RESTORE_ORDER) {
      if (backup[key]) {
        console.log(`   ${key}: ${backup[key].length} records`);
      }
    }
    console.log('');

    // Restore in order
    console.log('🔄 Starting restore...\n');
    
    const stats = {
      totalRestored: 0,
      totalSkipped: 0,
      totalErrors: 0,
    };

    for (const key of RESTORE_ORDER) {
      if (backup[key] && MODEL_MAP[key]) {
        const result = await restoreTable(key, backup[key], MODEL_MAP[key]);
        stats.totalRestored += result.restored;
        stats.totalSkipped += result.skipped;
        stats.totalErrors += result.errors;
      }
    }

    // Also restore any extra tables not in the ordered list
    for (const [key, records] of Object.entries(backup)) {
      if (!RESTORE_ORDER.includes(key) && Array.isArray(records) && records.length > 0) {
        const modelName = key.replace(/s$/, ''); // Simple pluralization removal
        const prismaModel = key.slice(0, 1).toLowerCase() + key.slice(1).replace(/s$/, '');
        
        // Check if model exists in Prisma
        if (prisma[prismaModel]) {
          const result = await restoreTable(key, records, prismaModel);
          stats.totalRestored += result.restored;
          stats.totalSkipped += result.skipped;
          stats.totalErrors += result.errors;
        }
      }
    }

    console.log('\n=====================================');
    console.log('📊 Restore Summary:');
    console.log(`   ✅ Restored: ${stats.totalRestored}`);
    console.log(`   ⏭️  Skipped: ${stats.totalSkipped}`);
    console.log(`   ❌ Errors: ${stats.totalErrors}`);
    console.log('=====================================');

    // Verify
    console.log('\n🔍 Verification:');
    const userCount = await prisma.user.count();
    const membershipCount = await prisma.membership.count();
    const affiliateCount = await prisma.affiliateProfile.count();
    console.log(`   Users: ${userCount}`);
    console.log(`   Memberships: ${membershipCount}`);
    console.log(`   Affiliates: ${affiliateCount}`);

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
