/**
 * SYNC MEMBERSHIP STATUS WITH USER ROLE
 * 
 * Fix: User yang role-nya FREE tapi punya active membership
 * Action: Set membership status ke CANCELLED
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncMembershipStatus() {
  console.log('🔄 SYNC MEMBERSHIP STATUS WITH USER ROLE\n');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // 1. Find active memberships
    const activeMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`Total active memberships: ${activeMemberships.length}\n`);
    console.log('Checking user roles...\n');
    
    let shouldCancel = 0;
    let shouldKeep = 0;
    let cancelled = 0;
    
    for (const membership of activeMemberships) {
      const user = await prisma.user.findUnique({
        where: { id: membership.userId },
        select: { email: true, role: true }
      });
      
      if (!user) {
        console.log(`⚠️  User not found for membership ${membership.id}`);
        continue;
      }
      
      // If user is FREE but has active membership → Cancel it
      if (user.role === 'MEMBER_FREE') {
        shouldCancel++;
        
        await prisma.userMembership.update({
          where: { id: membership.id },
          data: { status: 'CANCELLED' }
        });
        
        cancelled++;
        
        if (cancelled <= 10) {
          console.log(`✅ Cancelled membership for ${user.email} (role: FREE)`);
        }
      } else if (['MEMBER_PREMIUM', 'ADMIN', 'MENTOR', 'AFFILIATE'].includes(user.role)) {
        shouldKeep++;
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 SUMMARY:\n');
    console.log(`Total active memberships checked: ${activeMemberships.length}`);
    console.log(`├─ Should keep (user is PREMIUM/ADMIN/etc): ${shouldKeep}`);
    console.log(`└─ Cancelled (user is FREE): ${cancelled}`);
    
    if (cancelled > 0) {
      console.log(`\n✅ Successfully cancelled ${cancelled} orphaned memberships`);
    }
    
    // Verify final state
    console.log('\n' + '═'.repeat(80));
    console.log('\n🔍 FINAL VERIFICATION:\n');
    
    const finalActive = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
    const finalPremium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
    
    console.log(`Active memberships: ${finalActive}`);
    console.log(`MEMBER_PREMIUM users: ${finalPremium}`);
    console.log(`Difference: ${Math.abs(finalActive - finalPremium)}`);
    
    if (Math.abs(finalActive - finalPremium) < 100) {
      console.log(`\n✅ Role-Membership alignment is now good!`);
    } else {
      console.log(`\n⚠️  Still ${Math.abs(finalActive - finalPremium)} difference`);
      console.log(`   This might be ADMIN/MENTOR users with memberships`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirm before running
const args = process.argv.slice(2);
if (args.includes('--confirm') || args.includes('-y')) {
  syncMembershipStatus();
} else {
  console.log('\n⚠️  This script will cancel memberships for MEMBER_FREE users');
  console.log('   To run, use: node sync-membership-status.js --confirm\n');
  process.exit(0);
}
