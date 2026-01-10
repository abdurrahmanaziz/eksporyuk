/**
 * SEED MEMBERSHIPS & UPDATE USER ROLES
 * 18 Desember 2025
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function seedMemberships() {
  console.log('📦 SEEDING MEMBERSHIPS...');
  console.log('='.repeat(60));
  
  const memberships = [
    {
      name: 'Free Member',
      slug: 'free',
      description: 'Akses terbatas ke konten gratis',
      price: 0,
      duration: 0, // unlimited
      features: ['Akses konten gratis', 'Forum komunitas'],
      isActive: true
    },
    {
      name: 'Paket 6 Bulan',
      slug: '6-months',
      description: 'Akses penuh selama 6 bulan',
      price: 699000,
      duration: 180,
      features: ['Akses semua materi', 'Grup WhatsApp', 'Konsultasi mentor'],
      isActive: true
    },
    {
      name: 'Paket 12 Bulan',
      slug: '12-months',
      description: 'Akses penuh selama 12 bulan',
      price: 899000,
      duration: 365,
      features: ['Akses semua materi', 'Grup WhatsApp', 'Konsultasi mentor', 'Update materi'],
      isActive: true
    },
    {
      name: 'Paket Lifetime',
      slug: 'lifetime',
      description: 'Akses selamanya',
      price: 999000,
      duration: 36500, // 100 years
      features: ['Akses semua materi', 'Grup WhatsApp', 'Konsultasi mentor', 'Update materi selamanya'],
      isActive: true,
      isBestSeller: true
    }
  ];
  
  let created = 0;
  
  for (const membership of memberships) {
    try {
      await prisma.membership.upsert({
        where: { slug: membership.slug },
        create: membership,
        update: membership
      });
      created++;
      console.log(`  ✅ ${membership.name}`);
    } catch (err) {
      console.error(`  ❌ Error:`, err.message);
    }
  }
  
  console.log(`\n✅ Memberships created: ${created}\n`);
}

async function updateUserRolesBasedOnTransactions() {
  console.log('👥 UPDATING USER ROLES BASED ON TRANSACTIONS...');
  console.log('='.repeat(60));
  
  const salesDataRaw = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
  const salesData = salesDataRaw.orders || salesDataRaw;
  const completedOrders = salesData.filter(o => o.status === 'completed');
  
  // Product mapping
  const membershipProducts = {
    'LIFETIME': [13401, 8910, 15234, 16956, 17920, 19296, 20852],
    'MONTH_12': [13399, 8915, 8683],
    'MONTH_6': [13400, 8914, 8684]
  };
  
  // Get all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const emailToUserId = new Map();
  allUsers.forEach(u => {
    emailToUserId.set(u.email.toLowerCase(), u.id);
  });
  
  // Determine membership type for each user
  const userMembershipTypes = new Map();
  
  completedOrders.forEach(order => {
    if (!order.user_email) return;
    
    const userId = emailToUserId.get(order.user_email.toLowerCase());
    if (!userId) return;
    
    let membershipType = null;
    const productId = order.product_id;
    
    if (membershipProducts.LIFETIME.includes(productId)) {
      membershipType = 'LIFETIME';
    } else if (membershipProducts.MONTH_12.includes(productId)) {
      membershipType = 'MONTH_12';
    } else if (membershipProducts.MONTH_6.includes(productId)) {
      membershipType = 'MONTH_6';
    }
    
    if (membershipType) {
      const current = userMembershipTypes.get(userId);
      // Upgrade logic
      if (!current || 
          (membershipType === 'LIFETIME') ||
          (membershipType === 'MONTH_12' && current !== 'LIFETIME')) {
        userMembershipTypes.set(userId, membershipType);
      }
    }
  });
  
  console.log(`  Found ${userMembershipTypes.size} users with memberships\n`);
  
  // Update user roles
  let updated = 0;
  
  for (const [userId, membershipType] of userMembershipTypes) {
    try {
      let role = 'MEMBER_FREE';
      
      if (membershipType === 'LIFETIME' || membershipType === 'MONTH_12') {
        role = 'MEMBER_PREMIUM';
      } else if (membershipType === 'MONTH_6') {
        role = 'MEMBER_FREE'; // or MEMBER_PREMIUM depending on your logic
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: { role: role }
      });
      
      updated++;
      
      if (updated % 500 === 0) {
        console.log(`  Progress: ${updated} users updated...`);
      }
    } catch (err) {
      console.error(`  Error:`, err.message);
    }
  }
  
  console.log(`\n✅ User roles updated: ${updated}\n`);
}

async function createUserMemberships() {
  console.log('💳 CREATING USER MEMBERSHIPS RECORDS...');
  console.log('='.repeat(60));
  
  const salesDataRaw = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
  const salesData = salesDataRaw.orders || salesDataRaw;
  const completedOrders = salesData.filter(o => o.status === 'completed');
  
  // Product mapping
  const membershipProducts = {
    'LIFETIME': [13401, 8910, 15234, 16956, 17920, 19296, 20852],
    'MONTH_12': [13399, 8915, 8683],
    'MONTH_6': [13400, 8914, 8684]
  };
  
  // Get memberships
  const memberships = await prisma.membership.findMany({
    select: { id: true, slug: true }
  });
  
  const membershipMap = new Map();
  memberships.forEach(m => membershipMap.set(m.slug, m.id));
  
  // Get all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const emailToUserId = new Map();
  allUsers.forEach(u => {
    emailToUserId.set(u.email.toLowerCase(), u.id);
  });
  
  // Determine membership for each user
  const userMemberships = new Map();
  
  completedOrders.forEach(order => {
    if (!order.user_email) return;
    
    const userId = emailToUserId.get(order.user_email.toLowerCase());
    if (!userId) return;
    
    let membershipSlug = null;
    const productId = order.product_id;
    
    if (membershipProducts.LIFETIME.includes(productId)) {
      membershipSlug = 'lifetime';
    } else if (membershipProducts.MONTH_12.includes(productId)) {
      membershipSlug = '12-months';
    } else if (membershipProducts.MONTH_6.includes(productId)) {
      membershipSlug = '6-months';
    }
    
    if (membershipSlug) {
      const current = userMemberships.get(userId);
      // Upgrade logic
      if (!current || 
          (membershipSlug === 'lifetime') ||
          (membershipSlug === '12-months' && current !== 'lifetime')) {
        userMemberships.set(userId, membershipSlug);
      }
    }
  });
  
  console.log(`  Processing ${userMemberships.size} user memberships...\n`);
  
  let created = 0;
  
  for (const [userId, membershipSlug] of userMemberships) {
    try {
      const membershipId = membershipMap.get(membershipSlug);
      if (!membershipId) continue;
      
      // Calculate expiry date
      let expiryDate = null;
      if (membershipSlug === 'lifetime') {
        expiryDate = new Date('2099-12-31');
      } else if (membershipSlug === '12-months') {
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 12);
      } else if (membershipSlug === '6-months') {
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      }
      
      // Check if already exists
      const existing = await prisma.userMembership.findFirst({
        where: {
          userId: userId,
          membershipId: membershipId
        }
      });
      
      if (existing) continue;
      
      await prisma.userMembership.create({
        data: {
          userId: userId,
          membershipId: membershipId,
          startDate: new Date(),
          expiryDate: expiryDate,
          isActive: true,
          autoRenew: false
        }
      });
      
      created++;
      
      if (created % 500 === 0) {
        console.log(`  Progress: ${created} memberships created...`);
      }
    } catch (err) {
      if (!err.message.includes('Unique constraint')) {
        console.error(`  Error:`, err.message);
      }
    }
  }
  
  console.log(`\n✅ User memberships created: ${created}\n`);
}

async function verifyFinal() {
  console.log('✅ FINAL VERIFICATION');
  console.log('='.repeat(60));
  
  const membershipCount = await prisma.membership.count();
  const userCount = await prisma.user.count();
  const premiumCount = await prisma.user.count({
    where: { role: 'MEMBER_PREMIUM' }
  });
  const userMembershipCount = await prisma.userMembership.count({
    where: { isActive: true }
  });
  
  // Sample users with memberships
  const sampleUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    take: 5,
    select: {
      name: true,
      email: true,
      role: true,
      userMemberships: {
        select: {
          membership: {
            select: { name: true }
          },
          expiryDate: true
        }
      }
    }
  });
  
  console.log(`Memberships: ${membershipCount}`);
  console.log(`Total Users: ${userCount}`);
  console.log(`Premium Users: ${premiumCount}`);
  console.log(`Active Memberships: ${userMembershipCount}`);
  
  console.log('\nSample Premium Users:');
  sampleUsers.forEach(u => {
    const membership = u.userMemberships[0];
    console.log(`  ${u.name} - ${membership?.membership.name} (expires: ${membership?.expiryDate?.toISOString().split('T')[0]})`);
  });
}

async function main() {
  try {
    await seedMemberships();
    await updateUserRolesBasedOnTransactions();
    await createUserMemberships();
    await verifyFinal();
    
    console.log('\n✅ ALL DONE!');
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
