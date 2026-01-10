const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const enrolled = await p.courseEnrollment.count();
  const groupMembers = await p.groupMember.count();
  const premium = await p.user.count({where:{role:'MEMBER_PREMIUM'}});
  const activeMembership = await p.userMembership.count({where:{status:'ACTIVE'}});
  
  console.log('=== STATUS SEKARANG ===');
  console.log('Premium Users:', premium);
  console.log('Active Memberships:', activeMembership);
  console.log('Course Enrollments:', enrolled);
  console.log('Group Members:', groupMembers);
  
  // Premium tanpa enrollment
  const premiumUsers = await p.user.findMany({where:{role:'MEMBER_PREMIUM'},select:{id:true}});
  const enrolledUsers = await p.courseEnrollment.findMany({select:{userId:true}});
  const enrolledIds = new Set(enrolledUsers.map(e=>e.userId));
  
  let noEnroll = 0;
  for(const u of premiumUsers) {
    if(!enrolledIds.has(u.id)) noEnroll++;
  }
  console.log('Premium TANPA course enrollment:', noEnroll);
  
  await p.$disconnect();
})();
