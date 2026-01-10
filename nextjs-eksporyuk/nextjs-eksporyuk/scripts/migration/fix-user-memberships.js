/**
 * FIX USER MEMBERSHIPS - Update dengan data order sebenarnya
 * 
 * Script ini akan:
 * 1. Untuk setiap user yang sudah punya membership Lifetime
 * 2. Cek order mereka di WordPress - apakah beli Lifetime atau durasi lain
 * 3. Update atau buat membership sesuai produk yang dibeli
 * 
 * Run: node scripts/migration/fix-user-memberships.js
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const { PRODUCT_MEMBERSHIP_MAPPING } = require('./product-membership-mapping');

const prisma = new PrismaClient();

const WP_DB_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com'
};

async function getMembershipIds() {
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, duration: true }
  });
  
  return {
    LIFETIME: memberships.find(m => m.duration === 'LIFETIME')?.id,
    TWELVE_MONTHS: memberships.find(m => m.duration === 'TWELVE_MONTHS')?.id,
    SIX_MONTHS: memberships.find(m => m.duration === 'SIX_MONTHS')?.id,
    THREE_MONTHS: memberships.find(m => m.duration === 'THREE_MONTHS')?.id,
    ONE_MONTH: memberships.find(m => m.duration === 'ONE_MONTH')?.id,
  };
}

async function fixUserMemberships() {
  console.log('=== FIX USER MEMBERSHIPS ===\n');
  
  const wpConnection = await mysql.createConnection(WP_DB_CONFIG);
  const membershipIds = await getMembershipIds();
  
  console.log('Membership IDs:', membershipIds);
  console.log('');
  
  // Get all users with their orders from WordPress
  console.log('Fetching WordPress orders...');
  const [wpOrders] = await wpConnection.execute(`
    SELECT 
      u.user_email,
      o.product_id,
      o.created_at as order_date,
      o.grand_total,
      p.post_title as product_name
    FROM wp_sejolisa_orders o
    JOIN wp_users u ON o.user_id = u.ID
    LEFT JOIN wp_posts p ON o.product_id = p.ID
    WHERE o.status = 'completed'
    ORDER BY u.user_email, o.created_at ASC
  `);
  
  console.log(`Found ${wpOrders.length} completed orders\n`);
  
  // Group orders by user email
  const ordersByUser = {};
  wpOrders.forEach(order => {
    const email = order.user_email.toLowerCase();
    if (!ordersByUser[email]) ordersByUser[email] = [];
    ordersByUser[email].push(order);
  });
  
  // Analyze each user's membership
  const userMembershipAnalysis = [];
  
  for (const [email, orders] of Object.entries(ordersByUser)) {
    let highestMembership = null;
    let latestOrderDate = null;
    let purchasePrice = 0;
    let expiryDate = null;
    let hasLifetime = false;
    let membershipOrders = [];
    
    for (const order of orders) {
      const mapping = PRODUCT_MEMBERSHIP_MAPPING[order.product_id];
      
      if (!mapping || !mapping.membershipSlug) continue;
      
      membershipOrders.push({
        product: order.product_name,
        slug: mapping.membershipSlug,
        date: order.order_date,
        price: Number(order.grand_total)
      });
      
      // Track highest membership level
      const priority = { 'lifetime': 5, '12-bulan': 4, '6-bulan': 3, '3-bulan': 2, '1-bulan': 1 };
      const currentPriority = priority[mapping.membershipSlug] || 0;
      const highestPriority = highestMembership ? priority[highestMembership] || 0 : 0;
      
      if (currentPriority >= highestPriority) {
        highestMembership = mapping.membershipSlug;
        latestOrderDate = order.order_date;
        purchasePrice = Number(order.grand_total);
        
        if (mapping.membershipSlug === 'lifetime') {
          hasLifetime = true;
          expiryDate = null;
        } else if (!hasLifetime) {
          // Calculate expiry from latest order
          const expiry = new Date(order.order_date);
          expiry.setDate(expiry.getDate() + (mapping.duration || 0));
          if (!expiryDate || expiry > new Date(expiryDate)) {
            expiryDate = expiry;
          }
        }
      }
    }
    
    if (membershipOrders.length > 0) {
      userMembershipAnalysis.push({
        email,
        highestMembership,
        hasLifetime,
        startDate: membershipOrders[0]?.date,
        expiryDate,
        purchasePrice,
        orderCount: membershipOrders.length,
        orders: membershipOrders
      });
    }
  }
  
  console.log(`Analyzed ${userMembershipAnalysis.length} users with membership orders\n`);
  
  // Show breakdown
  const breakdown = {
    'lifetime': 0,
    '12-bulan': 0,
    '6-bulan': 0,
    '3-bulan': 0,
    '1-bulan': 0
  };
  
  userMembershipAnalysis.forEach(ua => {
    if (ua.highestMembership) breakdown[ua.highestMembership]++;
  });
  
  console.log('Membership Breakdown:');
  Object.entries(breakdown).forEach(([k, v]) => console.log(`  ${k}: ${v} users`));
  
  // Now update the database
  console.log('\n=== UPDATING DATABASE ===\n');
  
  let updated = 0;
  let created = 0;
  let unchanged = 0;
  let notFound = 0;
  
  for (const analysis of userMembershipAnalysis) {
    // Find user in Next.js
    const user = await prisma.user.findFirst({
      where: { email: { equals: analysis.email, mode: 'insensitive' } },
      include: { userMemberships: { include: { membership: true } } }
    });
    
    if (!user) {
      notFound++;
      continue;
    }
    
    // Determine correct membership ID
    let correctMembershipId;
    if (analysis.hasLifetime) {
      correctMembershipId = membershipIds.LIFETIME;
    } else {
      switch (analysis.highestMembership) {
        case '12-bulan': correctMembershipId = membershipIds.TWELVE_MONTHS; break;
        case '6-bulan': correctMembershipId = membershipIds.SIX_MONTHS; break;
        case '3-bulan': correctMembershipId = membershipIds.THREE_MONTHS; break;
        case '1-bulan': correctMembershipId = membershipIds.ONE_MONTH; break;
        default: correctMembershipId = membershipIds.LIFETIME; break;
      }
    }
    
    // Check current membership
    const existingLifetime = user.userMemberships.find(um => um.membership.duration === 'LIFETIME');
    const existingCorrect = user.userMemberships.find(um => um.membershipId === correctMembershipId);
    
    // Calculate endDate - for lifetime use far future date
    const endDate = analysis.hasLifetime 
      ? new Date('2099-12-31') 
      : (analysis.expiryDate || new Date('2099-12-31'));
    const startDate = new Date(analysis.startDate);
    const status = analysis.hasLifetime || new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
    
    // If user has Lifetime but should have different membership
    if (existingLifetime && !analysis.hasLifetime && correctMembershipId !== membershipIds.LIFETIME) {
      // Delete wrong lifetime membership
      await prisma.userMembership.delete({ where: { id: existingLifetime.id } });
      
      // Create correct membership
      await prisma.userMembership.create({
        data: {
          user: { connect: { id: user.id } },
          membership: { connect: { id: correctMembershipId } },
          status,
          startDate: startDate,
          endDate: endDate,
          price: analysis.purchasePrice,
          autoRenew: false,
          isActive: status === 'ACTIVE'
        }
      });
      
      console.log(`🔄 ${user.email}: Lifetime → ${analysis.highestMembership} (expires: ${endDate.toISOString().split('T')[0]})`);
      updated++;
    } else if (existingCorrect) {
      // Update endDate if needed
      if (existingCorrect.endDate.getTime() !== endDate.getTime()) {
        await prisma.userMembership.update({
          where: { id: existingCorrect.id },
          data: { 
            endDate: endDate,
            startDate: startDate,
            price: analysis.purchasePrice,
            status,
            isActive: status === 'ACTIVE'
          }
        });
        updated++;
      } else {
        unchanged++;
      }
    } else if (!existingLifetime) {
      // Create new membership
      await prisma.userMembership.create({
        data: {
          user: { connect: { id: user.id } },
          membership: { connect: { id: correctMembershipId } },
          status,
          startDate: startDate,
          endDate: endDate,
          price: analysis.purchasePrice,
          autoRenew: false,
          isActive: status === 'ACTIVE'
        }
      });
      
      console.log(`✅ ${user.email}: Created ${analysis.highestMembership}`);
      created++;
    } else {
      unchanged++;
    }
    
    if ((updated + created) % 100 === 0 && (updated + created) > 0) {
      console.log(`Progress: ${updated} updated, ${created} created...`);
    }
  }
  
  console.log('\n=== COMPLETE ===');
  console.log(`Updated: ${updated}`);
  console.log(`Created: ${created}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`User not found: ${notFound}`);
  
  await wpConnection.end();
  await prisma.$disconnect();
}

fixUserMemberships().catch(console.error);
