const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cek transaksi dari Sejoli
  console.log('=== TRANSACTIONS FROM SEJOLI ===');
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { paymentGateway: 'SEJOLI' },
        { externalOrderId: { startsWith: 'sejoli' } },
        { notes: { contains: 'sejoli' } }
      ]
    },
    take: 20,
    include: {
      user: { select: { email: true, name: true, role: true } },
      membership: { select: { name: true } }
    }
  });
  
  console.log(`Found ${transactions.length} Sejoli transactions`);
  transactions.forEach(t => {
    console.log(`- ${t.user?.email} | ${t.membership?.name || 'No membership'} | ${t.status} | Gateway: ${t.paymentGateway}`);
  });
  
  // Cek semua transaksi by gateway
  console.log('\n=== TRANSACTIONS BY GATEWAY ===');
  const byGateway = await prisma.transaction.groupBy({
    by: ['paymentGateway'],
    _count: { id: true }
  });
  byGateway.forEach(g => console.log(`${g.paymentGateway || 'NULL'}: ${g._count.id}`));
  
  // Cek transaksi by membership
  console.log('\n=== TRANSACTIONS BY MEMBERSHIP ===');
  const byMembership = await prisma.transaction.groupBy({
    by: ['membershipId'],
    _count: { id: true }
  });
  
  for (const t of byMembership) {
    if (t.membershipId) {
      const plan = await prisma.membership.findUnique({ where: { id: t.membershipId } });
      console.log(`${plan?.name || t.membershipId}: ${t._count.id} transactions`);
    } else {
      console.log(`No membership: ${t._count.id} transactions`);
    }
  }
  
  // Cek user yang punya role MEMBER_FREE tapi ada di UserMembership
  console.log('\n=== FREE MEMBERS WITH ACTIVE MEMBERSHIP ===');
  const freeWithMembership = await prisma.user.findMany({
    where: {
      role: 'MEMBER_FREE',
      userMemberships: {
        some: { status: 'ACTIVE' }
      }
    },
    include: {
      userMemberships: {
        where: { status: 'ACTIVE' },
        include: { membership: { select: { name: true } } }
      }
    },
    take: 10
  });
  
  console.log(`Free members with active membership: ${freeWithMembership.length}`);
  freeWithMembership.forEach(u => {
    const memberships = u.userMemberships.map(um => um.membership?.name).join(', ');
    console.log(`- ${u.email} | Memberships: ${memberships}`);
  });
  
  // Cek user MEMBER_PREMIUM tanpa UserMembership aktif
  console.log('\n=== PREMIUM MEMBERS WITHOUT ACTIVE MEMBERSHIP ===');
  const premiumWithoutMembership = await prisma.user.count({
    where: {
      role: 'MEMBER_PREMIUM',
      NOT: {
        userMemberships: {
          some: { status: 'ACTIVE' }
        }
      }
    }
  });
  console.log(`Premium members without active UserMembership: ${premiumWithoutMembership}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
