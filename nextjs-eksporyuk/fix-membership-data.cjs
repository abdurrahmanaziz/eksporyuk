const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMembershipData() {
  try {
    console.log('=== CHECKING TRANSACTION METADATA ===');
    const txs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      orderBy: { createdAt: 'desc' }
    });
    
    for (const tx of txs) {
      console.log(`\nTransaction: ${tx.invoiceNumber}`);
      console.log(`Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`);
      console.log(`Metadata:`, tx.metadata);
    }
    
    // Get all memberships to see prices
    console.log('\n=== AVAILABLE MEMBERSHIPS ===');
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true
      }
    });
    
    memberships.forEach(m => {
      console.log(`- ${m.name}: Rp ${Number(m.price).toLocaleString('id-ID')} (${m.duration})`);
    });
    
    // Match transactions to memberships by metadata membershipId and create UserMembership
    console.log('\n=== CREATING USERMEMBERSHIPS ===');
    
    for (const tx of txs) {
      // Try to get membershipId from metadata
      const membershipId = tx.metadata?.membershipId;
      
      if (!membershipId) {
        console.log(`⚠ ${tx.invoiceNumber}: No membershipId in metadata`);
        continue;
      }
      
      const membership = memberships.find(m => m.id === membershipId);
      
      if (!membership) {
        console.log(`⚠ ${tx.invoiceNumber}: Membership ${membershipId} not found`);
        continue;
      }
      
      console.log(`\n${tx.invoiceNumber}: Creating UserMembership for ${membership.name}`);
      
      // Calculate end date based on duration
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
        // Check if UserMembership already exists
        const existing = await prisma.userMembership.findUnique({
          where: { transactionId: tx.id }
        });
        
        if (existing) {
          console.log(`  ℹ Already exists, skipping`);
          continue;
        }
        
        // Create UserMembership
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
        
        console.log(`  ✓ Created: ${userMembership.id}`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }
    
    console.log('\n=== VERIFICATION ===');
    const finalCheck = await prisma.transaction.findFirst({
      where: { type: 'MEMBERSHIP' },
      include: {
        membership: {
          include: {
            membership: true
          }
        }
      }
    });
    
    console.log('Sample transaction membership:', finalCheck.membership?.membership?.name || 'NULL');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMembershipData();
