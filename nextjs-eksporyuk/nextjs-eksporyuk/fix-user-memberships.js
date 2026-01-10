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

async function main() {
  console.log('=== FIX USER MEMBERSHIPS ===\n');
  
  // Load sales data
  const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
  
  // Get completed orders only
  const completedOrders = sales.orders.filter(o => o.status === 'completed');
  console.log(`Total completed orders: ${completedOrders.length}`);
  
  // Get all membership plans
  const memberships = await prisma.membership.findMany();
  const membershipByName = {};
  memberships.forEach(m => membershipByName[m.name] = m);
  
  console.log('Memberships:', Object.keys(membershipByName));
  
  // Track stats
  let updated = 0;
  let created = 0;
  let notFound = 0;
  let noMembership = 0;
  
  // Group by user email (latest order per user)
  const userOrders = new Map();
  completedOrders.forEach(order => {
    const email = order.user_email?.toLowerCase();
    if (!email) return;
    
    const productId = order.product_id;
    const membershipName = PRODUCT_TO_MEMBERSHIP[productId];
    
    if (!membershipName) return; // Skip non-membership products
    
    // Keep the best membership (priority: Lifetime > 12 > 6)
    const priority = { 'Lifetime': 3, '12 Bulan': 2, '6 Bulan': 1 };
    const existing = userOrders.get(email);
    
    if (!existing || priority[membershipName] > priority[existing.membershipName]) {
      userOrders.set(email, {
        email,
        name: order.user_name,
        productId,
        membershipName,
        orderDate: order.created_at
      });
    }
  });
  
  console.log(`\nUnique users with membership orders: ${userOrders.size}`);
  
  // Process users
  for (const [email, orderData] of userOrders) {
    // Find user in database
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { userMemberships: true }
    });
    
    if (!user) {
      notFound++;
      continue;
    }
    
    const membership = membershipByName[orderData.membershipName];
    if (!membership) {
      noMembership++;
      continue;
    }
    
    // Calculate expiry date based on duration
    let expiresAt = null;
    const startDate = new Date(orderData.orderDate);
    
    if (membership.duration === 'ONE_MONTH') {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (membership.duration === 'THREE_MONTHS') {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    } else if (membership.duration === 'SIX_MONTHS') {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (membership.duration === 'TWELVE_MONTHS') {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + 12);
    }
    // LIFETIME = no expiry (null)
    
    // Check if user already has this membership
    const existingMembership = user.userMemberships.find(
      um => um.membershipId === membership.id
    );
    
    if (existingMembership) {
      // Update existing
      await prisma.userMembership.update({
        where: { id: existingMembership.id },
        data: {
          status: 'ACTIVE',
          startedAt: startDate,
          expiresAt
        }
      });
      updated++;
    } else {
      // Create new
      await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId: membership.id,
          status: 'ACTIVE',
          startedAt: startDate,
          expiresAt
        }
      });
      created++;
    }
    
    // Update user role if not already premium
    if (user.role === 'MEMBER_FREE') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_PREMIUM' }
      });
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log(`Updated: ${updated}`);
  console.log(`Created: ${created}`);
  console.log(`User not found: ${notFound}`);
  console.log(`No membership mapping: ${noMembership}`);
  
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

