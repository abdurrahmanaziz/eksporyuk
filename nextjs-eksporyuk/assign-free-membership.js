const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Assign FREE membership to users who only purchased events/webinars/zoom
 * These users participated in events but don't have a paid membership
 */

// Get or create FREE membership
async function getFreeMembership() {
  let freeMembership = await prisma.membership.findFirst({
    where: { duration: 'FREE' }
  });
  
  if (!freeMembership) {
    // Create FREE membership if not exists
    freeMembership = await prisma.membership.create({
      data: {
        name: 'Member Free',
        slug: 'member-free',
        description: 'Akses gratis untuk peserta event/webinar',
        price: 0,
        duration: 'FREE',
        features: ['Akses materi gratis', 'Komunitas Ekspor Yuk'],
        isActive: true,
      }
    });
    console.log('Created FREE membership:', freeMembership.id);
  }
  
  return freeMembership;
}

async function assignFreeMemberships() {
  console.log('=== Assigning FREE Membership to Event Participants ===\n');
  
  // Get FREE membership
  const freeMembership = await getFreeMembership();
  console.log('FREE Membership ID:', freeMembership.id);
  
  // Get all SUCCESS transactions
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS', type: 'MEMBERSHIP' },
    select: { userId: true, metadata: true, createdAt: true }
  });
  
  // Find users who only bought events (not actual memberships)
  const eventProducts = [];
  const eventUserTxs = new Map(); // userId -> earliest createdAt
  
  for (const tx of transactions) {
    const pn = (tx.metadata?.productName || tx.metadata?.product_name || '').toLowerCase();
    
    // Check if it's an event product
    const isEvent = pn.includes('zoom') || 
                    pn.includes('webinar') || 
                    pn.includes('kopdar') || 
                    pn.includes('workshop') ||
                    pn.includes('offline');
    
    if (isEvent) {
      const name = tx.metadata?.productName || tx.metadata?.product_name;
      if (!eventProducts.includes(name)) {
        eventProducts.push(name);
      }
      
      // Track earliest transaction date for this user
      const existing = eventUserTxs.get(tx.userId);
      if (!existing || tx.createdAt < existing) {
        eventUserTxs.set(tx.userId, tx.createdAt);
      }
    }
  }
  
  console.log('\nEvent products found:');
  for (const p of eventProducts) {
    console.log('  -', p);
  }
  
  const eventUserIds = Array.from(eventUserTxs.keys());
  console.log('\nTotal unique event participants:', eventUserIds.length);
  
  // Find users who already have ANY membership
  const usersWithMembership = await prisma.userMembership.findMany({
    where: { userId: { in: eventUserIds } },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const usersWithMembershipSet = new Set(usersWithMembership.map(u => u.userId));
  
  // Filter to users who need FREE membership
  const usersNeedingFree = eventUserIds.filter(id => !usersWithMembershipSet.has(id));
  
  console.log('Users who already have membership:', usersWithMembershipSet.size);
  console.log('Users who need FREE membership:', usersNeedingFree.length);
  
  if (usersNeedingFree.length === 0) {
    console.log('\nNo users need FREE membership assignment.');
    await prisma.$disconnect();
    return;
  }
  
  // Assign FREE membership to users
  let assigned = 0;
  let errors = 0;
  
  for (const userId of usersNeedingFree) {
    try {
      const startDate = eventUserTxs.get(userId) || new Date();
      
      await prisma.userMembership.create({
        data: {
          userId: userId,
          membershipId: freeMembership.id,
          status: 'ACTIVE',
          isActive: true,
          startDate: startDate,
          endDate: new Date('2099-12-31'), // Indefinite for free
        }
      });
      assigned++;
      
      if (assigned % 100 === 0) {
        console.log(`Assigned ${assigned}...`);
      }
    } catch (err) {
      if (err.code === 'P2002') {
        // Unique constraint - already has membership
        continue;
      }
      console.error(`Error assigning to ${userId}:`, err.message);
      errors++;
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Assigned FREE membership:', assigned);
  console.log('Errors:', errors);
  
  // Verification
  const totalFree = await prisma.userMembership.count({
    where: { membershipId: freeMembership.id }
  });
  console.log('\nTotal FREE members now:', totalFree);
  
  await prisma.$disconnect();
}

assignFreeMemberships().catch(console.error);
