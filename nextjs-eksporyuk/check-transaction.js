const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking transaction with external ID: 54576e399cd3699d6be335d4412f936e\n');
    
    const transaction = await prisma.transaction.findFirst({
      where: { externalId: '54576e399cd3699d6be335d4412f936e' }
    });
    
    if (transaction) {
      console.log('✅ TRANSACTION FOUND:');
      console.log('  ID:', transaction.id);
      console.log('  User ID:', transaction.userId);
      console.log('  Status:', transaction.status);
      console.log('  Type:', transaction.type);
      console.log('  Amount: Rp', transaction.amount.toString());
      console.log('  Email:', transaction.customerEmail);
      console.log('  Created:', transaction.createdAt);
      console.log('  Paid At:', transaction.paidAt);
      console.log('');
      
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId }
      });
      
      console.log('👤 User Info:');
      console.log('  Email:', user?.email);
      console.log('  Role:', user?.role);
      console.log('  Name:', user?.name);
      console.log('');
      
      // Get user memberships
      const memberships = await prisma.userMembership.findMany({
        where: { userId: transaction.userId },
        include: { membership: true },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('📋 User Memberships:');
      if (memberships.length === 0) {
        console.log('  (none) - User is MEMBER_FREE by default');
      } else {
        memberships.forEach(um => {
          console.log(`  - ${um.membership.name}`);
          console.log(`    Status: ${um.status} | Active: ${um.isActive}`);
        });
      }
      console.log('');
      
      // Check all transactions for this user
      const allTransactions = await prisma.transaction.findMany({
        where: { userId: transaction.userId },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('📊 All Transactions for this User:');
      allTransactions.forEach((t, idx) => {
        console.log(`  ${idx + 1}. Type: ${t.type} | Status: ${t.status} | Amount: Rp ${t.amount.toString()}`);
        console.log(`     Created: ${t.createdAt}`);
      });
      
    } else {
      console.log('❌ No transaction found with this external ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
