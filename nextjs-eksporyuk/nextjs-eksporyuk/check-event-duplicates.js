const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Check EventGroup duplicates
    const groups = await prisma.eventGroup.findMany();
    console.log('Total EventGroup records:', groups.length);
    
    // Check EventMembership duplicates
    const memberships = await prisma.eventMembership.findMany();
    console.log('Total EventMembership records:', memberships.length);
    
    // Group by productId-groupId
    const groupMap = {};
    groups.forEach(g => {
      const key = g.productId + '-' + g.groupId;
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(g.id);
    });
    
    console.log('\nEventGroup duplicates:');
    let hasDuplicates = false;
    Object.entries(groupMap).forEach(([key, ids]) => {
      if (ids.length > 1) {
        console.log(key, ':', ids.length, 'records');
        hasDuplicates = true;
      }
    });
    
    const membershipMap = {};
    memberships.forEach(m => {
      const key = m.productId + '-' + m.membershipId;
      if (!membershipMap[key]) membershipMap[key] = [];
      membershipMap[key].push(m.id);
    });
    
    console.log('\nEventMembership duplicates:');
    Object.entries(membershipMap).forEach(([key, ids]) => {
      if (ids.length > 1) {
        console.log(key, ':', ids.length, 'records');
        hasDuplicates = true;
      }
    });

    if (!hasDuplicates) {
      console.log('\n✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
