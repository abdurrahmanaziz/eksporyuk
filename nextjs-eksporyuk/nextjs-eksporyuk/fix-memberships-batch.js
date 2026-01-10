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

function calculateEndDate(startDate, duration) {
  const endDate = new Date(startDate);
  switch(duration) {
    case 'ONE_MONTH': endDate.setMonth(endDate.getMonth() + 1); break;
    case 'THREE_MONTHS': endDate.setMonth(endDate.getMonth() + 3); break;
    case 'SIX_MONTHS': endDate.setMonth(endDate.getMonth() + 6); break;
    case 'TWELVE_MONTHS': endDate.setMonth(endDate.getMonth() + 12); break;
    case 'LIFETIME': endDate.setFullYear(endDate.getFullYear() + 100); break;
    default: endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

async function main() {
  console.log('=== FIX USER MEMBERSHIPS (BATCH) ===\n');
  
  const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
  const completedOrders = sales.orders.filter(o => o.status === 'completed');
  console.log(`Total completed orders: ${completedOrders.length}`);
  
  // Get memberships and create lookup
  const memberships = await prisma.membership.findMany();
  const membershipByName = {};
  memberships.forEach(m => membershipByName[m.name] = m);
  
  // Get all users and create email lookup
  console.log('Loading users...');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true }});
  const userByEmail = new Map();
  users.forEach(u => userByEmail.set(u.email.toLowerCase(), u));
  console.log(`Loaded ${users.length} users`);
  
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
      userOrders.set(email, { email, membershipName, orderDate: order.created_at, grandTotal: order.grand_total });
    }
  });
  
  console.log(`Users with membership orders: ${userOrders.size}`);
  
  // Process
  let updated = 0, notFound = 0;
  
  for (const [email, data] of userOrders) {
    const user = userByEmail.get(email);
    if (!user) { notFound++; continue; }
    
    const membership = membershipByName[data.membershipName];
    if (!membership) continue;
    
    const startDate = new Date(data.orderDate);
    const endDate = calculateEndDate(startDate, membership.duration);
    
    try {
      await prisma.userMembership.upsert({
        where: { userId_membershipId: { userId: user.id, membershipId: membership.id }},
        create: {
          userId: user.id,
          membershipId: membership.id,
          startDate,
          endDate,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: startDate,
          price: data.grandTotal
        },
        update: {
          status: 'ACTIVE',
          isActive: true,
          startDate,
          endDate,
          activatedAt: startDate
        }
      });
      updated++;
    } catch(e) {}
    
    if (updated % 500 === 0) console.log(`Progress: ${updated}...`);
  }
  
  // Update user roles in batch
  console.log('\nUpdating user roles to MEMBER_PREMIUM...');
  const activeUserIds = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  
  const uniqueIds = [...new Set(activeUserIds.map(u => u.userId))];
  await prisma.user.updateMany({
    where: { id: { in: uniqueIds }, role: 'MEMBER_FREE' },
    data: { role: 'MEMBER_PREMIUM' }
  });
  
  // Summary
  const activeCount = await prisma.userMembership.count({ where: { status: 'ACTIVE' }});
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' }});
  
  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Active memberships: ${activeCount}`);
  console.log(`Premium users: ${premiumCount}`);
  
  console.log('\n=== BY MEMBERSHIP TYPE ===');
  for (const m of memberships) {
    const count = await prisma.userMembership.count({ where: { membershipId: m.id, status: 'ACTIVE' }});
    console.log(`${m.name}: ${count} active`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
