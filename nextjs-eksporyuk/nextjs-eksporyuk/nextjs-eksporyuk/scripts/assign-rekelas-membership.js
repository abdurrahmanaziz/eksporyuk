/**
 * Assign Re Kelas membership + auto-enroll courses + auto-join groups
 * Memberikan membership tertinggi berdasarkan pembelian di Sejoli
 * 
 * Usage:
 *   node scripts/assign-rekelas-membership.js --dry-run  # Preview only
 *   node scripts/assign-rekelas-membership.js --apply    # Execute
 */

require('dotenv').config({ path: '.env.sejoli' });
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const isApply = process.argv.includes('--apply');

// Generate cuid-like ID
function generateId() {
  return 'c' + crypto.randomBytes(12).toString('hex');
}

if (!isDryRun && !isApply) {
  console.log('Usage:');
  console.log('  node scripts/assign-rekelas-membership.js --dry-run  # Preview');
  console.log('  node scripts/assign-rekelas-membership.js --apply    # Execute');
  process.exit(1);
}

async function main() {
  console.log(`\n🚀 Assign Re Kelas Membership (Highest Tier)`);
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '⚡ APPLY (will make changes)'}\n`);

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.SEJOLI_DB_PORT || '3307', 10),
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME
  });

  try {
    // Re Kelas products - priority determines which one to assign
    const reKelasProducts = [
      { id: 8914, name: 'Re Kelas 6 Bulan', priority: 1, membershipSlug: '6bulan-ekspor' },
      { id: 8915, name: 'Re Kelas 12 Bulan', priority: 2, membershipSlug: '12bulan-ekspor' },
      { id: 8910, name: 'Re Kelas Lifetime', priority: 3, membershipSlug: 'lifetime-ekspor' }
    ];

    console.log('📦 Getting Re Kelas buyers from Sejoli...');

    // Collect all buyers with their highest priority
    const buyerMap = new Map();

    for (const product of reKelasProducts) {
      const [orders] = await conn.execute(`
        SELECT DISTINCT u.user_email, u.display_name
        FROM wp_posts te
        INNER JOIN wp_users u ON te.post_author = u.ID
        INNER JOIN wp_postmeta pm ON te.ID = pm.post_id 
        WHERE te.post_type = 'tutor_enrolled'
          AND pm.meta_key = '_tutor_enrolled_by_product_id'
          AND pm.meta_value = ?
          AND te.post_status IN ('completed', 'processing', 'pending')
      `, [String(product.id)]);

      console.log(`   ${product.name}: ${orders.length} buyers`);

      for (const order of orders) {
        const email = order.user_email.toLowerCase();
        const existing = buyerMap.get(email);
        
        if (!existing || product.priority > existing.highestPriority) {
          buyerMap.set(email, {
            name: order.display_name,
            highestPriority: product.priority,
            productName: product.name,
            membershipSlug: product.membershipSlug
          });
        }
      }
    }

    console.log(`\n📊 Total unique Re Kelas buyers: ${buyerMap.size}`);

    // Get all memberships with their courses and groups
    const memberships = await prisma.membership.findMany({
      where: {
        slug: { in: ['6bulan-ekspor', '12bulan-ekspor', 'lifetime-ekspor'] }
      }
    });

    const membershipMap = new Map(memberships.map(m => [m.slug, m]));

    // Get membership courses and groups
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: { in: memberships.map(m => m.id) } }
    });
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: { in: memberships.map(m => m.id) } }
    });

    // Build course/group maps by membership
    const coursesByMembership = new Map();
    const groupsByMembership = new Map();
    
    for (const mc of membershipCourses) {
      if (!coursesByMembership.has(mc.membershipId)) {
        coursesByMembership.set(mc.membershipId, []);
      }
      coursesByMembership.get(mc.membershipId).push(mc.courseId);
    }
    
    for (const mg of membershipGroups) {
      if (!groupsByMembership.has(mg.membershipId)) {
        groupsByMembership.set(mg.membershipId, []);
      }
      groupsByMembership.get(mg.membershipId).push(mg.groupId);
    }

    console.log('\n✅ Memberships loaded:');
    for (const [slug, m] of membershipMap) {
      const courses = coursesByMembership.get(m.id) || [];
      const groups = groupsByMembership.get(m.id) || [];
      console.log(`   ${m.name}: ${courses.length} courses, ${groups.length} groups`);
    }

    // Get existing users
    const allEmails = Array.from(buyerMap.keys());
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: allEmails, mode: 'insensitive' } },
      select: { id: true, email: true, name: true }
    });
    const existingEmailMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

    // Get existing memberships
    const userIds = existingUsers.map(u => u.id);
    const existingMemberships = await prisma.userMembership.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, membershipId: true }
    });

    const userMembershipMap = new Map();
    for (const um of existingMemberships) {
      if (!userMembershipMap.has(um.userId)) {
        userMembershipMap.set(um.userId, new Set());
      }
      userMembershipMap.get(um.userId).add(um.membershipId);
    }

    // Membership priority map
    const membershipPriority = {
      'mem_6bulan_ekspor': 1,
      'mem_12bulan_ekspor': 2,
      'mem_lifetime_ekspor': 3
    };

    // Determine what to assign
    const toAssign = [];

    for (const [email, data] of buyerMap) {
      const user = existingEmailMap.get(email);
      if (!user) continue;

      const membership = membershipMap.get(data.membershipSlug);
      if (!membership) continue;

      const existingMems = userMembershipMap.get(user.id) || new Set();
      
      // Check if user already has this or higher membership
      let hasHigherOrEqual = false;
      const targetPriority = membershipPriority[membership.id] || 0;
      
      for (const memId of existingMems) {
        const existingPriority = membershipPriority[memId] || 0;
        if (existingPriority >= targetPriority) {
          hasHigherOrEqual = true;
          break;
        }
      }

      if (!hasHigherOrEqual) {
        toAssign.push({
          user,
          membership,
          courses: coursesByMembership.get(membership.id) || [],
          groups: groupsByMembership.get(membership.id) || []
        });
      }
    }

    console.log(`\n📊 To assign: ${toAssign.length} users`);

    if (toAssign.length === 0) {
      console.log('\n✅ All Re Kelas buyers already have appropriate memberships!');
      return;
    }

    // Group by membership for summary
    const byMembership = {};
    for (const item of toAssign) {
      const name = item.membership.name;
      byMembership[name] = (byMembership[name] || 0) + 1;
    }
    
    console.log('\n📊 Breakdown:');
    for (const [name, count] of Object.entries(byMembership)) {
      console.log(`   ${name}: ${count} users`);
    }

    // Process assignments
    let assignedCount = 0;
    let enrolledCount = 0;
    let groupJoinedCount = 0;
    let errorCount = 0;

    console.log(`\nProcessing ${toAssign.length} users...\n`);

    for (const item of toAssign) {
      try {
        const now = new Date();
        const { user, membership, courses, groups } = item;
        
        // Calculate end date
        let endDate;
        if (membership.slug === 'lifetime-ekspor') {
          endDate = new Date('2099-12-31');
        } else if (membership.slug === '12-bulan-ekspor') {
          endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 12);
        } else {
          endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 6);
        }

        if (!isDryRun) {
          // Assign membership
          await prisma.userMembership.create({
            data: {
              id: generateId(),
              userId: user.id,
              membershipId: membership.id,
              status: 'ACTIVE',
              isActive: true,
              startDate: now,
              endDate: endDate,
              activatedAt: now,
              updatedAt: now
            }
          });
        }
        assignedCount++;

        // Auto-enroll courses
        for (const courseId of courses) {
          const existing = await prisma.courseEnrollment.findFirst({
            where: { userId: user.id, courseId }
          });
          
          if (!existing) {
            if (!isDryRun) {
              await prisma.courseEnrollment.create({
                data: {
                  id: generateId(),
                  userId: user.id,
                  courseId,
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
        for (const groupId of groups) {
          const existing = await prisma.groupMember.findFirst({
            where: { userId: user.id, groupId }
          });
          
          if (!existing) {
            if (!isDryRun) {
              await prisma.groupMember.create({
                data: {
                  id: generateId(),
                  userId: user.id,
                  groupId,
                  role: 'MEMBER',
                  joinedAt: now
                }
              });
            }
            groupJoinedCount++;
          }
        }

        // Progress indicator
        if (assignedCount % 50 === 0 || assignedCount === toAssign.length) {
          console.log(`   Processed ${assignedCount}/${toAssign.length}...`);
        }

      } catch (err) {
        console.error(`   ❌ Error for ${item.user.email}: ${err.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SUMMARY ${isDryRun ? '(DRY RUN)' : ''}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   ✅ Memberships assigned: ${assignedCount}`);
    console.log(`   ✅ Course enrollments created: ${enrolledCount}`);
    console.log(`   ✅ Group memberships created: ${groupJoinedCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log(`${'='.repeat(60)}`);

    if (!isDryRun) {
      console.log('\n✅ All changes have been applied!');
    } else {
      console.log('\n⚠️  This was a dry run. Use --apply to make changes.');
    }

  } finally {
    await conn.end();
    await prisma.$disconnect();
  }
}

main().catch(console.error);
