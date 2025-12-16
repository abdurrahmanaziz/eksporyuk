const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateCUID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return 'c' + timestamp + randomPart;
}

async function createMemberships() {
  console.log('Creating memberships for SUCCESS transactions...');
  
  // Get memberships
  const memberships = await prisma.membership.findMany();
  const membershipById = {};
  for (const m of memberships) {
    membershipById[m.id] = m;
  }
  
  // Get default membership (cheapest)
  const defaultMembership = memberships.sort((a, b) => Number(a.price) - Number(b.price))[0];
  console.log('Default membership:', defaultMembership.name);
  
  // Get SUCCESS transactions without membership
  const successTx = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      type: 'MEMBERSHIP'
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      createdAt: true
    }
  });
  
  console.log('Found', successTx.length, 'SUCCESS transactions');
  
  // Create memberships - one per user (use latest transaction)
  const userLatestTx = {};
  for (const tx of successTx) {
    const existing = userLatestTx[tx.userId];
    if (!existing || new Date(tx.createdAt) > new Date(existing.createdAt)) {
      userLatestTx[tx.userId] = tx;
    }
  }
  
  const uniqueTx = Object.values(userLatestTx);
  console.log('Unique users with SUCCESS transactions:', uniqueTx.length);
  
  // Create memberships
  const membershipData = [];
  for (const tx of uniqueTx) {
    const amount = Number(tx.amount);
    
    // Find matching membership by price (with tolerance)
    let membership = memberships.find(m => Math.abs(Number(m.price) - amount) < 1000);
    if (!membership) membership = defaultMembership;
    
    const durationMonths = {
      'ONE_MONTH': 1,
      'THREE_MONTHS': 3,
      'SIX_MONTHS': 6,
      'TWELVE_MONTHS': 12,
      'LIFETIME': 1200
    };
    
    const months = durationMonths[membership.duration] || 12;
    const startDate = new Date(tx.createdAt);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    
    membershipData.push({
      id: generateCUID(),
      userId: tx.userId,
      membershipId: membership.id,
      transactionId: tx.id,
      startDate: startDate,
      endDate: endDate,
      createdAt: startDate,
      updatedAt: new Date()
    });
  }
  
  // Insert in batches
  let created = 0;
  for (let i = 0; i < membershipData.length; i += 500) {
    const batch = membershipData.slice(i, i + 500);
    try {
      const result = await prisma.userMembership.createMany({ data: batch, skipDuplicates: true });
      created += result.count;
    } catch (err) {
      console.log('Batch error, trying one by one...');
      for (const item of batch) {
        try {
          await prisma.userMembership.create({ data: item });
          created++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    console.log('Batch', Math.floor(i/500) + 1, '/', Math.ceil(membershipData.length/500), 'done');
  }
  
  const total = await prisma.userMembership.count();
  console.log('✓ Total memberships created:', total);
  
  await prisma.$disconnect();
}

createMemberships();
