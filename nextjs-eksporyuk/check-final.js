const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMBERSHIP DATA CHECK ===\n');
  
  // 1. Membership Plans
  console.log('=== MEMBERSHIP PLANS ===');
  const plans = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true, price: true, isActive: true }
  });
  plans.forEach(p => {
    console.log(`[${p.isActive ? 'ACTIVE' : 'INACTIVE'}] ${p.name} - Rp ${p.price || 0} (id: ${p.id})`);
  });
  
  // 2. User by role
  console.log('\n=== USER COUNT BY ROLE ===');
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  roles.forEach(r => console.log(`${r.role}: ${r._count.id}`));
  
  // 3. UserMembership stats
  console.log('\n=== USER MEMBERSHIP STATS ===');
  const umTotal = await prisma.userMembership.count();
  const umActive = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  const umPending = await prisma.userMembership.count({ where: { status: 'PENDING' } });
  const umExpired = await prisma.userMembership.count({ where: { status: 'EXPIRED' } });
  console.log(`Total: ${umTotal}`);
  console.log(`Active: ${umActive}`);
  console.log(`Pending: ${umPending}`);
  console.log(`Expired: ${umExpired}`);
  
  // 4. UserMembership by Membership
  console.log('\n=== ACTIVE MEMBERSHIPS BY PLAN ===');
  const umByPlan = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: { id: true }
  });
  
  for (const um of umByPlan) {
    const plan = await prisma.membership.findUnique({ where: { id: um.membershipId } });
    console.log(`${plan?.name || um.membershipId}: ${um._count.id} active`);
  }
  
  // 5. Cek FREE members yang punya UserMembership ACTIVE
  console.log('\n=== CHECK: FREE MEMBERS WITH ACTIVE MEMBERSHIP ===');
  const freeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' },
    select: { id: true, email: true, name: true }
  });
  
  let freeWithActive = 0;
  const problematicUsers = [];
  
  for (const user of freeUsers) {
    const activeUM = await prisma.userMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    if (activeUM) {
      freeWithActive++;
      if (problematicUsers.length < 10) {
        const plan = await prisma.membership.findUnique({ where: { id: activeUM.membershipId } });
        problematicUsers.push({
          email: user.email,
          name: user.name,
          membership: plan?.name
        });
      }
    }
  }
  
  console.log(`FREE members with ACTIVE membership: ${freeWithActive}`);
  if (problematicUsers.length > 0) {
    console.log('Sample (should upgrade to PREMIUM):');
    problematicUsers.forEach(u => console.log(`  - ${u.email} | ${u.name} | ${u.membership}`));
  }
  
  // 6. Cek PREMIUM members tanpa UserMembership
  console.log('\n=== CHECK: PREMIUM MEMBERS WITHOUT ACTIVE MEMBERSHIP ===');
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, email: true, name: true, createdAt: true }
  });
  
  let premiumWithoutActive = 0;
  const premiumNoMembership = [];
  
  for (const user of premiumUsers) {
    const activeUM = await prisma.userMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    if (!activeUM) {
      premiumWithoutActive++;
      if (premiumNoMembership.length < 10) {
        premiumNoMembership.push({
          email: user.email,
          name: user.name,
          created: user.createdAt.toISOString().split('T')[0]
        });
      }
    }
  }
  
  console.log(`PREMIUM members without ACTIVE membership: ${premiumWithoutActive}`);
  if (premiumNoMembership.length > 0) {
    console.log('Sample:');
    premiumNoMembership.forEach(u => console.log(`  - ${u.email} | ${u.name} | Created: ${u.created}`));
  }
  
  // 7. Course enrollments
  console.log('\n=== COURSE ENROLLMENTS ===');
  const courses = await prisma.course.findMany({
    select: { 
      id: true, 
      title: true,
      _count: { select: { enrollments: true } }
    }
  });
  courses.forEach(c => console.log(`${c.title}: ${c._count.enrollments} enrollments`));
  
  // 8. Check for duplicate UserMembership
  console.log('\n=== CHECK DUPLICATES ===');
  const allUM = await prisma.userMembership.findMany({
    select: { userId: true, membershipId: true }
  });
  
  const seen = new Set();
  let duplicates = 0;
  allUM.forEach(um => {
    const key = `${um.userId}-${um.membershipId}`;
    if (seen.has(key)) duplicates++;
    seen.add(key);
  });
  console.log(`Duplicate UserMembership entries: ${duplicates}`);
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const totalUsers = await prisma.user.count();
  console.log(`Total Users: ${totalUsers}`);
  console.log(`MEMBER_PREMIUM: ${roles.find(r => r.role === 'MEMBER_PREMIUM')?._count.id || 0}`);
  console.log(`MEMBER_FREE: ${roles.find(r => r.role === 'MEMBER_FREE')?._count.id || 0}`);
  console.log(`Active UserMemberships: ${umActive}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
