const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentTransactions() {
  console.log('🔍 Mencari transaksi terbaru hari ini...\n');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find recent transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: today }
    },
    include: {
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`📋 Transaksi hari ini: ${transactions.length}\n`);
  
  for (const tx of transactions) {
    console.log('=== TRANSAKSI ===');
    console.log('Invoice:', tx.invoiceNumber);
    console.log('User:', tx.user?.name || 'Unknown');
    console.log('Email:', tx.user?.email || 'Unknown');
    console.log('Status:', tx.status);
    console.log('Payment Status:', tx.paymentStatus);
    console.log('Amount:', tx.amount.toString());
    console.log('Type:', tx.type);
    console.log('Created:', tx.createdAt);
    
    // Cek membership jika ada
    if (tx.type === 'MEMBERSHIP' && tx.user) {
      const userMemberships = await prisma.userMembership.findMany({
        where: { 
          userId: tx.user.id,
          transactionId: tx.id
        },
        include: {
          membership: {
            include: {
              membershipGroups: true,
              membershipCourses: true
            }
          }
        }
      });
      
      for (const um of userMemberships) {
        console.log('\n--- Membership Info ---');
        console.log('Membership:', um.membership.name);
        console.log('Membership Status:', um.status);
        console.log('Membership Active:', um.isActive);
        
        console.log('Groups yang seharusnya auto-join:', um.membership.membershipGroups.length);
        for (const mg of um.membership.membershipGroups) {
          const group = await prisma.group.findUnique({ where: { id: mg.groupId } });
          console.log(`  - ${group?.name}`);
        }
        
        console.log('Courses yang seharusnya auto-enroll:', um.membership.membershipCourses.length);
        for (const mc of um.membership.membershipCourses) {
          const course = await prisma.course.findUnique({ where: { id: mc.courseId } });
          console.log(`  - ${course?.title}`);
        }
        
        // Check if user actually joined groups
        const userGroups = await prisma.groupMember.findMany({
          where: { userId: tx.user.id }
        });
        
        // Check if user actually enrolled in courses
        const userCourses = await prisma.courseEnrollment.findMany({
          where: { userId: tx.user.id }
        });
        
        console.log(`\nActual groups joined: ${userGroups.length}`);
        console.log(`Actual courses enrolled: ${userCourses.length}`);
        
        if (userGroups.length === 0 && um.membership.membershipGroups.length > 0) {
          console.log('🚨 PROBLEM: User should be auto-joined to groups but is not!');
        }
        
        if (userCourses.length === 0 && um.membership.membershipCourses.length > 0) {
          console.log('🚨 PROBLEM: User should be auto-enrolled to courses but is not!');
        }
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  await prisma.$disconnect();
}

checkRecentTransactions().catch(console.error);