/**
 * Fix Group Access for Premium Members
 * 
 * This script adds premium members to their appropriate groups
 * based on their membership type.
 * 
 * Problem:
 * - 5908 MEMBER_PREMIUM users exist
 * - Only 3240 have group access
 * - 2668 are missing group access
 * 
 * Solution:
 * - For each premium member with active membership
 * - Check MembershipGroup relations
 * - Add to appropriate groups if not already member
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGroupAccess() {
  console.log('=== FIX GROUP ACCESS FOR PREMIUM MEMBERS ===\n');
  
  // 1. Get all premium users with their memberships
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, name: true, email: true }
  });
  
  console.log(`Total premium users: ${premiumUsers.length}`);
  
  // 2. Get all membership-group relations
  const membershipGroups = await prisma.membershipGroup.findMany();
  
  console.log(`\nMembership-Group relations:`);
  for (const mg of membershipGroups) {
    const m = await prisma.membership.findUnique({ where: { id: mg.membershipId }, select: { name: true }});
    const g = await prisma.group.findUnique({ where: { id: mg.groupId }, select: { name: true }});
    console.log(`  - ${m?.name} → ${g?.name}`);
  }
  
  // 3. Build a map of membershipId -> groupIds
  const membershipToGroups = {};
  for (const mg of membershipGroups) {
    if (!membershipToGroups[mg.membershipId]) {
      membershipToGroups[mg.membershipId] = [];
    }
    membershipToGroups[mg.membershipId].push(mg.groupId);
  }
  
  let fixed = 0;
  let alreadyHasAccess = 0;
  let noMembership = 0;
  let errors = 0;
  
  console.log('\n--- Processing users ---\n');
  
  for (let i = 0; i < premiumUsers.length; i++) {
    const user = premiumUsers[i];
    
    // Get user's active membership
    const userMembership = await prisma.userMembership.findFirst({
      where: { 
        userId: user.id,
        status: 'ACTIVE',
        isActive: true
      },
      select: { membershipId: true }
    });
    
    if (!userMembership) {
      // Check for any membership (even inactive)
      const anyMembership = await prisma.userMembership.findFirst({
        where: { userId: user.id },
        select: { membershipId: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!anyMembership) {
        noMembership++;
        continue;
      }
      
      // Use latest membership
      userMembership = anyMembership;
    }
    
    // Get groups for this membership
    const groupIds = membershipToGroups[userMembership.membershipId] || [];
    
    if (groupIds.length === 0) {
      // This membership has no groups linked
      continue;
    }
    
    // Check and add to each group
    for (const groupId of groupIds) {
      try {
        // Check if already member
        const existing = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: { groupId, userId: user.id }
          }
        });
        
        if (existing) {
          alreadyHasAccess++;
        } else {
          // Add to group
          await prisma.groupMember.create({
            data: {
              groupId,
              userId: user.id,
              role: 'MEMBER'
            }
          });
          fixed++;
          
          // Log every 100
          if (fixed % 100 === 0) {
            console.log(`  Fixed ${fixed} users...`);
          }
        }
      } catch (err) {
        errors++;
        console.error(`Error adding user ${user.id} to group ${groupId}:`, err.message);
      }
    }
    
    // Progress every 500
    if ((i + 1) % 500 === 0) {
      console.log(`Processed ${i + 1}/${premiumUsers.length} users...`);
    }
  }
  
  console.log('\n=== RESULT ===');
  console.log(`Fixed (added to groups): ${fixed}`);
  console.log(`Already had access: ${alreadyHasAccess}`);
  console.log(`No membership record: ${noMembership}`);
  console.log(`Errors: ${errors}`);
  
  // Verify
  const allPremium = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true }
  });
  const premiumIds = allPremium.map(u => u.id);
  
  const withGroupAccess = await prisma.groupMember.findMany({
    where: { userId: { in: premiumIds } },
    distinct: ['userId']
  });
  
  console.log('\n=== VERIFICATION ===');
  console.log(`Total MEMBER_PREMIUM: ${premiumIds.length}`);
  console.log(`With group access now: ${withGroupAccess.length}`);
  console.log(`Still without group access: ${premiumIds.length - withGroupAccess.length}`);
  
  await prisma.$disconnect();
}

fixGroupAccess().catch(console.error);
