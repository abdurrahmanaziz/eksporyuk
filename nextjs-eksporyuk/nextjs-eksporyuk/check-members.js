const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Cek semua membership plans
  console.log('=== MEMBERSHIP PLANS ===');
  const plans = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true, price: true, isActive: true, status: true }
  });
  plans.forEach(p => {
    console.log(`[${p.isActive ? 'ACTIVE' : 'INACTIVE'}] ${p.name} - Rp ${p.price || 0} (slug: ${p.slug})`);
  });
  
  // 2. Cek user by role
  console.log('\n=== USER COUNT BY ROLE ===');
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  roles.forEach(r => console.log(`${r.role}: ${r._count.id}`));
  
  // 3. Total UserMembership
  const totalUM = await prisma.userMembership.count();
  const activeUM = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  console.log('\n=== USER MEMBERSHIP STATS ===');
  console.log(`Total UserMembership records: ${totalUM}`);
  console.log(`Active UserMembership: ${activeUM}`);
  
  // 4. Cek UserMembership by membership name
  console.log('\n=== ACTIVE MEMBERSHIPS BY PLAN ===');
  const umByPlan = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: { id: true }
  });
  
  for (const um of umByPlan) {
    const plan = await prisma.membership.findUnique({ where: { id: um.membershipId } });
    console.log(`${plan?.name || um.membershipId}: ${um._count.id} active users`);
  }
  
  // 5. Cek MEMBER_PREMIUM vs MEMBER_FREE
  console.log('\n=== PREMIUM vs FREE MEMBERS ===');
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  const freeCount = await prisma.user.count({ where: { role: 'MEMBER_FREE' } });
  console.log(`MEMBER_PREMIUM: ${premiumCount}`);
  console.log(`MEMBER_FREE: ${freeCount}`);
  
  // 6. Cek duplikat UserMembership (same user, same membership)
  console.log('\n=== CHECK DUPLICATES ===');
  const allUM = await prisma.userMembership.findMany({
    select: { userId: true, membershipId: true }
  });
  
  const seen = new Set();
  const duplicates = [];
  allUM.forEach(um => {
    const key = `${um.userId}-${um.membershipId}`;
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  });
  console.log(`Duplicate UserMembership entries: ${duplicates.length}`);
  
  // 7. Cek users with sejoli metadata (event/webinar)
  console.log('\n=== SEJOLI USERS (Event/Webinar) ===');
  const sejoliUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'sejoli' } },
        { name: { contains: 'sejoli' } }
      ]
    },
    select: { id: true, email: true, name: true, role: true }
  });
  console.log(`Users with 'sejoli' in email/name: ${sejoliUsers.length}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
