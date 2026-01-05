const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembershipTransactions() {
  try {
    console.log('🔍 CHECKING ADMIN/SALES MEMBERSHIP TRANSACTIONS...\n');
    
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${transactions.length} SUCCESS membership transactions`);
    
    let perfectAccess = 0;
    let issues = 0;
    
    for (const tx of transactions) {
      // Check user access
      const [membership, groups, courses] = await Promise.all([
        prisma.userMembership.findFirst({
          where: { userId: tx.userId, status: 'ACTIVE' }
        }),
        prisma.groupMember.count({
          where: { userId: tx.userId }
        }),
        prisma.courseEnrollment.count({
          where: { userId: tx.userId }
        })
      ]);
      
      const hasFullAccess = membership && groups > 0 && courses > 0;
      
      if (hasFullAccess) {
        perfectAccess++;
        console.log(`✅ ${tx.customerName}: Membership + ${groups} Groups + ${courses} Courses`);
      } else {
        issues++;
        console.log(`❌ ${tx.customerName}: Missing - ${!membership ? 'Membership' : ''} ${groups === 0 ? 'Groups' : ''} ${courses === 0 ? 'Courses' : ''}`);
      }
    }
    
    console.log('\n📊 ADMIN/SALES MEMBERSHIP TRANSACTIONS SUMMARY:');
    console.log(`✅ Perfect Access: ${perfectAccess}/${transactions.length}`);
    console.log(`❌ Has Issues: ${issues}/${transactions.length}`);
    console.log(`📈 Success Rate: ${Math.round(perfectAccess / transactions.length * 100)}%`);
    
    if (perfectAccess === transactions.length) {
      console.log('\n🎉 ALL MEMBERSHIP TRANSACTIONS HAVE PERFECT ACCESS!');
    } else {
      console.log(`\n⚠️  ${issues} membership transactions need attention`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembershipTransactions();