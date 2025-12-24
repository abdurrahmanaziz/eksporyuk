const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Priority: Lifetime > 12 Bulan > 6 Bulan
const MEMBERSHIP_PRIORITY = {
  'lifetime': 3,
  '12-bulan': 2,
  '6-bulan': 1
};

// Product -> Membership type mapping
const PRODUCT_MEMBERSHIP_TYPE = {
  // Lifetime products
  'Kelas Eksporyuk': 'lifetime', // Legacy, treated as lifetime
  'Bundling Kelas Ekspor + Aplikasi EYA': 'lifetime',
  'Paket Ekspor Yuk Lifetime': 'lifetime',
  'Re Kelas Ekspor Lifetime': 'lifetime',
  
  // 12 Bulan products
  'Kelas Ekspor Yuk 12 Bulan': '12-bulan',
  'Paket Ekspor Yuk 12 Bulan': '12-bulan',
  'Re Kelas 12 Bulan Ekspor Yuk': '12-bulan',
  
  // 6 Bulan products  
  'Kelas Ekspor Yuk 6 Bulan': '6-bulan',
  'Paket Ekspor Yuk 6 Bulan': '6-bulan',
  'Re Kelas 6 Bulan Ekspor Yuk': '6-bulan',
  'Kelas Bimbingan Ekspor Yuk': '6-bulan'
};

async function main() {
  console.log('=== FIX RE KELAS MEMBERSHIPS (Smart) ===\n');
  
  // Get memberships
  const memberships = await prisma.membership.findMany();
  const membershipMap = {};
  for (const m of memberships) {
    if (m.name.includes('Lifetime')) membershipMap['lifetime'] = m;
    else if (m.name.includes('12 Bulan')) membershipMap['12-bulan'] = m;
    else if (m.name.includes('6 Bulan')) membershipMap['6-bulan'] = m;
  }
  
  console.log('Memberships:');
  console.log('  Lifetime:', membershipMap['lifetime']?.name);
  console.log('  12 Bulan:', membershipMap['12-bulan']?.name);
  console.log('  6 Bulan:', membershipMap['6-bulan']?.name);
  
  // Get all products
  const products = await prisma.product.findMany();
  const productMap = {};
  for (const p of products) {
    productMap[p.id] = p;
  }
  
  // Get Re Kelas products
  const reProducts = await prisma.product.findMany({
    where: { name: { startsWith: 'Re Kelas' } }
  });
  
  // Collect all Re Kelas buyers without membership
  const needMembership = [];
  
  for (const product of reProducts) {
    const buyers = await prisma.transaction.findMany({
      where: { productId: product.id, status: 'SUCCESS' },
      select: { userId: true },
      distinct: ['userId']
    });
    const buyerIds = buyers.map(b => b.userId);
    
    // Check who doesn't have membership
    const withUM = await prisma.userMembership.findMany({
      where: { userId: { in: buyerIds } },
      select: { userId: true }
    });
    const hasUM = new Set(withUM.map(m => m.userId));
    
    for (const userId of buyerIds) {
      if (!hasUM.has(userId)) {
        needMembership.push(userId);
      }
    }
  }
  
  // Deduplicate
  const uniqueUsers = [...new Set(needMembership)];
  console.log('\nTotal users need membership:', uniqueUsers.length);
  
  // For each user, find their highest membership type based on ALL products they bought
  let created = 0;
  let upgraded = 0;
  
  for (let i = 0; i < uniqueUsers.length; i++) {
    const userId = uniqueUsers[i];
    
    // Get all products this user bought
    const userTxs = await prisma.transaction.findMany({
      where: { userId, status: 'SUCCESS' }
    });
    
    // Find highest priority membership type
    let highestType = null;
    let highestPriority = 0;
    
    for (const tx of userTxs) {
      const product = productMap[tx.productId];
      if (product) {
        const membershipType = PRODUCT_MEMBERSHIP_TYPE[product.name];
        if (membershipType) {
          const priority = MEMBERSHIP_PRIORITY[membershipType];
          if (priority > highestPriority) {
            highestPriority = priority;
            highestType = membershipType;
          }
        }
      }
    }
    
    if (highestType && membershipMap[highestType]) {
      const membership = membershipMap[highestType];
      
      // Calculate end date
      let endDate;
      if (highestType === 'lifetime') {
        endDate = new Date('2099-12-31');
      } else if (highestType === '12-bulan') {
        endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      }
      
      // Create membership
      try {
        await prisma.userMembership.create({
          data: {
            userId,
            membershipId: membership.id,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
            isActive: true
          }
        });
        created++;
      } catch (e) {
        // Skip if exists
      }
      
      // Upgrade role
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role === 'MEMBER_FREE') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_PREMIUM' }
        });
        upgraded++;
      }
    }
    
    if ((i + 1) % 100 === 0) {
      console.log('Progress:', (i + 1) + '/' + uniqueUsers.length);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Memberships created:', created);
  console.log('Users upgraded:', upgraded);
  
  // Final stats
  const totalUM = await prisma.userMembership.count();
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  
  const byMembership = await prisma.$queryRaw`
    SELECT m.name, COUNT(um.id)::int as count
    FROM "UserMembership" um
    JOIN "Membership" m ON um."membershipId" = m.id
    GROUP BY m.name
    ORDER BY count DESC
  `;
  
  console.log('\n=== FINAL STATS ===');
  console.log('Total UserMemberships:', totalUM);
  console.log('Total MEMBER_PREMIUM:', premiumCount);
  console.log('\nBy Membership:');
  for (const r of byMembership) {
    console.log('  -', r.name + ':', r.count);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
