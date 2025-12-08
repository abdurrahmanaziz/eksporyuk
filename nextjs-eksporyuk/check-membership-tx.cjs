const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixMembershipTransactions() {
  try {
    console.log('=== CHECKING TRANSACTIONS ===');
    const txs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      include: {
        membership: {
          include: {
            membership: true
          }
        }
      }
    });
    
    console.log(`Found ${txs.length} membership transactions`);
    txs.forEach(tx => {
      console.log(`- ${tx.invoiceNumber || tx.id}: membership = ${tx.membership ? tx.membership.membership.name : 'NULL'}`);
    });
    
    console.log('\n=== CHECKING USER MEMBERSHIPS ===');
    const userMemberships = await prisma.userMembership.findMany({
      include: {
        membership: true,
        user: true
      }
    });
    
    console.log(`Found ${userMemberships.length} user memberships`);
    userMemberships.forEach(um => {
      console.log(`- User: ${um.user.name}, Membership: ${um.membership.name}, TransactionId: ${um.transactionId || 'NULL'}`);
    });
    
    // Find orphaned transactions and user memberships
    console.log('\n=== FIXING ORPHANED DATA ===');
    const orphanedTxs = txs.filter(tx => !tx.membership);
    
    for (const tx of orphanedTxs) {
      // Find matching UserMembership by userId and amount
      const matchingUM = userMemberships.find(um => 
        um.userId === tx.userId && 
        !um.transactionId &&
        um.price && 
        Number(um.price) === Number(tx.amount)
      );
      
      if (matchingUM) {
        console.log(`Linking transaction ${tx.invoiceNumber} to UserMembership ${matchingUM.membership.name}`);
        await prisma.userMembership.update({
          where: { id: matchingUM.id },
          data: { transactionId: tx.id }
        });
        console.log(`✓ Fixed!`);
      } else {
        console.log(`⚠ No matching UserMembership found for transaction ${tx.invoiceNumber}`);
      }
    }
    
    console.log('\n=== DONE ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixMembershipTransactions();
