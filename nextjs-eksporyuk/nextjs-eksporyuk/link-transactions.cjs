const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkTransactionsToMemberships() {
  try {
    console.log('=== LINKING TRANSACTIONS TO USERMEMBERSHIPS ===\n');
    
    // Get all membership transactions without linked UserMembership
    const txs = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        membership: null
      },
      include: {
        user: { select: { name: true } }
      }
    });
    
    console.log(`Found ${txs.length} unlinked transactions\n`);
    
    for (const tx of txs) {
      const membershipId = tx.metadata?.membershipId;
      
      if (!membershipId) {
        console.log(`⚠ ${tx.invoiceNumber}: No membershipId in metadata`);
        continue;
      }
      
      // Find existing UserMembership for this user and membership
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: tx.userId,
          membershipId: membershipId
        },
        include: {
          membership: { select: { name: true } }
        }
      });
      
      if (!userMembership) {
        console.log(`⚠ ${tx.invoiceNumber}: No UserMembership found for user ${tx.userId} and membership ${membershipId}`);
        continue;
      }
      
      // Check if UserMembership already has a transaction
      if (userMembership.transactionId && userMembership.transactionId !== tx.id) {
        console.log(`  ${tx.invoiceNumber} → ${userMembership.membership.name} (already has ${userMembership.transactionId}, skipping)`);
        continue;
      }
      
      // Link transaction to UserMembership
      console.log(`  ${tx.invoiceNumber} → ${userMembership.membership.name}`);
      
      await prisma.userMembership.update({
        where: { id: userMembership.id },
        data: { transactionId: tx.id }
      });
      
      console.log(`    ✓ Linked to UserMembership ${userMembership.id}`);
    }
    
    // Verification
    console.log('\n=== VERIFICATION ===');
    const linkedTxs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      include: {
        membership: {
          include: { membership: true }
        }
      }
    });
    
    console.log(`\nTotal membership transactions: ${linkedTxs.length}`);
    linkedTxs.forEach(tx => {
      console.log(`- ${tx.invoiceNumber}: ${tx.membership?.membership?.name || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkTransactionsToMemberships();
