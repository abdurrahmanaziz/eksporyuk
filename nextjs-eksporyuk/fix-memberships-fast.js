const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const PRODUCT_TO_MEMBERSHIP = {
  28: 'Lifetime', 93: 'Lifetime', 179: 'Lifetime', 1529: 'Lifetime',
  3840: 'Lifetime', 4684: 'Lifetime', 6068: 'Lifetime', 6810: 'Lifetime',
  11207: 'Lifetime', 13401: 'Lifetime', 15234: 'Lifetime', 16956: 'Lifetime',
  17920: 'Lifetime', 19296: 'Lifetime', 20852: 'Lifetime',
  8683: '12 Bulan', 13399: '12 Bulan',
  8684: '6 Bulan', 13400: '6 Bulan'
};

async function main() {
  console.log('=== FIX USER MEMBERSHIPS (FAST) ===\n');
  
  const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
  const completedOrders = sales.orders.filter(o => o.status === 'completed');
  console.log(`Completed orders: ${completedOrders.length}`);
  
  // Get memberships
  const memberships = await prisma.membership.findMany();
  const membershipByName = {};
  memberships.forEach(m => membershipByName[m.name] = m);
  
  // Get all users
  const users = await prisma.user.findMany({ select: { id: true, email: true }});
  const userByEmail = new Map();
  users.forEach(u => userByEmail.set(u.email.toLowerCase(), u));
  console.log(`Users in DB: ${users.length}`);
  
  // Get existing user memberships
  const existingUMs = await prisma.userMembership.findMany({ select: { userId: true, membershipId: true, id: true }});
  const existingMap = new Map();
  existingUMs.forEach(um => existingMap.set(`${um.userId}:${um.membershipId}`, um.id));
  console.log(`Existing user memberships: ${existingUMs.length}`);
  
  // Group by user email
  const userOrders = new Map();
  completedOrders.forEach(order => {
    const email = order.user_email?.toLowerCase();
    if (!email) return;
    const membershipName = PRODUCT_TO_MEMBERSHIP[order.product_id];
    if (!membershipName) return;
    
    const priority = { 'Lifetime': 3, '12 Bulan': 2, '6 Bulan': 1 };
    const existing = userOrders.get(email);
    if (!existing || priority[membershipName] > priority[existing.membershipName]) {
      userOrders.set(email, { email, membershipName, orderDate: order.created_at });
    }
  });
  
  console.log(`Users with membership: ${userOrders.size}`);
  
  // Prepare batch updates
  const toUpdate = [];
  const toCreate = [];
  
  for (const [email, data] of userOrders) {
    const user = userByEmail.get(email);
    if (!user) continue;
    
    const membership = membershipByName[data.membershipName];
    if (!membership) continue;
    
    const startDate = new Date(data.orderDate);
    let endDate = new Date(startDate);
    switch(membership.duration) {
      case 'ONE_MONTH': endDate.setMonth(endDate.getMonth() + 1); break;
      case 'THREE_MONTHS': endDate.setMonth(endDate.getMonth() + 3); break;
      case 'SIX_MONTHS': endDate.setMonth(endDate.getMonth() + 6); break;
      case 'TWELVE_MONTHS': endDate.setMonth(endDate.getMonth() + 12); break;
      case 'LIFETIME': endDate.setFullYear(endDate.getFullYear() + 100); break;
    }
    
    const key = `${user.id}:${membership.id}`;
    const existingId = existingMap.get(key);
    
    if (existingId) {
      toUpdate.push({ id: existingId, startDate, endDate });
    } else {
      toCreate.push({ userId: user.id, membershipId: membership.id, startDate, endDate });
    }
  }
  
  console.log(`\nTo update: ${toUpdate.length}`);
  console.log(`To create: ${toCreate.length}`);
  
  // Batch update existing
  console.log('\nUpdating existing memberships...');
  let updateCount = 0;
  for (let i = 0; i < toUpdate.length; i += 100) {
    const batch = toUpdate.slice(i, i + 100);
    await Promise.all(batch.map(item =>
      prisma.userMembership.update({
        where: { id: item.id },
        data: { status: 'ACTIVE', isActive: true, startDate: item.startDate, endDate: item.endDate, activatedAt: item.startDate }
      })
    ));
    updateCount += batch.length;
    if (updateCount % 500 === 0) console.log(`Updated ${updateCount}...`);
  }
  
  // Batch create new
  console.log('\nCreating new memberships...');
  let createCount = 0;
  for (let i = 0; i < toCreate.length; i += 100) {
    const batch = toCreate.slice(i, i + 100);
    await prisma.userMembership.createMany({
      data: batch.map(item => ({
        userId: item.userId,
        membershipId: item.membershipId,
        startDate: item.startDate,
        endDate: item.endDate,
        status: 'ACTIVE',
        isActive: true,
        activatedAt: item.startDate
      })),
      skipDuplicates: true
    });
    createCount += batch.length;
    if (createCount % 500 === 0) console.log(`Created ${createCount}...`);
  }
  
  // Update user roles
  console.log('\nUpdating user roles...');
  await prisma.$executeRaw`
    UPDATE "User" SET role = 'MEMBER_PREMIUM' 
    WHERE id IN (SELECT DISTINCT "userId" FROM "UserMembership" WHERE status = 'ACTIVE')
    AND role = 'MEMBER_FREE'
  `;
  
  // Summary
  const activeCount = await prisma.userMembership.count({ where: { status: 'ACTIVE' }});
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' }});
  
  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updateCount}`);
  console.log(`Created: ${createCount}`);
  console.log(`Active memberships: ${activeCount}`);
  console.log(`Premium users: ${premiumCount}`);
  
  console.log('\n=== BY TYPE ===');
  for (const m of memberships) {
    const count = await prisma.userMembership.count({ where: { membershipId: m.id, status: 'ACTIVE' }});
    console.log(`${m.name}: ${count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
