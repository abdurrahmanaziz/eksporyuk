const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUnactivatedTransactions() {
  console.log('\n🔍 FINDING SUCCESS TRANSACTIONS WITHOUT ACTIVATION\n');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const successTxs = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS',
      createdAt: { gte: thirtyDaysAgo }
    },
    select: {
      id: true,
      userId: true,
      membershipId: true,
      amount: true,
      paymentProvider: true,
      paymentMethod: true,
      paidAt: true,
      createdAt: true,
      metadata: true
    }
  });

  console.log(`Total SUCCESS transactions in last 30 days: ${successTxs.length}\n`);

  for (const tx of successTxs) {
    const user = await prisma.user.findUnique({
      where: { id: tx.userId },
      select: { name: true, email: true, role: true }
    });

    const um = await prisma.userMembership.findFirst({
      where: { transactionId: tx.id }
    });

    const membership = tx.membershipId ? await prisma.membership.findUnique({
      where: { id: tx.membershipId },
      select: { name: true }
    }) : null;

    const status = um?.isActive ? '✅ ACTIVATED' : '❌ NOT ACTIVATED';
    
    console.log(`${status}`);
    console.log(`   Transaction: ${tx.id}`);
    console.log(`   User: ${user?.name} (${user?.email})`);
    console.log(`   Role: ${user?.role}`);
    console.log(`   Membership: ${membership?.name || tx.membershipId || 'N/A'}`);
    console.log(`   Amount: Rp ${Number(tx.amount).toLocaleString()}`);
    console.log(`   Provider: ${tx.paymentProvider}`);
    console.log(`   Method: ${tx.paymentMethod}`);
    console.log(`   Paid At: ${tx.paidAt}`);
    
    if (um) {
      console.log(`   UserMembership ID: ${um.id}`);
      console.log(`   UM Status: ${um.status}, isActive: ${um.isActive}`);
    } else {
      console.log(`   ⚠️  NO UserMembership record found!`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

findUnactivatedTransactions().catch(console.error);
