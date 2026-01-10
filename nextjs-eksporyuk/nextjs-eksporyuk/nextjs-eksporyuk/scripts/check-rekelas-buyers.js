/**
 * Check Re Kelas buyers and determine highest membership tier
 */

require('dotenv').config({ path: '.env.sejoli' });
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.SEJOLI_DB_PORT || '3307', 10),
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME
  });

  // Re Kelas products - priority determines which one to assign
  const reKelasProducts = [
    { id: 8914, name: 'Re Kelas 6 Bulan', priority: 1, membershipId: 'mem_6bulan_ekspor' },
    { id: 8915, name: 'Re Kelas 12 Bulan', priority: 2, membershipId: 'mem_12bulan_ekspor' },
    { id: 8910, name: 'Re Kelas Lifetime', priority: 3, membershipId: 'mem_lifetime_ekspor' }
  ];

  console.log('\n📊 Re Kelas Orders Analysis');
  console.log('='.repeat(60));

  // Collect all buyers with their highest priority
  const buyerMap = new Map(); // email -> { name, highestPriority, productName, membershipId }

  for (const product of reKelasProducts) {
    const [orders] = await conn.execute(`
      SELECT DISTINCT u.user_email, u.display_name
      FROM wp_posts te
      INNER JOIN wp_users u ON te.post_author = u.ID
      INNER JOIN wp_postmeta pm ON te.ID = pm.post_id 
      WHERE te.post_type = 'tutor_enrolled'
        AND pm.meta_key = '_tutor_enrolled_by_product_id'
        AND pm.meta_value = ?
        AND te.post_status IN ('completed', 'processing', 'pending')
    `, [String(product.id)]);

    console.log(`\n📦 ${product.name} (ID: ${product.id}): ${orders.length} buyers`);

    for (const order of orders) {
      const email = order.user_email.toLowerCase();
      const existing = buyerMap.get(email);
      
      if (!existing || product.priority > existing.highestPriority) {
        buyerMap.set(email, {
          name: order.display_name,
          highestPriority: product.priority,
          productName: product.name,
          membershipId: product.membershipId
        });
      }
    }
  }

  // Summary by highest membership
  const summary = { 1: 0, 2: 0, 3: 0 };
  for (const [email, data] of buyerMap) {
    summary[data.highestPriority]++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY - Highest Membership per User:');
  console.log('='.repeat(60));
  console.log(`Total unique Re Kelas buyers: ${buyerMap.size}`);
  console.log(`  → Will get 6 Bulan only: ${summary[1]}`);
  console.log(`  → Will get 12 Bulan: ${summary[2]}`);
  console.log(`  → Will get Lifetime: ${summary[3]}`);

  // Check which users already exist in new DB
  const allEmails = Array.from(buyerMap.keys());
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: allEmails, mode: 'insensitive' } },
    select: { id: true, email: true }
  });

  const existingEmailMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u.id]));

  console.log(`\n📊 Import Status:`);
  console.log(`  → Users in new DB: ${existingUsers.length}`);
  console.log(`  → Users NOT in new DB: ${buyerMap.size - existingUsers.length}`);

  // Check existing memberships for these users
  const userIds = existingUsers.map(u => u.id);
  const existingMemberships = await prisma.userMembership.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, membershipId: true }
  });

  // Build map of existing memberships
  const userMembershipMap = new Map();
  for (const um of existingMemberships) {
    if (!userMembershipMap.has(um.userId)) {
      userMembershipMap.set(um.userId, new Set());
    }
    userMembershipMap.get(um.userId).add(um.membershipId);
  }

  // Count how many need assignment
  let needLifetime = 0;
  let need12Bulan = 0;
  let need6Bulan = 0;
  let alreadyHaveHigher = 0;
  let notInDb = 0;

  const toAssign = [];

  for (const [email, data] of buyerMap) {
    const userId = existingEmailMap.get(email);
    
    if (!userId) {
      notInDb++;
      continue;
    }

    const existingMems = userMembershipMap.get(userId) || new Set();
    
    // Check if user already has the target membership or higher
    const hasLifetime = existingMems.has('mem_lifetime_ekspor');
    const has12Bulan = existingMems.has('mem_12bulan_ekspor');
    const has6Bulan = existingMems.has('mem_6bulan_ekspor');

    // Determine what to assign based on highest purchase
    if (data.highestPriority === 3) { // Should get Lifetime
      if (hasLifetime) {
        alreadyHaveHigher++;
      } else {
        needLifetime++;
        toAssign.push({ userId, email, membershipId: 'mem_lifetime_ekspor', tier: 'Lifetime' });
      }
    } else if (data.highestPriority === 2) { // Should get 12 Bulan
      if (hasLifetime || has12Bulan) {
        alreadyHaveHigher++;
      } else {
        need12Bulan++;
        toAssign.push({ userId, email, membershipId: 'mem_12bulan_ekspor', tier: '12 Bulan' });
      }
    } else { // Should get 6 Bulan
      if (hasLifetime || has12Bulan || has6Bulan) {
        alreadyHaveHigher++;
      } else {
        need6Bulan++;
        toAssign.push({ userId, email, membershipId: 'mem_6bulan_ekspor', tier: '6 Bulan' });
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 ASSIGNMENT NEEDED:');
  console.log('='.repeat(60));
  console.log(`  → Need Lifetime: ${needLifetime}`);
  console.log(`  → Need 12 Bulan: ${need12Bulan}`);
  console.log(`  → Need 6 Bulan: ${need6Bulan}`);
  console.log(`  → Already have equal/higher: ${alreadyHaveHigher}`);
  console.log(`  → Not in new DB: ${notInDb}`);
  console.log(`\n  TOTAL TO ASSIGN: ${toAssign.length}`);

  await conn.end();
  await prisma.$disconnect();
}

main().catch(console.error);
