const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 DATABASE STATUS CHECK');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    const userCount = await prisma.user.count();
    const transactionCount = await prisma.transaction.count();
    const membershipCount = await prisma.membership.count();
    const userMembershipCount = await prisma.userMembership.count();
    
    console.log(`👥 Total Users: ${userCount.toLocaleString()}`);
    console.log(`💰 Total Transactions: ${transactionCount.toLocaleString()}`);
    console.log(`🎫 Total Memberships: ${membershipCount.toLocaleString()}`);
    console.log(`📋 Total User Memberships: ${userMembershipCount.toLocaleString()}`);
    
    if (userCount > 0) {
      console.log('\n👤 Sample users:');
      const sampleUsers = await prisma.user.findMany({ take: 5, select: { email: true, name: true, role: true } });
      sampleUsers.forEach(user => console.log(`  - ${user.email} (${user.name}) - ${user.role}`));
    }
    
    if (transactionCount > 0) {
      console.log('\n💰 Transaction status breakdown:');
      const transactionStats = await prisma.transaction.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true }
      });
      
      transactionStats.forEach(stat => {
        console.log(`  ${stat.status}: ${stat._count.id.toLocaleString()} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();