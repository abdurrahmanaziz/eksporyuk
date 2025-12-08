const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSeparateUserMemberships() {
  try {
    console.log('=== CREATING SEPARATE USERMEMBERSHIPS FOR EACH TRANSACTION ===\n');
    
    const txs = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        membership: null
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${txs.length} transactions without UserMembership\n`);
    
    for (const tx of txs) {
      const membershipId = tx.metadata?.membershipId;
      
      if (!membershipId) {
        console.log(`⚠ ${tx.invoiceNumber}: No membershipId in metadata, skipping\n`);
        continue;
      }
      
      // Get membership details
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId }
      });
      
      if (!membership) {
        console.log(`⚠ ${tx.invoiceNumber}: Membership ${membershipId} not found\n`);
        continue;
      }
      
      console.log(`${tx.invoiceNumber}: Creating UserMembership for "${membership.name}"`);
      
      // Calculate end date
      const startDate = tx.createdAt;
      let endDate = new Date(startDate);
      
      switch(membership.duration) {
        case 'ONE_MONTH':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'THREE_MONTHS':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'SIX_MONTHS':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'TWELVE_MONTHS':
        case 'ONE_YEAR':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        case 'LIFETIME':
          endDate.setFullYear(endDate.getFullYear() + 100);
          break;
      }
      
      try {
        // First, delete existing UserMembership with same userId + membershipId if exists
        const existing = await prisma.userMembership.findFirst({
          where: {
            userId: tx.userId,
            membershipId: membership.id
          }
        });
        
        if (existing) {
          console.log(`  Deleting existing UserMembership ${existing.id}...`);
          await prisma.userMembership.delete({
            where: { id: existing.id }
          });
        }
        
        // Create new UserMembership
        const userMembership = await prisma.userMembership.create({
          data: {
            userId: tx.userId,
            membershipId: membership.id,
            transactionId: tx.id,
            startDate: startDate,
            endDate: endDate,
            price: tx.amount,
            status: tx.status === 'SUCCESS' ? 'ACTIVE' : 'PENDING',
            isActive: tx.status === 'SUCCESS',
            activatedAt: tx.status === 'SUCCESS' ? tx.paidAt : null,
          }
        });
        
        console.log(`  ✓ Created: ${userMembership.id}\n`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
      }
    }
    
    // Final verification
    console.log('=== FINAL VERIFICATION ===');
    const allTxs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      include: {
        membership: {
          include: { membership: true }
        }
      },
      orderBy: { invoiceNumber: 'asc' }
    });
    
    console.log(`\nTotal: ${allTxs.length} transactions`);
    allTxs.forEach(tx => {
      const status = tx.membership?.membership?.name || '❌ NULL';
      console.log(`  ${tx.invoiceNumber}: ${status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSeparateUserMemberships();
