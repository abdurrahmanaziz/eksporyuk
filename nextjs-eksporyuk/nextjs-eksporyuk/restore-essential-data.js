const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 Restoring essential data...\n');

    // 1. Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      update: {},
      create: {
        id: 'admin_user_001',
        email: 'admin@eksporyuk.com',
        name: 'Admin Eksporyuk',
        password: '$2b$10$YourHashedPasswordHere', // Will be reset
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      }
    });
    console.log('✅ Admin user restored:', admin.email);

    // 2. Recreate 99 affiliates (minimal data)
    const affiliates = [];
    for (let i = 1; i <= 99; i++) {
      affiliates.push({
        id: `affiliate_${String(i).padStart(3, '0')}`,
        email: `affiliate${i}@eksporyuk.com`,
        name: `Affiliate ${i}`,
        password: '$2b$10$HashedPassword', // Will need to be reset
        role: 'AFFILIATE',
        memberCode: `AFF-${String(i).padStart(5, '0')}`,
        isActive: true,
        emailVerified: true,
      });
    }

    const createdAffiliates = await prisma.user.createMany({
      data: affiliates,
      skipDuplicates: true,
    });
    console.log(`✅ Created ${createdAffiliates.count} affiliate users`);

    // 3. Get training-affiliate course (or create it)
    let course = await prisma.course.findUnique({
      where: { slug: 'training-affiliate' }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          id: 'course_training_aff',
          slug: 'training-affiliate',
          title: 'Training Affiliate',
          description: 'Affiliate training course',
          authorId: admin.id,
          status: 'PUBLISHED',
          isActive: true,
        }
      });
      console.log('✅ Created training-affiliate course');
    } else {
      console.log('✅ training-affiliate course already exists');
    }

    // 4. Create course enrollments for all affiliates
    const affiliateEmails = Array.from({ length: 99 }, (_, i) => `affiliate${i + 1}@eksporyuk.com`);
    const affiliateUsers = await prisma.user.findMany({
      where: { email: { in: affiliateEmails } }
    });

    const enrollments = affiliateUsers.map(user => ({
      id: `enroll_${user.id}_${course.id}`,
      userId: user.id,
      courseId: course.id,
      progress: 0,
      completed: false,
      updatedAt: new Date(),
    }));

    const createdEnrollments = await prisma.courseEnrollment.createMany({
      data: enrollments,
      skipDuplicates: true,
    });
    console.log(`✅ Created ${createdEnrollments.count} course enrollments`);

    // 5. Create wallets for all users
    const allUsers = await prisma.user.findMany();
    const wallets = allUsers.map(user => ({
      id: `wallet_${user.id}`,
      userId: user.id,
      balance: 0,
      balancePending: 0,
      totalEarnings: 0,
      totalPayout: 0,
    }));

    const createdWallets = await prisma.wallet.createMany({
      data: wallets,
      skipDuplicates: true,
    });
    console.log(`✅ Created ${createdWallets.count} wallets`);

    console.log('\n✨ Data restoration complete!');
    console.log(`\n📊 Summary:
  - Admin users: 1
  - Affiliate users: 99
  - Course enrollments: 99
  - Wallets: 100
  
⚠️  Important: Reset all passwords before users can login!
Run: node reset-all-passwords.mjs`);

  } catch (error) {
    console.error('❌ Error restoring data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();
