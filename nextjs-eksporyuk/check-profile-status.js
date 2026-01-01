#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const usersWithEarnings = await prisma.wallet.findMany({
      where: { totalEarnings: { gt: 0 } },
      select: { userId: true }
    });

    const userIds = usersWithEarnings.map(w => w.userId);
    
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, isActive: true }
    });

    const profileMap = new Map(affiliateProfiles.map(p => [p.userId, p.isActive]));

    console.log('\n📊 AFFILIATE PROFILE STATUS:\n');
    console.log('Total users with earnings:', userIds.length);
    console.log('Users with affiliate profiles:', affiliateProfiles.length);
    console.log('Users WITHOUT affiliate profiles:', userIds.length - affiliateProfiles.length);

    // Find users with earnings but NO affiliate profile
    const usersWithoutProfile = userIds.filter(id => !profileMap.has(id));
    
    if (usersWithoutProfile.length > 0) {
      console.log('\n❌ USERS WITH EARNINGS BUT NO PROFILE:', usersWithoutProfile.length);
      
      const users = await prisma.user.findMany({
        where: { id: { in: usersWithoutProfile.slice(0, 10) } },
        select: { id: true, name: true, role: true }
      });

      console.log('\nExamples:');
      users.forEach((u, i) => {
        console.log(`${i+1}. ${u.name} (${u.role})`);
      });

      if (usersWithoutProfile.length > 10) {
        console.log(`\n... and ${usersWithoutProfile.length - 10} more users`);
      }
    } else {
      console.log('\n✅ All users with earnings have affiliate profiles');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
