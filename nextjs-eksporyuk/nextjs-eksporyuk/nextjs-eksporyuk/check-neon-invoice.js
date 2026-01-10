const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking payment/transaction with external ID: 54576e399cd3699d6be335d4412f936e\n');
    
    // Try Transaction table
    const transaction = await prisma.transaction.findUnique({
      where: { externalId: '54576e399cd3699d6be335d4412f936e' },
      include: { 
        user: { select: { id: true, email: true, name: true } },
        membership: { select: { id: true, name: true } }
      }
    });
    
    if (transaction) {
      console.log('✅ TRANSACTION FOUND:');
      console.log('  ID:', transaction.id);
      console.log('  Status:', transaction.status);
      console.log('  Amount:', transaction.amount);
      console.log('  User:', transaction.user?.email, `(ID: ${transaction.user?.id})`);
      console.log('  Membership:', transaction.membership?.name);
      console.log('  Created:', transaction.createdAt);
      console.log('');
      
      if (transaction.user) {
        // Check user memberships
        console.log('📋 User Memberships:');
        const userMemberships = await prisma.userMembership.findMany({
          where: { userId: transaction.user.id },
          include: { membership: true },
          orderBy: { createdAt: 'desc' }
        });
        
        if (userMemberships.length === 0) {
          console.log('  (none)');
        } else {
          userMemberships.forEach(um => {
            console.log(`  - ${um.membership.name}`);
            console.log(`    Status: ${um.status} | Active: ${um.isActive}`);
            console.log(`    Created: ${um.createdAt}`);
          });
        }
        console.log('');
        
        // Check invoices
        console.log('📄 Invoices for this user:');
        const invoices = await prisma.invoice.findMany({
          where: { userId: transaction.user.id },
          include: { membership: true },
          orderBy: { createdAt: 'desc' }
        });
        
        if (invoices.length === 0) {
          console.log('  (none)');
        } else {
          invoices.forEach(inv => {
            console.log(`  - ${inv.membership?.name}`);
            console.log(`    Status: ${inv.status} | Amount: Rp ${inv.amount?.toLocaleString('id-ID')}`);
            console.log(`    Created: ${inv.createdAt}`);
          });
        }
      }
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
