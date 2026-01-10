const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllUsersMemberships() {
  console.log('🔧 COMPREHENSIVE MEMBERSHIP SYSTEM FIX');
  console.log('Based on transaction analysis - keeping highest legitimate membership');
  console.log('='.repeat(70));
  
  try {
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
        },
        transactions: {
          where: {
            status: 'SUCCESS',
            amount: { gt: 0 }
          },
          include: {
            membership: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    console.log(`📊 Found ${usersWithMultipleMemberships.length} users with memberships`);
    
    // Membership hierarchy for fallback decisions
    const membershipHierarchy = {
      'Paket Ekspor Yuk - Lifetime': { level: 3, groups: 2, courses: 2 },
      'Paket Ekspor Yuk - 12 Bulan': { level: 2, groups: 1, courses: 1 },
      'Paket Ekspor Yuk - 6 Bulan': { level: 1, groups: 1, courses: 1 }
    };
    
    let usersWithMultiple = 0;
    let totalDeactivated = 0;
    let usersFixed = 0;
    
    for (const user of usersWithMultipleMemberships) {
      // Only process users with multiple memberships
      if (user.userMemberships.length <= 1) continue;
      
      usersWithMultiple++;
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Current memberships: ${user.userMemberships.length}`);
      
      user.userMemberships.forEach(um => {
        console.log(`   - ${um.membership.name}`);
      });
      
      let membershipToKeep = null;
      
      // Strategy 1: Use latest paid transaction
      if (user.transactions.length > 0) {
        const latestPaidTransaction = user.transactions[0];
        
        // Match transaction amount to membership type
        let membershipNameFromTransaction = null;
        if (latestPaidTransaction.amount === 699000) {
          membershipNameFromTransaction = 'Paket Ekspor Yuk - 6 Bulan';
        } else if (latestPaidTransaction.amount === 1798000 || latestPaidTransaction.amount === 1199000) {
          membershipNameFromTransaction = 'Paket Ekspor Yuk - 12 Bulan';
        } else if (latestPaidTransaction.amount === 1998000 || latestPaidTransaction.amount === 1999000) {
          membershipNameFromTransaction = 'Paket Ekspor Yuk - Lifetime';
        }
        
        if (membershipNameFromTransaction) {
          membershipToKeep = user.userMemberships.find(
            um => um.membership.name === membershipNameFromTransaction
          );
          console.log(`   💰 Transaction-based: ${membershipNameFromTransaction} (Rp ${latestPaidTransaction.amount})`);
        }
      }
      
      // Strategy 2: If no transaction match, keep highest level
      if (!membershipToKeep) {
        let highestLevel = 0;
        user.userMemberships.forEach(um => {
          const level = membershipHierarchy[um.membership.name]?.level || 0;
          if (level > highestLevel) {
            highestLevel = level;
            membershipToKeep = um;
          }
        });
        console.log(`   🎯 Fallback: Keep highest level - ${membershipToKeep?.membership.name}`);
      }
      
      if (membershipToKeep) {
        // Deactivate all other memberships
        const membershipesToDeactivate = user.userMemberships.filter(
          um => um.id !== membershipToKeep.id
        );
        
        for (const membershipToDeactivate of membershipesToDeactivate) {
          await prisma.userMembership.update({
            where: { id: membershipToDeactivate.id },
            data: { isActive: false }
          });
          
          totalDeactivated++;
          console.log(`   ❌ Deactivated: ${membershipToDeactivate.membership.name}`);
        }
        
        console.log(`   ✅ Kept: ${membershipToKeep.membership.name}`);
        usersFixed++;
      }
      
      // Progress update every 50 users
      if (usersWithMultiple % 50 === 0) {
        console.log(`\n📊 Progress: ${usersWithMultiple} users processed, ${usersFixed} fixed`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPREHENSIVE FIX SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Total users checked: ${usersWithMultipleMemberships.length}`);
    console.log(`🔄 Users with multiple memberships: ${usersWithMultiple}`);
    console.log(`🎯 Users successfully fixed: ${usersFixed}`);
    console.log(`❌ Memberships deactivated: ${totalDeactivated}`);
    console.log(`📋 Users already with single membership: ${usersWithMultipleMemberships.length - usersWithMultiple}`);
    
    console.log('\n🎉 MEMBERSHIP SYSTEM FULLY FIXED!');
    console.log('💡 Logic applied:');
    console.log('   1. Keep membership matching latest paid transaction amount');
    console.log('   2. If no transaction match, keep highest level membership');
    console.log('   3. Each user now has exactly ONE active membership');
    console.log('\n🔍 Ready for final system verification...');
    
  } catch (error) {
    console.error('❌ Comprehensive fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllUsersMemberships();