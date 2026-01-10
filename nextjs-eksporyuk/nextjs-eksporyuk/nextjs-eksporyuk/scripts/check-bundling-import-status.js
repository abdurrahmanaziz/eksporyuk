/**
 * Check if Bundling EYA buyers from Sejoli are already imported as Lifetime members
 */

require('dotenv').config({ path: '.env.sejoli' });
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBundlingImportStatus() {
  console.log('🔍 Checking Bundling EYA Import Status...\n');
  
  // Connect to Sejoli DB
  const sejoliConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: parseInt(process.env.SEJOLI_DB_PORT || '3307', 10),
    user: process.env.SEJOLI_DB_USER,
    password: process.env.SEJOLI_DB_PASSWORD,
    database: process.env.SEJOLI_DB_NAME
  });

  try {
    // Get buyers of Bundling product (ID 3840) from Tutor LMS enrollments
    console.log('📦 Getting buyers of "Bundling Kelas Ekspor + Aplikasi EYA" (ID 3840)...\n');
    
    const [sejoliOrders] = await sejoliConn.execute(`
      SELECT DISTINCT 
        u.user_email,
        u.display_name
      FROM wp_posts te
      INNER JOIN wp_users u ON te.post_author = u.ID
      INNER JOIN wp_postmeta pm ON te.ID = pm.post_id 
      WHERE te.post_type = 'tutor_enrolled'
        AND pm.meta_key = '_tutor_enrolled_by_product_id'
        AND pm.meta_value = '3840'
        AND te.post_status IN ('completed', 'processing', 'pending')
      ORDER BY u.user_registered DESC
    `);
    
    console.log(`✅ Found ${sejoliOrders.length} unique buyers in Sejoli\n`);
    
    if (sejoliOrders.length === 0) {
      console.log('⚠️  No orders found for this product');
      await sejoliConn.end();
      await prisma.$disconnect();
      return;
    }
    
    // Show sample from Sejoli
    console.log('📋 Sample buyers from Sejoli (first 10):');
    sejoliOrders.slice(0, 10).forEach((order, i) => {
      console.log(`${i+1}. ${order.user_email} - ${order.display_name}`);
    });
    console.log('');
    
    const emails = sejoliOrders.map(o => o.user_email.toLowerCase());
    
    // Get Lifetime membership
    const lifetimeMembership = await prisma.membership.findFirst({
      where: {
        OR: [
          { slug: 'lifetime-ekspor' },
          { name: { contains: 'Lifetime', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!lifetimeMembership) {
      console.log('❌ Lifetime membership tidak ditemukan!');
      await sejoliConn.end();
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Lifetime Membership: ${lifetimeMembership.name} (ID: ${lifetimeMembership.id})\n`);
    
    // Check how many are imported (users exist)
    const importedUsers = await prisma.user.findMany({
      where: {
        email: { in: emails, mode: 'insensitive' }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    // Check which users have lifetime membership
    const userIds = importedUsers.map(u => u.id);
    const usersWithLifetime = await prisma.userMembership.findMany({
      where: {
        userId: { in: userIds },
        membershipId: lifetimeMembership.id
      },
      select: {
        userId: true
      }
    });
    
    const userIdsWithLifetime = new Set(usersWithLifetime.map(um => um.userId));
    
    const usersWithMembership = importedUsers.filter(u => userIdsWithLifetime.has(u.id));
    const usersWithoutMembership = importedUsers.filter(u => !userIdsWithLifetime.has(u.id));
    
    const importedEmails = importedUsers.map(u => u.email.toLowerCase());
    const notImportedEmails = emails.filter(email => !importedEmails.includes(email.toLowerCase()));
    
    console.log('📊 Import Status:');
    console.log(`   Total bundling buyers (Sejoli): ${sejoliOrders.length}`);
    console.log(`   ✅ Imported + has Lifetime membership: ${usersWithMembership.length}`);
    console.log(`   ⚠️  Imported tapi NO Lifetime membership: ${usersWithoutMembership.length}`);
    console.log(`   ❌ Belum di-import: ${notImportedEmails.length}\n`);
    
    if (usersWithoutMembership.length > 0) {
      console.log('⚠️  Users imported tapi belum dapat Lifetime (sample 10):');
      usersWithoutMembership.slice(0, 10).forEach((user, i) => {
        console.log(`   ${i+1}. ${user.email} - ${user.name || 'N/A'}`);
      });
      console.log('');
    }
    
    if (notImportedEmails.length > 0) {
      console.log('❌ Users belum di-import (sample 10):');
      notImportedEmails.slice(0, 10).forEach((email, i) => {
        const sejoli = sejoliOrders.find(o => o.user_email.toLowerCase() === email.toLowerCase());
        console.log(`   ${i+1}. ${email} - ${sejoli?.display_name || 'N/A'}`);
      });
      console.log('');
    }
    
    // Check sample imported user details
    if (usersWithMembership.length > 0) {
      console.log('✅ Sample imported users with Lifetime membership (5):');
      for (const user of usersWithMembership.slice(0, 5)) {
        const enrollment = await prisma.courseEnrollment.count({
          where: { userId: user.id }
        });
        const groups = await prisma.groupMember.count({
          where: { userId: user.id }
        });
        
        console.log(`   - ${user.email}`);
        console.log(`     Course enrollments: ${enrollment}, Group memberships: ${groups}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SSH tunnel belum aktif!');
      console.log('   Jalankan: node scripts/open-sejoli-tunnel.js');
    }
  } finally {
    await sejoliConn.end();
    await prisma.$disconnect();
  }
}

checkBundlingImportStatus().catch(console.error);
