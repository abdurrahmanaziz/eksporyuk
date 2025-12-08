const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function smartFixMemberships() {
  try {
    console.log('=== SMART FIX: KEEP MOST RECENT TRANSACTION FOR EACH MEMBERSHIP ===\n');
    
    // Get all membership transactions
    const txs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      orderBy: { createdAt: 'desc' }, // Most recent first
      include: {
        user: { select: { name: true } }
      }
    });
    
    console.log(`Found ${txs.length} membership transactions\n`);
    
    // Group by userId to only keep one active membership per user
    const userMembershipMap = new Map();
    
    for (const tx of txs) {
      const membershipId = tx.metadata?.membershipId;
      
      if (!membershipId) {
        console.log(`⚠ ${tx.invoiceNumber}: No membershipId in metadata`);
        continue;
      }
      
      const key = `${tx.userId}-${membershipId}`;
      
      // Keep only the most recent transaction (first in desc order)
      if (!userMembershipMap.has(key)) {
        userMembershipMap.set(key, tx);
      }
    }
    
    console.log(`\nWill create ${userMembershipMap.size} UserMemberships (most recent per user)\n`);
    
    // Delete all existing UserMemberships to start fresh
    console.log('Deleting all existing UserMemberships...');
    await prisma.userMembership.deleteMany({});
    console.log('✓ Deleted\n');
    
    // Create UserMemberships for selected transactions
    for (const [key, tx] of userMembershipMap) {
      const membershipId = tx.metadata.membershipId;
      
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId }
      });
      
      if (!membership) {
        console.log(`⚠ ${tx.invoiceNumber}: Membership not found`);
        continue;
      }
      
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
      
      console.log(`${tx.invoiceNumber} → "${membership.name}" (${tx.user.name})`);
      
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
    }
    
    // Final verification
    console.log('=== VERIFICATION ===');
    const result = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      include: {
        membership: {
          include: { membership: true }
        }
      },
      orderBy: { invoiceNumber: 'asc' }
    });
    
    console.log(`\nTotal: ${result.length} transactions`);
    result.forEach(tx => {
      const status = tx.membership?.membership?.name || '❌ NULL';
      console.log(`  ${tx.invoiceNumber}: ${status}`);
    });
    
    const withMembership = result.filter(tx => tx.membership?.membership?.name);
    console.log(`\n✓ ${withMembership.length}/${result.length} transactions now have membership data`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

smartFixMemberships();
