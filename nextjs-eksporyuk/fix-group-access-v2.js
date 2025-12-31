/**
 * Fix Group Access for Premium Members (Improved Version)
 * Uses findFirst instead of findUnique for checking existing members
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const prisma = new PrismaClient();

const createId = () => randomBytes(16).toString('hex');

async function fixGroupAccess() {
  console.log('=== FIX GROUP ACCESS FOR PREMIUM MEMBERS ===\n');
  
  // 1. Get all ACTIVE memberships
  const activeMemberships = await prisma.userMembership.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true
    },
    select: {
      userId: true,
      membershipId: true
    }
  });
  
  console.log(`Found ${activeMemberships.length} active memberships to check\n`);
  
  let groupsAdded = 0;
  let usersFixed = 0;
  let alreadyHasAccess = 0;
  let errors = 0;
  
  for (let i = 0; i < activeMemberships.length; i++) {
    const um = activeMemberships[i];
    let userFixed = false;
    
    // Get groups linked to this membership
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: um.membershipId }
    });
    
    for (const mg of membershipGroups) {
      try {
        // Use findFirst instead of findUnique
        const existing = await prisma.groupMember.findFirst({
          where: {
            groupId: mg.groupId,
            userId: um.userId
          }
        });
        
        if (existing) {
          alreadyHasAccess++;
        } else {
          await prisma.groupMember.create({
            data: {
              id: createId(),
              groupId: mg.groupId,
              userId: um.userId,
              role: 'MEMBER'
            }
          });
          groupsAdded++;
          userFixed = true;
        }
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.log('Error:', err.message);
        }
      }
    }
    
    if (userFixed) usersFixed++;
    
    // Progress every 500
    if ((i + 1) % 500 === 0) {
      console.log(`Processed ${i + 1}/${activeMemberships.length}... (${groupsAdded} groups added)`);
    }
  }
  
  console.log('\n=== RESULT ===');
  console.log(`Users fixed: ${usersFixed}`);
  console.log(`Group memberships added: ${groupsAdded}`);
  console.log(`Already had access: ${alreadyHasAccess}`);
  console.log(`Errors: ${errors}`);
  
  // Final verification
  console.log('\n=== VERIFICATION ===');
  
  // Count total premium users
  const totalPremium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' }});
  
  // Count users with group access
  const usersWithGroups = await prisma.groupMember.groupBy({
    by: ['userId'],
    _count: true
  });
  
  console.log(`Total MEMBER_PREMIUM: ${totalPremium}`);
  console.log(`Users with group access: ${usersWithGroups.length}`);
  
  await prisma.$disconnect();
}

fixGroupAccess().catch(console.error);
