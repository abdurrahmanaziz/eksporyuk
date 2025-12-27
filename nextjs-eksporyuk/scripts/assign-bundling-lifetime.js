/**
 * Assign Lifetime membership + auto-enroll courses + auto-join groups
 * untuk pembeli Bundling EYA yang sudah di-import tapi belum dapat Lifetime
 * 
 * Usage:
 *   node scripts/assign-bundling-lifetime.js --dry-run  # Preview only
 *   node scripts/assign-bundling-lifetime.js --apply    # Execute
 */

require('dotenv').config({ path: '.env.sejoli' });
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Generate cuid-like ID
function generateId() {
  return 'c' + crypto.randomBytes(12).toString('hex');
}

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const isApply = process.argv.includes('--apply');

if (!isDryRun && !isApply) {
  console.log('Usage:');
  console.log('  node scripts/assign-bundling-lifetime.js --dry-run  # Preview');
  console.log('  node scripts/assign-bundling-lifetime.js --apply    # Execute');
  process.exit(1);
}

async function main() {
  console.log(`\n🚀 Assign Lifetime Membership to Bundling EYA Buyers`);
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '⚡ APPLY (will make changes)'}\n`);

  // Connect to Sejoli
  const sejoliConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.SEJOLI_DB_PORT || '3307', 10),
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME
  });

  try {
    // 1. Get bundling buyers from Sejoli
    console.log('📦 Getting Bundling EYA buyers from Sejoli...');
    const [sejoliOrders] = await sejoliConn.execute(`
      SELECT DISTINCT u.user_email, u.display_name
      FROM wp_posts te
      INNER JOIN wp_users u ON te.post_author = u.ID
      INNER JOIN wp_postmeta pm ON te.ID = pm.post_id 
      WHERE te.post_type = 'tutor_enrolled'
        AND pm.meta_key = '_tutor_enrolled_by_product_id'
        AND pm.meta_value = '3840'
        AND te.post_status IN ('completed', 'processing', 'pending')
    `);
    console.log(`   Found ${sejoliOrders.length} buyers\n`);

    const bundlingEmails = sejoliOrders.map(o => o.user_email.toLowerCase());

    // 2. Get Lifetime membership with courses and groups
    const lifetimeMembership = await prisma.membership.findFirst({
      where: { slug: 'lifetime-ekspor' }
    });

    if (!lifetimeMembership) {
      throw new Error('Lifetime membership not found!');
    }

    // Get courses linked to this membership
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: lifetimeMembership.id }
    });
    
    // Get groups linked to this membership
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: lifetimeMembership.id }
    });

    // Get course details
    const courses = await prisma.course.findMany({
      where: { id: { in: membershipCourses.map(mc => mc.courseId) } }
    });
    
    // Get group details
    const groups = await prisma.group.findMany({
      where: { id: { in: membershipGroups.map(mg => mg.groupId) } }
    });

    console.log(`✅ Lifetime Membership: ${lifetimeMembership.name}`);
    console.log(`   Courses: ${courses.map(c => c.title).join(', ') || 'None'}`);
    console.log(`   Groups: ${groups.map(g => g.name).join(', ') || 'None'}\n`);

    // 3. Get users who are bundling buyers but don't have Lifetime
    const importedUsers = await prisma.user.findMany({
      where: {
        email: { in: bundlingEmails, mode: 'insensitive' }
      },
      select: { id: true, email: true, name: true }
    });

    const existingMemberships = await prisma.userMembership.findMany({
      where: {
        userId: { in: importedUsers.map(u => u.id) },
        membershipId: lifetimeMembership.id
      },
      select: { userId: true }
    });

    const userIdsWithLifetime = new Set(existingMemberships.map(um => um.userId));
    const usersNeedingLifetime = importedUsers.filter(u => !userIdsWithLifetime.has(u.id));

    console.log(`📊 Status:`);
    console.log(`   Total bundling buyers: ${sejoliOrders.length}`);
    console.log(`   Already have Lifetime: ${existingMemberships.length}`);
    console.log(`   Need to assign Lifetime: ${usersNeedingLifetime.length}\n`);

    if (usersNeedingLifetime.length === 0) {
      console.log('✅ All bundling buyers already have Lifetime membership!');
      return;
    }

    // 4. Process each user
    let assignedCount = 0;
    let enrolledCount = 0;
    let groupJoinedCount = 0;
    let errorCount = 0;

    console.log(`Processing ${usersNeedingLifetime.length} users...\n`);

    for (const user of usersNeedingLifetime) {
      try {
        const now = new Date();
        const lifetimeEnd = new Date('2099-12-31');
        
        if (!isDryRun) {
          // Assign Lifetime membership
          await prisma.userMembership.create({
            data: {
              id: generateId(),
              userId: user.id,
              membershipId: lifetimeMembership.id,
              status: 'ACTIVE',
              isActive: true,
              startDate: now,
              endDate: lifetimeEnd,
              activatedAt: now,
              updatedAt: now
            }
          });
        }
        assignedCount++;

        // Auto-enroll courses
        for (const mc of membershipCourses) {
          const existing = await prisma.courseEnrollment.findFirst({
            where: { userId: user.id, courseId: mc.courseId }
          });
          
          if (!existing) {
            if (!isDryRun) {
              await prisma.courseEnrollment.create({
                data: {
                  id: generateId(),
                  userId: user.id,
                  courseId: mc.courseId,
                  progress: 0,
                  completed: false,
                  updatedAt: now
                }
              });
            }
            enrolledCount++;
          }
        }

        // Auto-join groups
        for (const mg of membershipGroups) {
          const existing = await prisma.groupMember.findFirst({
            where: { userId: user.id, groupId: mg.groupId }
          });
          
          if (!existing) {
            if (!isDryRun) {
              await prisma.groupMember.create({
                data: {
                  id: generateId(),
                  userId: user.id,
                  groupId: mg.groupId,
                  role: 'MEMBER',
                  joinedAt: now
                }
              });
            }
            groupJoinedCount++;
          }
        }

        // Progress indicator
        if (assignedCount % 100 === 0 || assignedCount === usersNeedingLifetime.length) {
          console.log(`   Processed ${assignedCount}/${usersNeedingLifetime.length}...`);
        }

      } catch (err) {
        console.error(`   ❌ Error for ${user.email}: ${err.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SUMMARY ${isDryRun ? '(DRY RUN)' : ''}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   ✅ Lifetime memberships assigned: ${assignedCount}`);
    console.log(`   ✅ Course enrollments created: ${enrolledCount}`);
    console.log(`   ✅ Group memberships created: ${groupJoinedCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log(`${'='.repeat(60)}\n`);

    if (isDryRun) {
      console.log('💡 This was a DRY RUN. No changes were made.');
      console.log('   Run with --apply to execute the changes.\n');
    } else {
      console.log('✅ All changes have been applied!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SSH tunnel belum aktif!');
      console.log('   Jalankan: node scripts/open-sejoli-tunnel.js');
    }
  } finally {
    await sejoliConn.end();
    await prisma.$disconnect();
  }
}

main().catch(console.error);
