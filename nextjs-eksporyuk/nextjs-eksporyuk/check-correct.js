const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATA YANG BENAR ===\n');
  
  // Total users
  const totalPremium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  console.log('MEMBER_PREMIUM:', totalPremium);
  
  // Active memberships by type
  const activeMemberships = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: true
  });
  
  const memberships = await prisma.membership.findMany();
  console.log('\nACTIVE MEMBERSHIPS:');
  let total = 0;
  for (const um of activeMemberships) {
    const m = memberships.find(x => x.id === um.membershipId);
    console.log(`  ${m?.name}: ${um._count} users`);
    total += um._count;
  }
  console.log('  TOTAL:', total);
  
  // Current enrollments and group members
  const enrollments = await prisma.courseEnrollment.count();
  const groupMembers = await prisma.groupMember.count();
  console.log('\nCURRENT STATE:');
  console.log('  Enrollments:', enrollments);
  console.log('  Group Members:', groupMembers);
  
  // Expected counts
  const paket6 = activeMemberships.find(x => x.membershipId === 'mem_6bulan_ekspor')?._count || 0;
  const paket12 = activeMemberships.find(x => x.membershipId === 'mem_12bulan_ekspor')?._count || 0;
  const lifetime = activeMemberships.find(x => x.membershipId === 'mem_lifetime_ekspor')?._count || 0;
  const promo = activeMemberships.find(x => x.membershipId === '10ca914f9de9cc64b01ac382467d5fe9')?._count || 0;
  
  console.log('\nEXPECTED ENROLLMENTS:');
  console.log('  Paket 6 Bulan:', paket6, 'x 1 course =', paket6);
  console.log('  Paket 12 Bulan:', paket12, 'x 1 course =', paket12);
  console.log('  Lifetime:', lifetime, 'x 2 courses =', lifetime * 2);
  console.log('  Promo:', promo, 'x ? courses =', promo * 2);
  console.log('  TOTAL EXPECTED:', paket6 + paket12 + (lifetime * 2) + (promo * 2));
  
  console.log('\nEXPECTED GROUP MEMBERS:');
  console.log('  Paket 6 Bulan:', paket6, 'x 1 group =', paket6);
  console.log('  Paket 12 Bulan:', paket12, 'x 1 group =', paket12);
  console.log('  Lifetime:', lifetime, 'x 2 groups =', lifetime * 2);
  console.log('  Promo:', promo, 'x ? groups =', promo * 2);
  console.log('  TOTAL EXPECTED:', paket6 + paket12 + (lifetime * 2) + (promo * 2));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
