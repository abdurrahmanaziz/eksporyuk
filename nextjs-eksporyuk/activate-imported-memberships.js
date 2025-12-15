const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateMemberships() {
  console.log('🚀 ACTIVATING MEMBERSHIPS FOR IMPORTED TRANSACTIONS');
  console.log('═'.repeat(60));
  
  // Get default membership (you may need to adjust this)
  const defaultMembership = await prisma.membership.findFirst({
    where: { isActive: true },
    orderBy: { price: 'desc' } // Get the highest priced one as default
  });
  
  if (!defaultMembership) {
    console.log('❌ No active membership found in system!');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n📋 Default Membership: ${defaultMembership.name}`);
  console.log(`   Price: Rp ${Number(defaultMembership.price).toLocaleString('id-ID')}`);
  console.log(`   Duration: ${defaultMembership.duration}`);
  
  // Find users with SUCCESS transactions but no membership
  const usersNeedingMembership = await prisma.user.findMany({
    where: {
      transactions: {
        some: {
          status: 'SUCCESS',
          type: 'MEMBERSHIP'
        }
      },
      userMemberships: {
        none: {}
      }
    },
    include: {
      transactions: {
        where: {
          status: 'SUCCESS',
          type: 'MEMBERSHIP'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Get latest transaction
      }
    }
  });
  
  console.log(`\n👥 Users needing membership: ${usersNeedingMembership.length}`);
  
  if (usersNeedingMembership.length === 0) {
    console.log('✅ All users already have memberships!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('\n�� Creating UserMembership records...');
  
  let created = 0;
  let errors = 0;
  
  for (const user of usersNeedingMembership) {
    try {
      const latestTx = user.transactions[0];
      
      // Calculate expiry date based on transaction date + duration
      const startDate = new Date(latestTx.createdAt);
      const expiryDate = new Date(startDate);
      
      // Parse duration (e.g., "6 months", "12 months", "lifetime")
      const duration = defaultMembership.duration?.toLowerCase() || 'lifetime';
      
      if (duration.includes('lifetime') || duration.includes('selamanya')) {
        // Set to 50 years from now for lifetime
        expiryDate.setFullYear(expiryDate.getFullYear() + 50);
      } else {
        // Extract number from duration
        const months = parseInt(duration.match(/\d+/)?.[0] || '12');
        expiryDate.setMonth(expiryDate.getMonth() + months);
      }
      
      await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId: defaultMembership.id,
          transactionId: latestTx.id,
          status: 'ACTIVE',
          startDate: startDate,
          endDate: expiryDate,
          isActive: true
        }
      });
      
      created++;
      
      if (created % 500 === 0) {
        console.log(`   Progress: ${created}/${usersNeedingMembership.length}`);
      }
    } catch (err) {
      errors++;
      if (errors < 5) {
        console.log(`   Error for user ${user.email}: ${err.message}`);
      }
    }
  }
  
  console.log(`\n✅ Activation complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Errors: ${errors}`);
  
  // Verify
  const finalCount = await prisma.userMembership.count();
  const usersWithTx = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "userId") as count
    FROM "Transaction"
    WHERE status = 'SUCCESS' AND type = 'MEMBERSHIP'
  `;
  
  console.log(`\n📊 FINAL STATUS:`);
  console.log(`   UserMemberships: ${finalCount}`);
  console.log(`   Users with transactions: ${Number(usersWithTx[0].count)}`);
  console.log(`   Gap: ${Number(usersWithTx[0].count) - finalCount}`);
  
  await prisma.$disconnect();
}

activateMemberships();
