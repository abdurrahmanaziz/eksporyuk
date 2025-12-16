const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMembershipPlansAPI() {
  console.log('🧪 Testing Membership Plans API Logic...\n');

  try {
    const plans = await prisma.membership.findMany({
      include: {
        features: {
          orderBy: { order: 'asc' }
        },
        prices: {
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: { status: 'SUCCESS' }
        },
        _count: {
          select: {
            transactions: {
              where: { status: 'SUCCESS' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${plans.length} membership plans\n`);

    plans.forEach(plan => {
      console.log(`📦 ${plan.name}`);
      console.log(`   Duration: ${plan.duration}`);
      console.log(`   Price: Rp ${plan.price.toLocaleString()}`);
      console.log(`   Transactions: ${plan._count.transactions}`);
      if (plan.transactions.length > 0) {
        console.log(`   Last Transaction: ${plan.transactions[0].createdAt.toLocaleDateString()}`);
      }
      console.log('');
    });

    // Sort by latest transaction
    const sortedPlans = [...plans].sort((a, b) => {
      const aLatestTx = a.transactions[0]?.createdAt;
      const bLatestTx = b.transactions[0]?.createdAt;
      
      if (!aLatestTx && !bLatestTx) return 0;
      if (!aLatestTx) return 1;
      if (!bLatestTx) return -1;
      
      return new Date(bLatestTx) - new Date(aLatestTx);
    });

    console.log('📊 Sorted by Latest Transaction:');
    sortedPlans.slice(0, 5).forEach((plan, idx) => {
      const lastTx = plan.transactions[0];
      console.log(`${idx + 1}. ${plan.name} - ${lastTx ? new Date(lastTx.createdAt).toLocaleDateString() : 'No transactions'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testMembershipPlansAPI();
