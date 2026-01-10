const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const DATE_FIELDS = ['createdAt', 'updatedAt', 'expiresAt', 'startDate', 'endDate', 'lastActiveAt', 'lastSeenAt', 'suspendedAt', 'emailVerifiedAt', 'completedAt', 'paidAt', 'purchasedAt', 'activatedAt', 'lastLoginAt', 'lastClickedAt', 'convertedAt', 'approvedAt', 'rejectedAt', 'oneSignalSubscribedAt', 'withdrawalPinSetAt', 'publishedAt'];
const JSON_FIELDS = ['metadata', 'data', 'tags', 'settings', 'config', 'options', 'params', 'extra', 'json', 'attributes', 'properties', 'detail', 'details', 'commissionData', 'paymentData', 'orderData', 'transactionData', 'oneSignalTags', 'mailketingLists', 'customFields', 'features', 'reminders', 'images', 'faqs', 'testimonials', 'bonuses', 'downloadableFiles', 'trackingPixels', 'productIds', 'membershipIds', 'courseIds', 'upsaleTargetMemberships'];

function clean(r) {
  const c = {};
  for (const [k, v] of Object.entries(r)) {
    if (v === null && JSON_FIELDS.includes(k)) continue;
    c[k] = DATE_FIELDS.includes(k) && v ? new Date(v) : v;
  }
  return c;
}

async function restore(table, records, model) {
  if (!records?.length) return { ok: 0, skip: 0, err: 0 };
  let ok = 0, skip = 0, err = 0;
  for (const r of records) {
    try {
      const existing = await prisma[model].findUnique({ where: { id: r.id } });
      if (existing) { skip++; continue; }
      await prisma[model].create({ data: clean(r) });
      ok++;
    } catch (e) {
      err++;
      if (err <= 3) console.error(`   ❌ ${table}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`✅ ${table}: ${ok} restored, ${skip} skipped, ${err} errors`);
  return { ok, skip, err };
}

async function main() {
  console.log('🔄 Fast Restore\n');
  const backup = JSON.parse(fs.readFileSync('/tmp/db-backup.json', 'utf-8'));
  console.log(`📅 Backup: ${backup.exportedAt}\n`);

  const stats = { ok: 0, skip: 0, err: 0 };
  const tables = [
    ['users', 'user'],
    ['wallets', 'wallet'],
    ['memberships', 'membership'],
    ['courses', 'course'],
    ['products', 'product'],
    ['coupons', 'coupon'],
    ['courseModules', 'courseModule'],
    ['courseLessons', 'courseLesson'],
  ];

  for (const [key, model] of tables) {
    if (backup[key]) {
      const r = await restore(key, backup[key], model);
      stats.ok += r.ok; stats.skip += r.skip; stats.err += r.err;
    }
  }

  console.log(`\n📊 Total: ${stats.ok} restored, ${stats.skip} skipped, ${stats.err} errors\n`);
  
  const m = await prisma.membership.count();
  const u = await prisma.user.count();
  const c = await prisma.course.count();
  console.log(`Memberships: ${m}, Users: ${u}, Courses: ${c}`);
  
  await prisma.$disconnect();
}

main();
