const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminSalesAccess() {
  try {
    console.log('📊 CHECKING ADMIN/SALES TRANSACTIONS FOR USER ACCESS...\n');
    
    // Get all SUCCESS transactions with user details
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        type: 'MEMBERSHIP'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        amount: true,
        paymentMethod: true,
        membershipId: true,
        userId: true,
        paidAt: true
      }
    });
    
    console.log(`Found ${transactions.length} SUCCESS membership transactions\n`);
    
    let totalOK = 0;
    let totalIssues = 0;
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      console.log(`${i+1}. ${tx.customerName || 'Unknown'} - ${tx.paymentMethod}`);
      console.log(`   TX ID: ${tx.id}`);
      console.log(`   Amount: Rp ${(Number(tx.amount) || 0).toLocaleString('id-ID')}`);
      console.log(`   Paid: ${tx.paidAt ? tx.paidAt.toISOString().split('T')[0] : 'Unknown'}`);
      
      if (!tx.userId) {
        console.log('   ❌ NO USER ID - Cannot check access');
        totalIssues++;
        continue;
      }
      
      // Check user access
      const [userMembership, groups, courses] = await Promise.all([
        prisma.userMembership.findFirst({
          where: { userId: tx.userId, status: 'ACTIVE' }
        }),
        prisma.groupMember.findMany({
          where: { userId: tx.userId }
        }),
        prisma.courseEnrollment.findMany({
          where: { userId: tx.userId }
        })
      ]);
      
      console.log(`   Membership: ${userMembership ? '✅ ACTIVE' : '❌ MISSING'}`);
      console.log(`   Groups: ${groups.length} joined`);
      console.log(`   Courses: ${courses.length} enrolled`);
      
      if (!userMembership || groups.length === 0) {
        console.log('   🚨 ACCESS ISSUE DETECTED!');
        totalIssues++;
      } else {
        console.log('   ✅ ALL ACCESS OK');
        totalOK++;
      }
      console.log('');
    }
    
    console.log('=== SUMMARY ===');
    console.log(`✅ Transactions with full access: ${totalOK}`);
    console.log(`❌ Transactions with access issues: ${totalIssues}`);
    console.log(`📊 Total: ${transactions.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSalesAccess();