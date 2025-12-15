const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMemberships() {
  console.log('📊 CHECKING MEMBERSHIP DISTRIBUTION FROM IMPORTED DATA');
  console.log('═'.repeat(60));
  
  // Check transactions by product
  const txByProduct = await prisma.$queryRaw`
    SELECT 
      metadata->>'sejoliProductId' as product_id,
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as total_omset
    FROM "Transaction"
    WHERE metadata->>'sejoliProductId' IS NOT NULL
    GROUP BY metadata->>'sejoliProductId'
    ORDER BY completed DESC
  `;
  
  console.log('\n📦 Transactions by Sejoli Product ID:');
  console.log('Product ID | Total Orders | Completed | Omset');
  console.log('-'.repeat(60));
  txByProduct.slice(0, 10).forEach(p => {
    console.log(`${p.product_id.padEnd(10)} | ${String(p.total_orders).padEnd(12)} | ${String(p.completed).padEnd(9)} | Rp ${Number(p.total_omset).toLocaleString('id-ID')}`);
  });
  
  // Check if users have membership records
  const usersWithMembership = await prisma.userMembership.count();
  const usersWithTransaction = await prisma.transaction.count({
    where: { status: 'SUCCESS', type: 'MEMBERSHIP' },
    distinct: ['userId']
  });
  
  console.log('\n👥 USER MEMBERSHIP STATUS:');
  console.log(`Users with UserMembership records: ${usersWithMembership}`);
  console.log(`Users with SUCCESS transactions: ${usersWithTransaction}`);
  
  // Check memberships in system
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      durationType: true,
      durationValue: true
    }
  });
  
  console.log('\n📋 AVAILABLE MEMBERSHIPS IN SYSTEM:');
  memberships.forEach(m => {
    console.log(`- ${m.name} (${m.slug}): Rp ${Number(m.price).toLocaleString('id-ID')} - ${m.durationValue} ${m.durationType}`);
  });
  
  // Check if transactions are linked to membership plans
  const txWithMembershipLink = await prisma.transaction.count({
    where: {
      status: 'SUCCESS',
      membership: { isNot: null }
    }
  });
  
  console.log('\n🔗 TRANSACTION-MEMBERSHIP LINK:');
  console.log(`Transactions linked to UserMembership: ${txWithMembershipLink}`);
  console.log(`Transactions NOT linked: ${usersWithTransaction - txWithMembershipLink}`);
  
  // Sample transactions to see structure
  const sampleTx = await prisma.transaction.findFirst({
    where: { status: 'SUCCESS' },
    include: {
      user: { select: { email: true, name: true } },
      membership: true
    }
  });
  
  if (sampleTx) {
    console.log('\n📄 SAMPLE TRANSACTION:');
    console.log(`User: ${sampleTx.user.name} (${sampleTx.user.email})`);
    console.log(`Amount: Rp ${Number(sampleTx.amount).toLocaleString('id-ID')}`);
    console.log(`Status: ${sampleTx.status}`);
    console.log(`Has Membership Link: ${sampleTx.membership ? 'YES' : 'NO'}`);
    console.log(`Sejoli Product ID: ${sampleTx.metadata?.sejoliProductId}`);
  }
  
  // Check users who paid but don't have membership
  const paidUsersWithoutMembership = await prisma.user.findMany({
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
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          transactions: {
            where: { status: 'SUCCESS' }
          }
        }
      }
    },
    take: 10
  });
  
  console.log('\n⚠️ USERS WITH PAID TRANSACTIONS BUT NO MEMBERSHIP:');
  console.log(`Total: ${paidUsersWithoutMembership.length} (showing first 10)`);
  paidUsersWithoutMembership.forEach(u => {
    console.log(`- ${u.email}: ${u._count.transactions} paid transactions`);
  });
  
  await prisma.$disconnect();
}

checkMemberships();
