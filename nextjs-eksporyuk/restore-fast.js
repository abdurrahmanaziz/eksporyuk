/**
 * Fast Database Restore - Skip Existing Records
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Restore order
const TABLES = [
  { backup: 'users', model: 'user' },
  { backup: 'wallets', model: 'wallet' },
  { backup: 'memberships', model: 'membership' },
  { backup: 'courses', model: 'course' },
  { backup: 'courseModules', model: 'courseModule' },
  { backup: 'courseLessons', model: 'courseLesson' },
  { backup: 'courseEnrollments', model: 'courseEnrollment' },
  { backup: 'products', model: 'product' },
  { backup: 'coupons', model: 'coupon' },
  { backup: 'groups', model: 'group' },
  { backup: 'groupMembers', model: 'groupMember' },
];

const JSON_FIELDS = [
  'metadata', 'data', 'tags', 'settings', 'config', 'options', 'params',
  'extra', 'json', 'attributes', 'properties', 'detail', 'details',
  'commissionData', 'paymentData', 'orderData', 'transactionData',
  'oneSignalTags', 'mailketingLists', 'customFields', 'features',
  'reminders', 'images', 'faqs', 'testimonials', 'bonuses',
  'downloadableFiles', 'trackingPixels', 'productIds', 'membershipIds',
  'courseIds', 'upsaleTargetMemberships'
];

const DATE_FIELDS = [
  'createdAt', 'updatedAt', 'expiresAt', 'startDate', 'endDate',
  'lastActiveAt', 'lastSeenAt', 'suspendedAt', 'emailVerifiedAt',
  'completedAt', 'paidAt', 'purchasedAt', 'activatedAt', 'lastLoginAt',
  'lastClickedAt', 'convertedAt', 'approvedAt', 'rejectedAt',
  'oneSignalSubscribedAt', 'withdrawalPinSetAt', 'publishedAt',
  'submittedForReviewAt', 'validFrom', 'validUntil'
];

function cleanRecord(record) {
  const cleaned = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null && JSON_FIELDS.includes(key)) {
      continue;
    }
    if (DATE_FIELDS.includes(key) && value) {
      cleaned[key] = new Date(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function restoreTable(tableName, records, modelName) {
  if (!records || records.length === 0) return { created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;

  // Batch check existing IDs first
  const ids = records.map(r => r.id);
  const existing = await prisma[modelName].findMany({
    where: { id: { in: ids } },
    select: { id: true }
  });
  const existingIds = new Set(existing.map(e => e.id));

  // Only insert new records
  const newRecords = records.filter(r => !existingIds.has(r.id));
  
  if (newRecords.length === 0) {
    return { created: 0, skipped: records.length };
  }

  // Batch insert
  for (let i = 0; i < newRecords.length; i += 100) {
    const batch = newRecords.slice(i, i + 100);
    try {
      await prisma[modelName].createMany({
        data: batch.map(cleanRecord),
        skipDuplicates: true
      });
      created += batch.length;
    } catch (error) {
      // Fallback to individual inserts
      for (const record of batch) {
        try {
          await prisma[modelName].create({ data: cleanRecord(record) });
          created++;
        } catch {
          skipped++;
        }
      }
    }
  }

  skipped = existingIds.size;
  console.log(`✅ ${tableName}: ${created} created, ${skipped} skipped`);
  return { created, skipped };
}

async function main() {
  console.log('⚡ Fast Restore (Skip Existing)\n');

  try {
    const backup = JSON.parse(fs.readFileSync('/tmp/db-backup.json', 'utf-8'));

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const { backup: backupKey, model: modelName } of TABLES) {
      if (backup[backupKey]) {
        const result = await restoreTable(backupKey, backup[backupKey], modelName);
        totalCreated += result.created;
        totalSkipped += result.skipped;
      }
    }

    console.log('\n✅ DONE');
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Skipped: ${totalSkipped}`);

    // Verify key data
    const [users, members, groups] = await Promise.all([
      prisma.user.count(),
      prisma.membership.count(),
      prisma.group.count()
    ]);

    console.log(`\n📊 Current state:`);
    console.log(`   Users: ${users}`);
    console.log(`   Memberships: ${members}`);
    console.log(`   Groups: ${groups}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
