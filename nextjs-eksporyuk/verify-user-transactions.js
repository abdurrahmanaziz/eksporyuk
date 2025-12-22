const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyUserTransactions() {
  console.log('🔍 VERIFYING USER TRANSACTIONS VIA ADMIN/SALES DATA');
  console.log('='.repeat(70));
  
  try {
    // Get users with multiple active memberships
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
        // Get transaction history to verify purchases
        transactions: {
          where: {
            status: 'SUCCESS'
          },
          include: {
            membership: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    console.log(`\n📊 CHECKING ${usersWithMultipleMemberships.length} USERS FOR TRANSACTION HISTORY`);
    
    let usersWithMultiple = 0;
    let suspiciousUsers = [];
    
    for (const user of usersWithMultipleMemberships) {
      if (user.userMemberships.length > 1) {
        usersWithMultiple++;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`👤 USER: ${user.name} (${user.email})`);
        console.log(`📅 Registered: ${user.createdAt.toLocaleDateString()}`);
        
        // Show current active memberships
        console.log(`\n📦 CURRENT ACTIVE MEMBERSHIPS (${user.userMemberships.length}):`);
        user.userMemberships.forEach(um => {
          console.log(`   ✅ ${um.membership.name}`);
          console.log(`      - Activated: ${um.createdAt.toLocaleDateString()}`);
          console.log(`      - Status: ${um.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        });
        
        // Show transaction history
        console.log(`\n💳 TRANSACTION HISTORY (SUCCESS only):`);
        if (user.transactions.length === 0) {
          console.log(`   ⚠️  NO SUCCESS TRANSACTIONS FOUND!`);
          suspiciousUsers.push({
            user: user,
            issue: 'NO_TRANSACTIONS',
            memberships: user.userMemberships.length
          });
        } else {
          user.transactions.forEach((transaction, index) => {
            console.log(`   ${index + 1}. ${transaction.membership?.name || 'N/A'}`);
            console.log(`      - Amount: Rp ${transaction.amount.toLocaleString()}`);
            console.log(`      - Date: ${transaction.createdAt.toLocaleDateString()}`);
            console.log(`      - ID: ${transaction.id}`);
          });
          
          // Compare transactions vs memberships
          const transactionMemberships = user.transactions
            .filter(t => t.membership)
            .map(t => t.membership.name);
          const activeMemberships = user.userMemberships.map(um => um.membership.name);
          
          // Check for mismatches
          const extraMemberships = activeMemberships.filter(
            m => !transactionMemberships.includes(m)
          );
          
          if (extraMemberships.length > 0) {
            console.log(`   ⚠️  SUSPICIOUS: Active memberships without transactions:`);
            extraMemberships.forEach(m => console.log(`      - ${m}`));
            
            suspiciousUsers.push({
              user: user,
              issue: 'EXTRA_MEMBERSHIPS',
              extraMemberships: extraMemberships,
              transactions: user.transactions.length
            });
          }
        }
        
        // Show latest/most relevant transaction
        if (user.transactions.length > 0) {
          const latestTransaction = user.transactions[0];
          console.log(`\n🎯 LATEST TRANSACTION:`);
          console.log(`   📦 ${latestTransaction.membership?.name || 'N/A'}`);
          console.log(`   💰 Rp ${latestTransaction.amount.toLocaleString()}`);
          console.log(`   📅 ${latestTransaction.createdAt.toLocaleDateString()}`);
        }
        
        // Show progress every 20 users
        if (usersWithMultiple % 20 === 0) {
          console.log(`\n📊 Progress: ${usersWithMultiple}/${usersWithMultipleMemberships.length} multi-membership users checked`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Total users checked: ${usersWithMultipleMemberships.length}`);
    console.log(`🔄 Users with multiple memberships: ${usersWithMultiple}`);
    console.log(`⚠️  Suspicious cases found: ${suspiciousUsers.length}`);
    
    if (suspiciousUsers.length > 0) {
      console.log(`\n🚨 SUSPICIOUS USERS THAT NEED MANUAL REVIEW:`);
      suspiciousUsers.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.user.name} (${item.user.email})`);
        console.log(`   Issue: ${item.issue}`);
        if (item.issue === 'EXTRA_MEMBERSHIPS') {
          console.log(`   Extra: ${item.extraMemberships.join(', ')}`);
          console.log(`   Transactions: ${item.transactions}`);
        } else if (item.issue === 'NO_TRANSACTIONS') {
          console.log(`   Active memberships: ${item.memberships}`);
        }
      });
      
      console.log(`\n⚠️  RECOMMENDATION:`);
      console.log(`   - Manual review required for ${suspiciousUsers.length} users`);
      console.log(`   - Verify admin/sales data before proceeding with fixes`);
      console.log(`   - Check for data import errors or manual membership assignments`);
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Review suspicious cases manually');
    console.log('2. Verify admin/sales records match transaction history');
    console.log('3. Create targeted fix script based on verified data');
    
  } catch (error) {
    console.error('❌ Transaction verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserTransactions();