const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMembershipLogic() {
  console.log('🔧 FIXING MEMBERSHIP LOGIC - PRIORITIZE HIGHEST LEVEL');
  console.log('='.repeat(60));
  
  try {
    // Get membership hierarchy (by access level)
    const membershipHierarchy = {
      'Paket Ekspor Yuk - Lifetime': { level: 3, groups: 2, courses: 2 },
      'Paket Ekspor Yuk - 12 Bulan': { level: 2, groups: 1, courses: 1 },
      'Paket Ekspor Yuk - 6 Bulan': { level: 1, groups: 1, courses: 1 }
    };
    
    // Get all users with multiple active memberships
    const usersWithMultipleMemberships = await prisma.user.findMany({
      where: {
        userMemberships: {
          some: {
            isActive: true,
            membership: { isActive: true }
          }
        }
      },
      include: {
        userMemberships: {
          where: {
            isActive: true,
            membership: { isActive: true }
          },
          include: {
            membership: true
          }
        }
      }
    });
    
    console.log(`\n📊 ANALYZING ${usersWithMultipleMemberships.length} USERS:`);
    
    let usersWithMultiple = 0;
    let totalDeactivated = 0;
    
    for (const user of usersWithMultipleMemberships) {
      if (user.userMemberships.length > 1) {
        usersWithMultiple++;
        
        console.log(`\n👤 ${user.name} (${user.email})`);
        console.log(`   Current Memberships: ${user.userMemberships.length}`);
        
        // Find highest level membership
        let highestMembership = null;
        let highestLevel = 0;
        
        user.userMemberships.forEach(um => {
          const membershipName = um.membership.name;
          const level = membershipHierarchy[membershipName]?.level || 0;
          
          console.log(`   - ${membershipName} (Level ${level})`);
          
          if (level > highestLevel) {
            highestLevel = level;
            highestMembership = um;
          }
        });
        
        if (highestMembership) {
          console.log(`   🎯 Keeping: ${highestMembership.membership.name}`);
          
          // Deactivate all other memberships
          const membershipesToDeactivate = user.userMemberships.filter(
            um => um.id !== highestMembership.id
          );
          
          for (const membershipToDeactivate of membershipesToDeactivate) {
            await prisma.userMembership.update({
              where: { id: membershipToDeactivate.id },
              data: { isActive: false }
            });
            
            totalDeactivated++;
            console.log(`   ❌ Deactivated: ${membershipToDeactivate.membership.name}`);
          }
        }
        
        // Show progress every 50 users
        if (usersWithMultiple % 50 === 0) {
          console.log(`\n📊 Progress: ${usersWithMultiple} multi-membership users processed`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MEMBERSHIP LOGIC FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total users checked: ${usersWithMultipleMemberships.length}`);
    console.log(`🔄 Users with multiple memberships: ${usersWithMultiple}`);
    console.log(`❌ Memberships deactivated: ${totalDeactivated}`);
    console.log(`📋 Users with single membership: ${usersWithMultipleMemberships.length - usersWithMultiple}`);
    
    console.log('\n🎉 MEMBERSHIP LOGIC FIXED!');
    console.log('📝 Now each user has only their HIGHEST level membership active.');
    console.log('📝 Re-run verification to confirm all access issues are resolved.');
    
  } catch (error) {
    console.error('❌ Membership logic fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMembershipLogic();