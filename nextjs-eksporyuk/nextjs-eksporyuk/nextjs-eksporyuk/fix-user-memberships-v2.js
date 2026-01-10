const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Sejoli Product ID → Membership name mapping
const PRODUCT_TO_MEMBERSHIP = {
  // Lifetime products
  28: 'Lifetime', 93: 'Lifetime', 179: 'Lifetime', 1529: 'Lifetime',
  3840: 'Lifetime', 4684: 'Lifetime', 6068: 'Lifetime', 6810: 'Lifetime',
  11207: 'Lifetime', 13401: 'Lifetime', 15234: 'Lifetime', 16956: 'Lifetime',
  17920: 'Lifetime', 19296: 'Lifetime', 20852: 'Lifetime',
  // 12 Months products
  8683: '12 Bulan', 13399: '12 Bulan',
  // 6 Months products
  8684: '6 Bulan', 13400: '6 Bulan'
};

function calculateEndDate(startDate, duration) {
  const endDate = new Date(startDate);
  
  switch(duration) {
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
      endDate.setMonth(endDate.getMonth() + 12);
      break;
    case 'LIFETIME':
      endDate.setFullYear(endDate.getFullYear() + 100); // 100 years = lifetime
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
}

async function main() {
  console.log('=== FIX USER MEMBERSHIPS V2 ===\n');
  
  // Load sales data
  const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
  
  // Get completed orders only
  const completedOrders = sales.orders.filter(o => o.status === 'completed');
  console.log(`Total completed orders: ${completedOrders.length}`);
  
  // Get all membership plans
  const memberships = await prisma.membership.findMany();
  const membershipByName = {};
  memberships.forEach(m => membershipByName[m.name] = m);
  
  // Track stats
  let updated = 0;
  let created = 0;
  let notFound = 0;
  
  // Group by user email (keep best membership per user)
  const userOrders = new Map();
  completedOrders.forEach(order => {
    const email = order.user_email?.toLowerCase();
    if (!email) return;
    
    const productId = order.product_id;
    const membershipName = PRODUCT_TO_MEMBERSHIP[productId];
    
    if (!membershipName) return; // Skip non-membership products
    
    const priority = { 'Lifetime': 3, '12 Bulan': 2, '6 Bulan': 1 };
    const existing = userOrders.get(email);
    
    if (!existing || priority[membershipName] > priority[existing.membershipName]) {
      userOrders.set(email, {
        email,
        name: order.user_name,
        productId,
        membershipName,
        orderDate: order.created_at,
        grandTotal: order.grand_total
      });
    }
  });
  
  console.log(`Unique users with membership orders: ${userOrders.size}`);
  
  // Process users in batches
  let processed = 0;
  
  for (const [email, orderData] of userOrders) {
    try {
      // Find user in database
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });
      
      if (!user) {
        notFound++;
        continue;
      }
      
      const membership = membershipByName[orderData.membershipName];
      if (!membership) continue;
      
      const startDate = new Date(orderData.orderDate);
      const endDate = calculateEndDate(startDate, membership.duration);
      
      // Upsert user membership
      const result = await prisma.userMembership.upsert({
        where: {
          userId_membershipId: {
            userId: user.id,
            membershipId: membership.id
          }
        },
        create: {
          userId: user.id,
          membershipId: membership.id,
          startDate,
          endDate,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: startDate,
          price: orderData.grandTotal
        },
        update: {
          status: 'ACTIVE',
          isActive: true,
          startDate,
          endDate,
          activatedAt: startDate
        }
      });
      
      if (result) {
        updated++;
      }
      
      // Update user role to MEMBER_PREMIUM if needed
      if (user.role === 'MEMBER_FREE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'MEMBER_PREMIUM' }
        });
      }
      
      processed++;
      if (processed % 500 === 0) {
        console.log(`Processed ${processed}/${userOrders.size}...`);
      }
    } catch (err) {
      // Skip errors silently
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log(`Updated/Created: ${updated}`);
  console.log(`User not found: ${notFound}`);
  
  // Show summary
  const activeCount = await prisma.userMembership.count({ where: { status: 'ACTIVE' }});
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' }});
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Active memberships: ${activeCount}`);
  console.log(`Premium users: ${premiumCount}`);
  
  // Show by membership type
  console.log('\n=== BY MEMBERSHIP TYPE ===');
  for (const m of memberships) {
    const count = await prisma.userMembership.count({
      where: { membershipId: m.id, status: 'ACTIVE' }
    });
    console.log(`${m.name}: ${count} active`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

