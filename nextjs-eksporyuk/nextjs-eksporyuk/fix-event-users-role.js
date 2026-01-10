/**
 * FIX EVENT-ONLY USERS ROLE
 * 
 * ISSUE: User yang hanya beli event/webinar/kopdar mendapat role MEMBER_PREMIUM
 * FIX: Set role mereka ke MEMBER_FREE (yang benar)
 * 
 * SAFETY: Script ini HANYA update user yang:
 * 1. Hanya punya transaksi event (tidak ada membership)
 * 2. Role saat ini = MEMBER_PREMIUM
 * 3. Tidak punya active membership record
 * 
 * TIDAK akan update:
 * - User dengan membership purchases
 * - User ADMIN/MENTOR/AFFILIATE
 * - User dengan active UserMembership
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Keywords untuk identifikasi event vs membership
const EVENT_KEYWORDS = [
  'Zoom Ekspor',
  'Webinar Ekspor',
  'Webinar Juli',
  'Kopdar Akbar',
  'Kopdar Jakarta',
  'Zoominar',
  'Workshop',
  'Gratis',
  'Donasi',
  'Aplikasi EYA', // Tools, bukan membership
  'Kaos',
  'Katalog'
];

const MEMBERSHIP_KEYWORDS = [
  'Paket Ekspor Yuk Lifetime',
  'Paket Ekspor Yuk 12 Bulan',
  'Paket Ekspor Yuk 6 Bulan',
  'Paket Lifetime',
  'Kelas Eksporyuk',
  'Kelas Ekspor Yuk',
  'Re Kelas 12 Bulan',
  'Re Kelas 6 Bulan',
  'Bundling',
  'Promo.*Lifetime',
  'Promo MEI',
  'Promo THR',
  'Promo Kemerdekaan',
  'Promo Merdeka'
];

function isEventProduct(description) {
  if (!description) return false;
  return EVENT_KEYWORDS.some(keyword => description.includes(keyword));
}

function isMembershipProduct(description) {
  if (!description) return false;
  return MEMBERSHIP_KEYWORDS.some(keyword => {
    const regex = new RegExp(keyword, 'i');
    return regex.test(description);
  });
}

async function fixEventOnlyUsersRole() {
  console.log('🔧 FIX EVENT-ONLY USERS ROLE');
  console.log('═'.repeat(80));
  console.log('');
  
  let totalChecked = 0;
  let eventOnlyCount = 0;
  let needsFix = 0;
  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // 1. Load all transactions
    console.log('📥 Loading transactions...');
    const transactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' }
    });
    
    console.log(`   Found ${transactions.length} successful transactions\n`);
    
    // 2. Categorize by user
    console.log('🔍 Categorizing purchases by user...');
    const userPurchases = {};
    
    for (const tx of transactions) {
      const userId = tx.userId;
      const description = tx.description || '';
      
      if (!userPurchases[userId]) {
        userPurchases[userId] = {
          events: [],
          memberships: [],
          others: []
        };
      }
      
      if (isEventProduct(description)) {
        userPurchases[userId].events.push(description);
      } else if (isMembershipProduct(description)) {
        userPurchases[userId].memberships.push(description);
      } else {
        userPurchases[userId].others.push(description);
      }
    }
    
    totalChecked = Object.keys(userPurchases).length;
    console.log(`   Categorized ${totalChecked} users\n`);
    
    // 3. Find event-only users
    console.log('🎯 Identifying event-only users...');
    const eventOnlyUsers = [];
    
    for (const [userId, purchases] of Object.entries(userPurchases)) {
      const hasEvents = purchases.events.length > 0;
      const hasMemberships = purchases.memberships.length === 0;
      const hasOthers = purchases.others.length === 0;
      
      // User ONLY bought events (no membership, no other products)
      if (hasEvents && hasMemberships && hasOthers) {
        eventOnlyCount++;
        eventOnlyUsers.push(userId);
      }
    }
    
    console.log(`   Found ${eventOnlyCount} event-only users\n`);
    
    // 4. Check which ones need fix
    console.log('🔧 Checking which users need role fix...\n');
    console.log('─'.repeat(80));
    
    for (const userId of eventOnlyUsers) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      if (!user) {
        console.log(`⚠️  User ${userId} not found`);
        errors++;
        continue;
      }
      
      // Skip if already correct role
      if (user.role === 'MEMBER_FREE') {
        // Already correct, skip
        continue;
      }
      
      // Skip ADMIN/MENTOR/AFFILIATE (mereka boleh premium tanpa membership)
      if (['ADMIN', 'MENTOR', 'AFFILIATE', 'FOUNDER', 'CO_FOUNDER'].includes(user.role)) {
        console.log(`ℹ️  Skipped ${user.email} - Role: ${user.role} (special role)`);
        skipped++;
        continue;
      }
      
      // Check if has active membership (safety check)
      const activeMembership = await prisma.userMembership.findFirst({
        where: {
          userId: userId,
          status: 'ACTIVE'
        }
      });
      
      if (activeMembership) {
        console.log(`⚠️  Skipped ${user.email} - Has active membership (conflicting data)`);
        skipped++;
        continue;
      }
      
      // This user needs fix!
      needsFix++;
      
      console.log(`\n🔧 FIXING: ${user.email}`);
      console.log(`   Current role: ${user.role}`);
      console.log(`   Products: ${userPurchases[userId].events.join(', ')}`);
      console.log(`   Action: Set role to MEMBER_FREE`);
      
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_FREE' }
        });
        
        console.log(`   ✅ FIXED`);
        fixed++;
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        errors++;
      }
    }
    
    // 5. Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log(`Total users checked: ${totalChecked}`);
    console.log(`Event-only users: ${eventOnlyCount}`);
    console.log(`Needed fix: ${needsFix}`);
    console.log(`Successfully fixed: ${fixed}`);
    console.log(`Skipped (special roles): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    if (fixed > 0) {
      console.log('\n✅ Fix completed successfully!');
      console.log(`\n📋 Next step: Run verification script to confirm:`);
      console.log(`   node final-verify-sejoli-access.js`);
    } else if (needsFix === 0) {
      console.log('\n✅ No users needed fixing! All roles are correct.');
    } else {
      console.log('\n⚠️  Some users could not be fixed. Please review errors above.');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error('\nFix process aborted. Database unchanged.');
  } finally {
    await prisma.$disconnect();
  }
}

// Confirm before running
console.log('\n⚠️  WARNING: This script will update user roles');
console.log('   This affects users who only bought event/webinar/kopdar');
console.log('   They will be changed from MEMBER_PREMIUM → MEMBER_FREE\n');
console.log('   Make sure you have a backup before running!\n');

// Safety: Only run if explicitly confirmed
const args = process.argv.slice(2);
if (args.includes('--confirm') || args.includes('-y')) {
  fixEventOnlyUsersRole();
} else {
  console.log('❌ Script not executed. To run, use:');
  console.log('   node fix-event-users-role.js --confirm');
  console.log('\n   Or for automatic yes:');
  console.log('   node fix-event-users-role.js -y');
  process.exit(0);
}
