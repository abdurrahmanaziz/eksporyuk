const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cek user yang punya role MEMBER_FREE tapi ada di UserMembership
  console.log('=== FREE MEMBERS WITH ACTIVE MEMBERSHIP (should be upgraded) ===');
  const freeWithMembership = await prisma.user.findMany({
    where: {
      role: 'MEMBER_FREE',
      userMemberships: {
        some: { status: 'ACTIVE' }
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      userMemberships: {
        where: { status: 'ACTIVE' },
        select: { 
          membership: { select: { name: true } },
          status: true
        }
      }
    },
    take: 20
  });
  
  console.log(`Free members with active membership: ${freeWithMembership.length}`);
  freeWithMembership.forEach(u => {
    const memberships = u.userMemberships.map(um => um.membership?.name).join(', ');
    console.log(`- ${u.email} | ${u.name} | Memberships: ${memberships}`);
  });
  
  // Total count
  const totalFreeWithMembership = await prisma.user.count({
    where: {
      role: 'MEMBER_FREE',
      userMemberships: {
        some: { status: 'ACTIVE' }
      }
    }
  });
  console.log(`\nTotal FREE members with ACTIVE membership: ${totalFreeWithMembership}`);
  
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
  
  // Sample premium tanpa membership
  if (premiumWithoutMembership > 0) {
    const samples = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        NOT: {
          userMemberships: {
            some: { status: 'ACTIVE' }
          }
        }
      },
      select: { id: true, email: true, name: true, createdAt: true },
      take: 10
    });
    console.log('Sample premium without membership:');
    samples.forEach(u => console.log(`- ${u.email} | ${u.name} | Created: ${u.createdAt.toISOString().split('T')[0]}`));
  }
  
  // Cek enrollments by course
  console.log('\n=== COURSE ENROLLMENTS ===');
  const courses = await prisma.course.findMany({
    select: { 
      id: true, 
      title: true,
      _count: { select: { enrollments: true } }
    }
  });
  courses.forEach(c => console.log(`${c.title}: ${c._count.enrollments} enrollments`));
  
  // Total stats
  console.log('\n=== SUMMARY ===');
  const totalUsers = await prisma.user.count();
  const premium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  const free = await prisma.user.count({ where: { role: 'MEMBER_FREE' } });
  const affiliates = await prisma.user.count({ where: { role: 'AFFILIATE' } });
  const activeUserMemberships = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  
  console.log(`Total Users: ${totalUsers}`);
  console.log(`MEMBER_PREMIUM: ${premium}`);
  console.log(`MEMBER_FREE: ${free}`);
  console.log(`AFFILIATE: ${affiliates}`);
  console.log(`Active UserMemberships: ${activeUserMemberships}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
