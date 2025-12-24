const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  console.log('=== INVESTIGATING PREMIUM USERS ===\n');
  
  // 1. Total users
  const totalUsers = await prisma.user.count();
  console.log('Total Users:', totalUsers);
  
  // 2. Users by role
  const byRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });
  console.log('\nUsers by Role:');
  for (const r of byRole) {
    console.log('  ' + r.role + ': ' + r._count);
  }
  
  // 3. Total transactions
  const totalTx = await prisma.transaction.count();
  console.log('\nTotal Transactions:', totalTx);
  
  // 4. Unique users with transactions (SUCCESS)
  const buyers = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { userId: true },
    distinct: ['userId']
  });
  const buyerIds = buyers.map(b => b.userId);
  console.log('Unique Users with SUCCESS transactions:', buyerIds.length);
  
  // 5. Check how many have UserMembership
  const withMembership = await prisma.userMembership.findMany({
    select: { userId: true },
    distinct: ['userId']
  });
  const membershipUserIds = new Set(withMembership.map(m => m.userId));
  console.log('Users with UserMembership:', membershipUserIds.size);
  
  // 6. Find buyers WITHOUT membership
  const buyersWithoutMembership = buyerIds.filter(id => !membershipUserIds.has(id));
  console.log('\n🔴 Buyers WITHOUT membership:', buyersWithoutMembership.length);
  
  // 7. Check their current roles
  const usersWithoutMembership = await prisma.user.findMany({
    where: { id: { in: buyersWithoutMembership } },
    select: { id: true, role: true }
  });
  const roleCount = {};
  for (const u of usersWithoutMembership) {
    roleCount[u.role] = (roleCount[u.role] || 0) + 1;
  }
  console.log('\nRoles of buyers WITHOUT membership:');
  console.log(roleCount);
  
  // 8. Sample - check what products they bought
  console.log('\n--- Sample buyers without membership ---');
  const sampleBuyers = buyersWithoutMembership.slice(0, 5);
  for (const userId of sampleBuyers) {
    const txs = await prisma.transaction.findMany({
      where: { userId, status: 'SUCCESS' }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log('\nUser:', user?.name, '| Role:', user?.role);
    console.log('Transactions:', txs.length);
    for (const tx of txs.slice(0, 3)) {
      const product = tx.productId ? await prisma.product.findUnique({ where: { id: tx.productId } }) : null;
      console.log('  - Product:', product?.name || 'NULL', '| Amount: Rp', Number(tx.amount).toLocaleString('id-ID'));
    }
  }
  
  return buyersWithoutMembership;
}

async function fixPremiumUsers(buyersWithoutMembership) {
  console.log('\n\n=== FIXING PREMIUM USERS ===\n');
  
  // Get lifetime membership for default assignment
  const lifetimeMembership = await prisma.membership.findFirst({
    where: { slug: 'paket-ekspor-yuk-lifetime' }
  });
  
  if (!lifetimeMembership) {
    console.log('❌ Lifetime membership not found!');
    return;
  }
  
  console.log('Using membership:', lifetimeMembership.name);
  
  let created = 0;
  let upgraded = 0;
  
  // Process in batches
  const batchSize = 500;
  for (let i = 0; i < buyersWithoutMembership.length; i += batchSize) {
    const batch = buyersWithoutMembership.slice(i, i + batchSize);
    
    for (const userId of batch) {
      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;
      
      // Create UserMembership
      try {
        await prisma.userMembership.create({
          data: {
            userId: userId,
            membershipId: lifetimeMembership.id,
            status: 'ACTIVE',
            startDate: new Date(),
            // Lifetime = no end date
          }
        });
        created++;
      } catch (e) {
        // Already exists
      }
      
      // Upgrade role if needed
      if (user.role === 'MEMBER_FREE') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_PREMIUM' }
        });
        upgraded++;
      }
    }
    
    console.log(`Processed ${Math.min(i + batchSize, buyersWithoutMembership.length)}/${buyersWithoutMembership.length}`);
  }
  
  console.log('\n✅ Fix complete!');
  console.log('   UserMemberships created:', created);
  console.log('   Users upgraded to PREMIUM:', upgraded);
}

async function main() {
  const buyersWithoutMembership = await investigate();
  
  if (buyersWithoutMembership.length > 0) {
    console.log('\n\n🔧 Fixing ' + buyersWithoutMembership.length + ' users...');
    await fixPremiumUsers(buyersWithoutMembership);
  }
  
  // Final stats
  console.log('\n\n=== FINAL STATS ===');
  const finalByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });
  console.log('Users by Role:');
  for (const r of finalByRole) {
    console.log('  ' + r.role + ': ' + r._count);
  }
  
  const totalMemberships = await prisma.userMembership.count();
  console.log('\nTotal UserMemberships:', totalMemberships);
  
  await prisma.$disconnect();
}

main().catch(console.error);
