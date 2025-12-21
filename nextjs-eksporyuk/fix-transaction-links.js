const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix transactions that don't have product/membership link
 * by checking metadata and linking to the correct membership
 */
async function fixTransactionLinks() {
  console.log('=== Fixing Transaction Product/Membership Links ===\n');
  
  // Find transactions with MEMBERSHIP type but no membership link
  const unlinked = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      type: 'MEMBERSHIP',
      membership: null
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      metadata: true,
    },
    take: 100,
  });
  
  console.log(`Found ${unlinked.length} MEMBERSHIP transactions without membership link`);
  
  // Get all memberships for mapping
  const memberships = await prisma.membership.findMany();
  console.log(`Available memberships: ${memberships.length}`);
  
  // Create price-to-membership map (as fallback)
  const priceMap = new Map();
  memberships.forEach(m => {
    if (!priceMap.has(m.price)) {
      priceMap.set(m.price, m);
    }
  });
  
  let fixed = 0;
  let created = 0;
  
  for (const tx of unlinked) {
    const metadata = tx.metadata || {};
    let membershipId = metadata.membershipId;
    
    // If no membershipId in metadata, try to find by price
    if (!membershipId) {
      const matchingMembership = priceMap.get(tx.amount);
      if (matchingMembership) {
        membershipId = matchingMembership.id;
      }
    }
    
    if (membershipId) {
      // Check if membership exists
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId }
      });
      
      if (membership) {
        // Create or find UserMembership for this transaction
        const existingUM = await prisma.userMembership.findFirst({
          where: { transactionId: tx.id }
        });
        
        if (!existingUM) {
          // Need to get user from transaction
          const fullTx = await prisma.transaction.findUnique({
            where: { id: tx.id },
            select: { userId: true }
          });
          
          if (fullTx?.userId) {
            // Create UserMembership
            await prisma.userMembership.create({
              data: {
                userId: fullTx.userId,
                membershipId: membership.id,
                transactionId: tx.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              }
            });
            created++;
          }
        }
        
        // Update metadata to include membershipId
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            metadata: {
              ...metadata,
              membershipId: membershipId
            }
          }
        });
        fixed++;
      }
    }
  }
  
  console.log(`Fixed ${fixed} transactions metadata`);
  console.log(`Created ${created} UserMembership records`);
  
  // Verify fix
  console.log('\n=== Verification ===');
  const stillUnlinked = await prisma.transaction.count({
    where: {
      status: 'SUCCESS',
      type: 'MEMBERSHIP',
      membership: null
    }
  });
  console.log(`Remaining unlinked MEMBERSHIP transactions: ${stillUnlinked}`);
  
  await prisma.$disconnect();
}

fixTransactionLinks().catch(console.error);
