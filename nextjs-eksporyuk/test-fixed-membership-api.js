const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPI() {
  console.log('🧪 Testing Fixed Membership Plans API...\n');

  try {
    const plans = await prisma.membership.findMany({
      include: {
        membershipFeatures: true,
        userMemberships: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: {
              select: { createdAt: true }
            }
          }
        },
        _count: {
          select: {
            userMemberships: true,
            membershipGroups: true,
            membershipCourses: true,
            membershipProducts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${plans.length} membership plans\n`);

    plans.forEach(plan => {
      const lastTx = plan.userMemberships[0]?.transaction?.createdAt;
      console.log(`📦 ${plan.name}`);
      console.log(`   Duration: ${plan.duration}`);
      console.log(`   Members: ${plan._count.userMemberships}`);
      if (lastTx) {
        console.log(`   Last Transaction: ${new Date(lastTx).toLocaleDateString('id-ID')}`);
      }
      console.log('');
    });

    console.log('✅ API test passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
