const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditMembershipStructure() {
  console.log('🔍 AUDIT STRUCTURE MEMBERSHIP & MAPPING\n');
  console.log('================================================\n');

  // 1. Get all memberships dengan detail grup dan kelas
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    include: {
      membershipGroups: { 
        include: { 
          group: { select: { id: true, name: true } } 
        } 
      },
      membershipCourses: { 
        include: { 
          course: { select: { id: true, title: true } } 
        } 
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('📦 MEMBERSHIP PACKAGES & THEIR CONTENT:\n');
  
  for (const m of memberships) {
    console.log(`🎯 ${m.name} (${m.duration})`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Status: ${m.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    console.log(`   📁 Groups (${m.membershipGroups.length}):`);
    m.membershipGroups.forEach(mg => {
      console.log(`      • ${mg.group.name} (ID: ${mg.group.id})`);
    });
    
    console.log(`   📚 Courses (${m.membershipCourses.length}):`);
    m.membershipCourses.forEach(mc => {
      console.log(`      • ${mc.course.title} (ID: ${mc.course.id})`);
    });
    console.log('');
  }

  // 2. Count active user memberships per package
  console.log('================================================');
  console.log('👥 ACTIVE USER COUNT PER MEMBERSHIP:\n');

  for (const m of memberships) {
    const userCount = await prisma.userMembership.count({
      where: { 
        membershipId: m.id,
        isActive: true,
        status: 'ACTIVE'
      }
    });

    console.log(`${m.name}: ${userCount} active users`);
  }

  console.log('\n================================================');
  console.log('📋 MAPPING RULES YANG AKAN DITERAPKAN:\n');

  for (const m of memberships) {
    console.log(`✅ ${m.name}:`);
    console.log(`   → User akan auto-join ke ${m.membershipGroups.length} groups`);
    console.log(`   → User akan auto-enroll ke ${m.membershipCourses.length} courses`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Audit structure complete!');
}

auditMembershipStructure().catch(console.error);