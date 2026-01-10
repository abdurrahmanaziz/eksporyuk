/**
 * MIGRASI USER MEMBERSHIP DARI WORDPRESS SEJOLI
 * 
 * Script ini akan:
 * 1. Membaca semua orders dari WordPress
 * 2. Mapping product_id ke membership di Next.js
 * 3. Membuat UserMembership dengan tanggal expire yang benar
 * 4. Auto-assign courses dan groups sesuai membership
 * 
 * Run: node scripts/migration/migrate-user-memberships.js
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const { PRODUCT_MEMBERSHIP_MAPPING, isMembershipProduct } = require('./product-membership-mapping');

const prisma = new PrismaClient();

// Configuration
const WP_DB_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com'
};

async function getMembershipIdBySlug() {
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, slug: true, duration: true }
  });
  
  const slugMap = {};
  memberships.forEach(m => {
    // Map by duration
    if (m.duration === 'LIFETIME') slugMap['lifetime'] = m.id;
    if (m.duration === 'TWELVE_MONTHS') slugMap['12-bulan'] = m.id;
    if (m.duration === 'SIX_MONTHS') slugMap['6-bulan'] = m.id;
    if (m.duration === 'THREE_MONTHS') slugMap['3-bulan'] = m.id;
    if (m.duration === 'ONE_MONTH') slugMap['1-bulan'] = m.id;
  });
  
  console.log('Membership Slug Map:', slugMap);
  return slugMap;
}

function calculateExpiryDate(orderDate, durationDays) {
  if (durationDays === null) return null; // Lifetime
  
  const expiry = new Date(orderDate);
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry;
}

async function migrateUserMemberships() {
  console.log('=== MIGRASI USER MEMBERSHIP DARI WORDPRESS ===\n');
  
  const wpConnection = await mysql.createConnection(WP_DB_CONFIG);
  
  // Get membership slug map
  const membershipSlugMap = await getMembershipIdBySlug();
  
  // Get all completed orders with user mapping
  console.log('Fetching WordPress orders...');
  const [wpOrders] = await wpConnection.execute(`
    SELECT 
      o.ID as order_id,
      o.product_id,
      o.user_id as wp_user_id,
      o.created_at as order_date,
      o.grand_total,
      u.user_email
    FROM wp_sejolisa_orders o
    JOIN wp_users u ON o.user_id = u.ID
    WHERE o.status = 'completed'
    ORDER BY o.created_at ASC
  `);
  
  console.log(`Found ${wpOrders.length} completed orders\n`);
  
  // Stats
  const stats = {
    processed: 0,
    membershipCreated: 0,
    userNotFound: 0,
    skippedNonMembership: 0,
    skippedDuplicate: 0,
    errors: []
  };
  
  // Group orders by user email
  const ordersByUser = {};
  wpOrders.forEach(order => {
    const email = order.user_email.toLowerCase();
    if (!ordersByUser[email]) ordersByUser[email] = [];
    ordersByUser[email].push(order);
  });
  
  console.log(`Processing ${Object.keys(ordersByUser).length} unique users...\n`);
  
  // Process each user
  for (const [email, orders] of Object.entries(ordersByUser)) {
    // Find user in Next.js
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { userMemberships: true }
    });
    
    if (!user) {
      stats.userNotFound++;
      continue;
    }
    
    // Process each order for this user
    for (const order of orders) {
      stats.processed++;
      
      const mapping = PRODUCT_MEMBERSHIP_MAPPING[order.product_id];
      
      // Skip non-membership products
      if (!mapping || !mapping.membershipSlug) {
        stats.skippedNonMembership++;
        continue;
      }
      
      const membershipId = membershipSlugMap[mapping.membershipSlug];
      if (!membershipId) {
        stats.errors.push(`Membership not found for slug: ${mapping.membershipSlug}`);
        continue;
      }
      
      // Check if user already has this membership
      const existingMembership = user.userMemberships.find(um => um.membershipId === membershipId);
      
      // Calculate expiry date
      const expiresAt = calculateExpiryDate(order.order_date, mapping.duration);
      
      if (existingMembership) {
        // User already has this membership - check if we need to extend
        if (mapping.type === 'renewal' || (existingMembership.expiresAt && expiresAt)) {
          // Extend expiry date
          const currentExpiry = existingMembership.expiresAt ? new Date(existingMembership.expiresAt) : null;
          const newExpiry = expiresAt;
          
          if (newExpiry && (!currentExpiry || newExpiry > currentExpiry)) {
            await prisma.userMembership.update({
              where: { id: existingMembership.id },
              data: { expiresAt: newExpiry }
            });
            console.log(`  📅 Extended ${user.email} ${mapping.membershipSlug} to ${newExpiry.toISOString().split('T')[0]}`);
          }
        }
        stats.skippedDuplicate++;
        continue;
      }
      
      // Create new UserMembership
      try {
        await prisma.userMembership.create({
          data: {
            userId: user.id,
            membershipId: membershipId,
            status: expiresAt && new Date() > expiresAt ? 'EXPIRED' : 'ACTIVE',
            startedAt: new Date(order.order_date),
            expiresAt: expiresAt,
            purchasePrice: Number(order.grand_total),
            isAutoRenew: false
          }
        });
        
        stats.membershipCreated++;
        
        if (stats.membershipCreated % 100 === 0) {
          console.log(`Created ${stats.membershipCreated} memberships...`);
        }
      } catch (err) {
        stats.errors.push(`Error creating membership for ${email}: ${err.message}`);
      }
    }
  }
  
  // Final stats
  console.log('\n=== MIGRATION COMPLETE ===\n');
  console.log(`Orders processed: ${stats.processed}`);
  console.log(`Memberships created: ${stats.membershipCreated}`);
  console.log(`Users not found: ${stats.userNotFound}`);
  console.log(`Skipped (non-membership): ${stats.skippedNonMembership}`);
  console.log(`Skipped (duplicate): ${stats.skippedDuplicate}`);
  
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    if (stats.errors.length > 10) console.log(`  ... and ${stats.errors.length - 10} more`);
  }
  
  await wpConnection.end();
  await prisma.$disconnect();
}

// Preview mode - just show what would happen
async function previewMigration() {
  console.log('=== PREVIEW MODE - NO CHANGES WILL BE MADE ===\n');
  
  const wpConnection = await mysql.createConnection(WP_DB_CONFIG);
  const membershipSlugMap = await getMembershipIdBySlug();
  
  // Get order counts by product
  const [orderCounts] = await wpConnection.execute(`
    SELECT 
      o.product_id,
      p.post_title as product_name,
      COUNT(*) as order_count,
      COUNT(DISTINCT o.user_id) as unique_users
    FROM wp_sejolisa_orders o
    LEFT JOIN wp_posts p ON o.product_id = p.ID
    WHERE o.status = 'completed'
    GROUP BY o.product_id
    ORDER BY order_count DESC
  `);
  
  console.log('Product | Orders | Users | → Membership | Action');
  console.log('─'.repeat(100));
  
  let totalMemberships = 0;
  let totalSkipped = 0;
  
  orderCounts.forEach(oc => {
    const mapping = PRODUCT_MEMBERSHIP_MAPPING[oc.product_id];
    const productName = (oc.product_name || 'Unknown').substring(0, 40).padEnd(40);
    
    if (mapping && mapping.membershipSlug) {
      const membershipId = membershipSlugMap[mapping.membershipSlug];
      console.log(`${productName} | ${String(oc.order_count).padStart(6)} | ${String(oc.unique_users).padStart(5)} | ${mapping.membershipSlug.padEnd(12)} | ✅ CREATE`);
      totalMemberships += oc.unique_users;
    } else if (mapping) {
      console.log(`${productName} | ${String(oc.order_count).padStart(6)} | ${String(oc.unique_users).padStart(5)} | -            | ⏭️  SKIP (${mapping.type})`);
      totalSkipped += oc.order_count;
    } else {
      console.log(`${productName} | ${String(oc.order_count).padStart(6)} | ${String(oc.unique_users).padStart(5)} | -            | ❓ NO MAPPING`);
      totalSkipped += oc.order_count;
    }
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Will create ~${totalMemberships} user memberships`);
  console.log(`Will skip ${totalSkipped} orders (non-membership products)`);
  
  await wpConnection.end();
  await prisma.$disconnect();
}

// Main
const args = process.argv.slice(2);
if (args.includes('--preview')) {
  previewMigration().catch(console.error);
} else {
  migrateUserMemberships().catch(console.error);
}
