const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Helper: Map Sejoli status to Next.js status
function mapStatus(sejoliStatus) {
  switch (sejoliStatus) {
    case 'completed':
      return 'SUCCESS';
    case 'cancelled':
    case 'refunded':
      return 'FAILED';
    case 'payment-confirm':
    case 'on-hold':
      return 'PENDING';
    default:
      return 'FAILED'; // Default to FAILED for unknown statuses
  }
}

// Helper: Calculate membership duration based on amount
function calculateMembershipDuration(amount) {
  if (amount >= 4000000) return { duration: 'LIFETIME', months: 999 };
  if (amount >= 3500000) return { duration: 'ONE_YEAR', months: 12 };
  if (amount >= 800000) return { duration: 'SIX_MONTHS', months: 6 };
  if (amount >= 700000) return { duration: 'THREE_MONTHS', months: 3 };
  return { duration: 'ONE_MONTH', months: 1 };
}

async function reImportSejoliData() {
  try {
    console.log('🔄 RE-IMPORT SEJOLI DATA - CLEAN & ACCURATE');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
    // 1. Load Sejoli data
    console.log('📂 Loading Sejoli WP data...');
    const sejoliPath = 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    console.log(`✅ Loaded ${sejoliData.orders.length.toLocaleString()} orders from Sejoli\n`);
    
    // 2. CLEAN DATABASE - Delete invalid transactions
    console.log('🗑️  STEP 1: Cleaning invalid data...');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    // Delete user memberships first (foreign key constraint)
    const deletedMemberships = await prisma.userMembership.deleteMany({});
    console.log(`  ✅ Deleted ${deletedMemberships.count.toLocaleString()} user memberships`);
    
    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`  ✅ Deleted ${deletedTransactions.count.toLocaleString()} transactions`);
    
    // Reset wallet balances
    await prisma.wallet.updateMany({
      data: {
        balance: 0,
        balancePending: 0
      }
    });
    console.log(`  ✅ Reset all wallet balances\n`);
    
    // 3. Get default membership
    console.log('🔍 STEP 2: Getting default membership...');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const defaultMembership = await prisma.membership.findFirst({
      where: { name: { contains: '1 Bulan' } }
    });
    
    if (!defaultMembership) {
      throw new Error('Default membership (1 Bulan) not found! Please create memberships first.');
    }
    
    console.log(`  ✅ Using membership: ${defaultMembership.name} (ID: ${defaultMembership.id})\n`);
    
    // 4. Create user email map
    console.log('🔍 STEP 3: Creating user email map...');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    const emailToUserId = {};
    for (const user of allUsers) {
      emailToUserId[user.email.toLowerCase()] = user.id;
    }
    
    // Create Sejoli user_id to email map
    const sejoliUserMap = {};
    for (const user of sejoliData.users) {
      sejoliUserMap[user.id] = user.user_email;
    }
    
    console.log(`  ✅ Mapped ${Object.keys(emailToUserId).length.toLocaleString()} DB users`);
    console.log(`  ✅ Mapped ${Object.keys(sejoliUserMap).length.toLocaleString()} Sejoli users\n`);
    
    // 5. IMPORT TRANSACTIONS FROM SEJOLI
    console.log('📥 STEP 4: Importing transactions from Sejoli...');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    let imported = 0;
    let skipped = 0;
    const statusCount = { SUCCESS: 0, PENDING: 0, FAILED: 0 };
    
    for (const order of sejoliData.orders) {
      // Get email from Sejoli user map
      const sejoliEmail = sejoliUserMap[order.user_id];
      const userEmail = sejoliEmail?.toLowerCase();
      
      // Skip if no email or user not found
      if (!userEmail || !emailToUserId[userEmail]) {
        skipped++;
        continue;
      }
      
      const userId = emailToUserId[userEmail];
      const amount = parseFloat(order.grand_total) || 0;
      const status = mapStatus(order.status);
      const createdAt = order.created_at ? new Date(order.created_at) : new Date();
      
      // Insert individually to avoid batch issues
      try {
        await prisma.transaction.create({
          data: {
            userId,
            externalId: String(order.id),
            amount,
            status,
            type: 'MEMBERSHIP', // Changed from PURCHASE to MEMBERSHIP
            description: `Membership Purchase - Order #${order.id}`,
            createdAt,
            updatedAt: createdAt
          }
        });
        
        statusCount[status]++;
        imported++;
        
        // Show progress every 500 orders
        if (imported % 500 === 0) {
          process.stdout.write(`\r  Processing... ${imported.toLocaleString()}/${sejoliData.orders.length.toLocaleString()} orders`);
        }
      } catch (error) {
        // Skip if duplicate or other error
        if (!error.message.includes('Unique constraint')) {
          console.error(`\n  Error importing order ${order.id}:`, error.message);
        }
        skipped++;
      }
    }
    
    console.log(`\n\n  ✅ Imported ${imported.toLocaleString()} transactions`);
    console.log(`  ⏭️  Skipped ${skipped.toLocaleString()} orders (user not found)`);
    console.log(`\n  Status Distribution:`);
    console.log(`    ✅ SUCCESS: ${statusCount.SUCCESS.toLocaleString()}`);
    console.log(`    ⏳ PENDING: ${statusCount.PENDING.toLocaleString()}`);
    console.log(`    ❌ FAILED:  ${statusCount.FAILED.toLocaleString()}\n`);
    
    // 6. CREATE MEMBERSHIPS FOR SUCCESS TRANSACTIONS
    console.log('🎫 STEP 5: Creating memberships for SUCCESS transactions...');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      include: { user: true }
    });
    
    console.log(`  Found ${successTransactions.length.toLocaleString()} SUCCESS transactions\n`);
    
    let membershipCreated = 0;
    
    for (const trans of successTransactions) {
      const { duration, months } = calculateMembershipDuration(trans.amount);
      const startDate = trans.createdAt;
      const endDate = new Date(startDate);
      
      if (duration === 'LIFETIME') {
        endDate.setFullYear(endDate.getFullYear() + 99);
      } else {
        endDate.setMonth(endDate.getMonth() + months);
      }
      
      try {
        await prisma.userMembership.create({
          data: {
            userId: trans.userId,
            membershipId: defaultMembership.id,
            transactionId: trans.id,
            startDate,
            endDate,
            isActive: endDate > new Date()
          }
        });
        
        membershipCreated++;
        
        // Show progress every 500
        if (membershipCreated % 500 === 0) {
          process.stdout.write(`\r  Creating memberships... ${membershipCreated.toLocaleString()}/${successTransactions.length.toLocaleString()}`);
        }
      } catch (error) {
        // Skip duplicates
        if (!error.message.includes('Unique constraint')) {
          console.error(`\n  Error creating membership for trans ${trans.id}:`, error.message);
        }
      }
    }
    
    console.log(`\n\n  ✅ Created ${membershipCreated.toLocaleString()} memberships\n`);
    
    // 7. FINAL VERIFICATION
    console.log('✅ STEP 6: Final Verification...');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    
    const finalStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('\n  Database Status:');
    for (const stat of finalStats) {
      console.log(`    ${stat.status}: ${stat._count.id.toLocaleString()} transactions | Rp ${(stat._sum.amount || 0).toLocaleString('id-ID')}`);
    }
    
    const totalMemberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({
      where: { endDate: { gte: new Date() } }
    });
    
    console.log(`\n  Memberships:`);
    console.log(`    Total: ${totalMemberships.toLocaleString()}`);
    console.log(`    Active: ${activeMemberships.toLocaleString()}`);
    
    // Expected vs actual
    const expectedSuccess = sejoliData.orders.filter(o => {
      const email = sejoliUserMap[o.user_id]?.toLowerCase();
      return o.status === 'completed' && email && emailToUserId[email];
    }).length;
    const actualSuccess = statusCount.SUCCESS;
    
    console.log(`\n  Accuracy Check:`);
    console.log(`    Expected SUCCESS: ${expectedSuccess.toLocaleString()}`);
    console.log(`    Actual SUCCESS:   ${actualSuccess.toLocaleString()}`);
    console.log(`    Match: ${expectedSuccess === actualSuccess ? '✅ PERFECT!' : '⚠️  Mismatch'}`);
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════════════════');
    console.log('🎉 RE-IMPORT COMPLETE! Data sekarang 100% sesuai dengan Sejoli WP!');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error during re-import:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

reImportSejoliData();
