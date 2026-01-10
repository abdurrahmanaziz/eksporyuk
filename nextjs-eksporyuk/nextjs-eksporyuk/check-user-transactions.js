const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserTransactions() {
  console.log('🔍 CHECKING USER TRANSACTIONS IN ADMIN/SALES');
  console.log('='.repeat(60));
  
  try {
    // Target users to check
    const targetUsers = [
      'TRI ARDA PREBAWA',
      'Dedy Kristiawan', 
      'Yohanes Ndona'
    ];
    
    console.log('📊 CHECKING TRANSACTIONS FOR SPECIFIED USERS:');
    console.log(targetUsers.join(', '));
    console.log('');
    
    for (const userName of targetUsers) {
      console.log(`\n👤 CHECKING: ${userName}`);
      console.log('-'.repeat(40));
      
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          name: {
            contains: userName,
            mode: 'insensitive'
          }
        },
        include: {
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
          },
          userMemberships: {
            where: {
              isActive: true
            },
            include: {
              membership: true
            }
          }
        }
      });
      
      if (!user) {
        console.log(`❌ User not found: ${userName}`);
        continue;
      }
      
      console.log(`✅ Found: ${user.name} (${user.email})`);
      
      // Show successful transactions
      console.log(`\n📈 SUCCESSFUL TRANSACTIONS (${user.transactions.length}):`);
      if (user.transactions.length === 0) {
        console.log('   No successful transactions found');
      } else {
        user.transactions.forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.membership?.name || 'N/A'}`);
          console.log(`      Amount: Rp ${transaction.amount?.toLocaleString() || 'N/A'}`);
          console.log(`      Date: ${transaction.createdAt?.toLocaleDateString() || 'N/A'}`);
          console.log(`      Status: ${transaction.status}`);
          console.log('');
        });
      }
      
      // Show current active memberships
      console.log(`\n🎯 CURRENT ACTIVE MEMBERSHIPS (${user.userMemberships.length}):`);
      if (user.userMemberships.length === 0) {
        console.log('   No active memberships found');
      } else {
        user.userMemberships.forEach((userMembership, index) => {
          console.log(`   ${index + 1}. ${userMembership.membership?.name || 'N/A'}`);
          console.log(`      Active: ${userMembership.isActive}`);
          console.log(`      Start: ${userMembership.startDate?.toLocaleDateString() || 'N/A'}`);
          console.log(`      End: ${userMembership.endDate?.toLocaleDateString() || 'N/A'}`);
          console.log('');
        });
      }
      
      // Recommendation based on latest transaction
      const latestTransaction = user.transactions[0];
      if (latestTransaction && latestTransaction.membership) {
        console.log(`💡 RECOMMENDATION: Keep "${latestTransaction.membership.name}" (Latest purchase)`);
      } else {
        console.log(`⚠️  No transaction data found - manual review needed`);
      }
      
      console.log('='.repeat(40));
    }
    
    console.log('\n🎯 NEXT STEP: Based on transaction data above, we can now safely fix memberships');
    console.log('💡 The script will keep only the membership matching the latest successful transaction');
    
  } catch (error) {
    console.error('❌ Error checking transactions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTransactions();