const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking payment with external ID: 54576e399cd3699d6be335d4412f936e\n');
    
    const payment = await prisma.payment.findUnique({
      where: { externalId: '54576e399cd3699d6be335d4412f936e' },
      include: { user: true, membership: true }
    });
    
    if (payment) {
      console.log('💳 Payment Found:');
      console.log('  Status:', payment.status);
      console.log('  Amount:', payment.amount);
      console.log('  User Email:', payment.user?.email);
      console.log('  User ID:', payment.user?.id);
      console.log('  Membership:', payment.membership?.name);
      console.log('');
      
      if (payment.user) {
        const userMemberships = await prisma.userMembership.findMany({
          where: { userId: payment.user.id },
          include: { membership: true }
        });
        
        console.log('📋 User Memberships:');
        userMemberships.forEach(um => {
          console.log('  -', um.membership.name, '| Status:', um.status, '| Active:', um.isActive);
        });
        console.log('');
        
        const invoices = await prisma.invoice.findMany({
          where: { userId: payment.user.id },
          include: { membership: true }
        });
        
        console.log('📄 Invoices:');
        if (invoices.length === 0) {
          console.log('  (no invoices found)');
        } else {
          invoices.forEach(inv => {
            console.log('  -', inv.membership?.name, '| Status:', inv.status, '| Amount:', inv.amount);
          });
        }
      }
    } else {
      console.log('❌ Payment not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
