/**
 * Check User Count Discrepancy
 * Investigasi kenapa lokal (18ribu) vs live (19ribu) padahal DB sama
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserCountDiscrepancy() {
  console.log('\n=== Investigating User Count Discrepancy ===\n');
  console.log('Issue: Lokal shows 18k users, Live shows 19k users');
  console.log('Database: Same Neon PostgreSQL database\n');

  try {
    // 1. Total user count (RAW QUERY untuk pastikan tidak ada cache)
    console.log('--- Direct Database Query (No Cache) ---');
    const rawCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    console.log(`Raw SQL Count: ${rawCount[0].count} users`);

    // 2. Prisma count (mungkin ada cache?)
    const prismaCount = await prisma.user.count();
    console.log(`Prisma Count: ${prismaCount} users`);

    // 3. Check database connection details
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_schema() as schema_name,
        version() as pg_version
    `;
    console.log('\n--- Database Connection Info ---');
    console.log(`Database: ${dbInfo[0].database_name}`);
    console.log(`Schema: ${dbInfo[0].schema_name}`);
    console.log(`PostgreSQL: ${dbInfo[0].pg_version.substring(0, 50)}...`);

    // 4. Count by role
    console.log('\n--- User Count by Role ---');
    const countByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    let totalByRole = 0;
    countByRole.forEach(item => {
      console.log(`${item.role}: ${item._count.id} users`);
      totalByRole += item._count.id;
    });
    console.log(`\nTotal (sum by role): ${totalByRole}`);

    // 5. Count by creation date ranges
    console.log('\n--- User Count by Creation Date ---');
    const dateRanges = [
      { label: 'Before 2024', end: '2024-01-01' },
      { label: '2024 Q1', start: '2024-01-01', end: '2024-04-01' },
      { label: '2024 Q2', start: '2024-04-01', end: '2024-07-01' },
      { label: '2024 Q3', start: '2024-07-01', end: '2024-10-01' },
      { label: '2024 Q4', start: '2024-10-01', end: '2025-01-01' },
      { label: '2025', start: '2025-01-01' }
    ];

    for (const range of dateRanges) {
      const where = {};
      if (range.start && range.end) {
        where.createdAt = {
          gte: new Date(range.start),
          lt: new Date(range.end)
        };
      } else if (range.start) {
        where.createdAt = { gte: new Date(range.start) };
      } else if (range.end) {
        where.createdAt = { lt: new Date(range.end) };
      }

      const count = await prisma.user.count({ where });
      console.log(`${range.label}: ${count} users`);
    }

    // 6. Check for soft-deleted users (if deletedAt exists)
    console.log('\n--- Checking for Soft-Deleted Users ---');
    try {
      const deletedCount = await prisma.user.count({
        where: {
          deletedAt: { not: null }
        }
      });
      console.log(`Users with deletedAt set: ${deletedCount}`);
      console.log(`Active users (without deletedAt): ${prismaCount - deletedCount}`);
    } catch (e) {
      console.log('No deletedAt field in User model (OK)');
    }

    // 7. Check for users with/without email (validation)
    console.log('\n--- Data Quality Check ---');
    const withEmail = await prisma.user.count({
      where: { 
        email: { 
          not: { equals: null }
        } 
      }
    });
    const withoutEmail = await prisma.user.count({
      where: { 
        OR: [
          { email: null },
          { email: '' }
        ]
      }
    });
    console.log(`Users with email: ${withEmail}`);
    console.log(`Users without email: ${withoutEmail}`);

    // 8. Check latest 5 users
    console.log('\n--- Latest 5 Users (Most Recent) ---');
    const latestUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    latestUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
    });

    // 9. Check API endpoint used by /admin/users page
    console.log('\n\n--- Checking API Endpoint Logic ---');
    console.log('The /admin/users page likely calls: /api/admin/users');
    console.log('Let\'s verify what filters might be applied...\n');

    // Simulate possible API filters
    const defaultFilters = {
      all: prismaCount,
      active: await prisma.user.count({
        where: {
          // Check if there's an "active" or "status" field
          // This is a guess - actual API might filter differently
        }
      })
    };

    console.log('Possible API scenarios:');
    console.log(`- Total users (no filter): ${defaultFilters.all}`);
    
    // 10. Connection string check
    console.log('\n--- Environment Check ---');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Mask password for security
      const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
      console.log(`DATABASE_URL: ${maskedUrl}`);
      
      // Check if it's the correct Neon database
      if (dbUrl.includes('ep-purple-breeze-a1ovfiz0')) {
        console.log('✅ Correct Neon database (ep-purple-breeze-a1ovfiz0)');
      } else {
        console.log('⚠️  WARNING: Different database endpoint!');
      }
    }

    // 11. Cache check
    console.log('\n--- Cache Investigation ---');
    console.log('Potential cache locations:');
    console.log('- Next.js .next/cache (cleared)');
    console.log('- Prisma query cache (in-memory, expires on restart)');
    console.log('- Browser cache (localStorage, sessionStorage)');
    console.log('- API route cache (if revalidate set)');
    
    console.log('\n--- SUMMARY ---');
    console.log(`✅ Database Connection: neondb (Neon PostgreSQL)`);
    console.log(`✅ Raw Count: ${rawCount[0].count} users`);
    console.log(`✅ Prisma Count: ${prismaCount} users`);
    console.log(`\n🔍 DIAGNOSIS:`);
    
    if (rawCount[0].count === prismaCount) {
      console.log(`Database has EXACTLY ${prismaCount} users.`);
      console.log(`\nIf admin page shows different number:`);
      console.log(`1. Frontend cache (browser) - Clear browser cache`);
      console.log(`2. API response cache - Check API route revalidation`);
      console.log(`3. Pagination/filtering - Check if API applies filters`);
      console.log(`4. Deployment lag - Production may not be updated yet`);
    } else {
      console.log(`⚠️  MISMATCH: Raw count (${rawCount[0].count}) != Prisma count (${prismaCount})`);
      console.log(`This suggests Prisma cache issue or query difference.`);
    }

    console.log('\n✅ Investigation complete!\n');

  } catch (error) {
    console.error('❌ Error during investigation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run investigation
checkUserCountDiscrepancy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
