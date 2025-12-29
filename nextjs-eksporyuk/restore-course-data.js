/**
 * Restore dari backup format lama (backup.tables)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const JSON_FIELDS = [
  'metadata', 'data', 'tags', 'settings', 'config', 'options', 'params',
  'extra', 'json', 'attributes', 'properties', 'detail', 'details',
  'commissionData', 'paymentData', 'orderData', 'transactionData',
  'oneSignalTags', 'mailketingLists', 'customFields', 'features',
  'reminders', 'images', 'faqs', 'testimonials', 'bonuses',
  'downloadableFiles', 'trackingPixels', 'bannedWords', 'postingSettings'
];

const DATE_FIELDS = [
  'createdAt', 'updatedAt', 'expiresAt', 'startDate', 'endDate',
  'lastActiveAt', 'lastSeenAt', 'suspendedAt', 'emailVerifiedAt',
  'completedAt', 'paidAt', 'purchasedAt', 'activatedAt', 'lastLoginAt',
  'lastClickedAt', 'convertedAt', 'approvedAt', 'rejectedAt',
  'oneSignalSubscribedAt', 'withdrawalPinSetAt', 'publishedAt'
];

const MODEL_MAP = {
  courseModule: 'courseModule',
  courseLesson: 'courseLesson',
  group: 'group',
  groupMember: 'groupMember',
  course: 'course',
  courseEnrollment: 'courseEnrollment',
};

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

  // Batch check existing
  const ids = records.map(r => r.id).filter(id => id);
  if (ids.length === 0) return { created: 0, skipped: records.length };

  const existing = await prisma[modelName].findMany({
    where: { id: { in: ids } },
    select: { id: true }
  });
  const existingIds = new Set(existing.map(e => e.id));

  const newRecords = records.filter(r => !existingIds.has(r.id));
  
  if (newRecords.length === 0) {
    return { created: 0, skipped: records.length };
  }

  // Batch insert
  for (let i = 0; i < newRecords.length; i += 50) {
    const batch = newRecords.slice(i, i + 50);
    try {
      await prisma[modelName].createMany({
        data: batch.map(cleanRecord),
        skipDuplicates: true
      });
      created += batch.length;
    } catch (error) {
      console.log(`   Warning on ${tableName}:`, error.message);
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
  console.log('⚡ Restore Course Data (27 Dec Backup)\n');

  try {
    const backup = JSON.parse(fs.readFileSync('/tmp/db-backup-dec27.json', 'utf-8'));
    const tables = backup.tables;

    let totalCreated = 0;
    let totalSkipped = 0;

    // Priority order - restore course structure first
    const priority = ['course', 'courseModule', 'courseLesson', 'courseEnrollment', 'group', 'groupMember'];

    for (const tableName of priority) {
      if (tables[tableName] && MODEL_MAP[tableName]) {
        const result = await restoreTable(tableName, tables[tableName], MODEL_MAP[tableName]);
        totalCreated += result.created;
        totalSkipped += result.skipped;
      }
    }

    console.log('\n✅ DONE');
    console.log(`   Created: ${totalCreated}`);
    console.log(`   Skipped: ${totalSkipped}`);

    // Verify
    const stats = await Promise.all([
      prisma.course.count(),
      prisma.courseModule.count(),
      prisma.courseLesson.count(),
      prisma.group.count(),
      prisma.groupMember.count()
    ]);

    console.log('\n📊 Restored:');
    console.log(`   Courses: ${stats[0]}`);
    console.log(`   Modules: ${stats[1]}`);
    console.log(`   Lessons: ${stats[2]}`);
    console.log(`   Groups: ${stats[3]}`);
    console.log(`   GroupMembers: ${stats[4]}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
