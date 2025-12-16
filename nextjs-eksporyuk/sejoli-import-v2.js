const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Status mapping: Sejoli -> NextJS
const STATUS_MAP = {
  'completed': 'SUCCESS',
  'cancelled': 'FAILED',
  'refunded': 'FAILED',
  'payment-confirm': 'PENDING',
  'on-hold': 'PENDING',
  'pending-payment': 'PENDING'
};

function generateCUID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return 'c' + timestamp + randomPart;
}

async function main() {
  console.log('🚀 SEJOLI IMPORT v2 - With Correct User ID Mapping');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load Sejoli data
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  console.log('📂 Loading Sejoli data from:', sejoliPath);
  
  if (!fs.existsSync(sejoliPath)) {
    console.error('❌ File not found:', sejoliPath);
    process.exit(1);
  }
  
  const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
  console.log(`✅ Loaded: ${sejoliData.users?.length || 0} users, ${sejoliData.orders?.length || 0} orders`);
  
  // Build Sejoli user_id -> email map
  const sejoliUserById = {};
  for (const user of sejoliData.users) {
    sejoliUserById[user.id] = user;
  }
  console.log(`✓ Built Sejoli user map: ${Object.keys(sejoliUserById).length} users`);
  
  // Analyze Sejoli data
  console.log('\n📊 Analyzing Sejoli data...');
  const sejoliStats = {};
  for (const order of sejoliData.orders) {
    const status = order.status || 'unknown';
    if (!sejoliStats[status]) sejoliStats[status] = { count: 0, amount: 0 };
    sejoliStats[status].count++;
    sejoliStats[status].amount += parseFloat(order.grand_total) || 0;
  }
  
  for (const [status, data] of Object.entries(sejoliStats)) {
    console.log(`  ${status}: ${data.count} orders, Rp ${data.amount.toLocaleString('id-ID')}`);
  }
  
  // Step 1: Clear existing data
  console.log('\n🗑️  Step 1: Clearing existing transactions...');
  
  await prisma.affiliateConversion.deleteMany({});
  console.log('  ✓ Cleared affiliate conversions');
  
  await prisma.userMembership.deleteMany({});
  console.log('  ✓ Cleared user memberships');
  
  await prisma.transaction.deleteMany({});
  console.log('  ✓ Cleared transactions');
  
  // Step 2: Get existing users by email
  console.log('\n👥 Step 2: Building user map...');
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const userByEmail = {};
  for (const u of existingUsers) {
    userByEmail[u.email.toLowerCase()] = u.id;
  }
  console.log(`  Found ${existingUsers.length} existing users in DB`);
  
  // Step 3: Create missing users
  console.log('\n👤 Step 3: Creating missing users...');
  let newUsersCount = 0;
  const userBatch = [];
  
  for (const sejoliUser of sejoliData.users) {
    const email = (sejoliUser.user_email || '').toLowerCase().trim();
    if (!email || userByEmail[email]) continue;
    
    const userId = generateCUID();
    userByEmail[email] = userId;
    
    userBatch.push({
      id: userId,
      email: email,
      name: sejoliUser.display_name || sejoliUser.user_login || email.split('@')[0],
      password: '$2a$10$defaultpasswordhash',
      role: 'MEMBER_FREE',
      isActive: true,
      createdAt: sejoliUser.user_registered ? new Date(sejoliUser.user_registered) : new Date(),
      updatedAt: new Date()
    });
    newUsersCount++;
  }
  
  if (userBatch.length > 0) {
    for (let i = 0; i < userBatch.length; i += 500) {
      const batch = userBatch.slice(i, i + 500);
      await prisma.user.createMany({ data: batch, skipDuplicates: true });
      console.log(`  ✓ Created users batch ${Math.floor(i/500) + 1}/${Math.ceil(userBatch.length/500)}`);
    }
  }
  console.log(`  ✓ Total new users: ${newUsersCount}`);
  
  // Step 4: Import transactions
  console.log('\n💳 Step 4: Importing transactions...');
  
  // Create Sejoli user_id -> DB user_id map
  const sejoliToDbUserId = {};
  for (const sejoliUser of sejoliData.users) {
    const email = (sejoliUser.user_email || '').toLowerCase().trim();
    if (email && userByEmail[email]) {
      sejoliToDbUserId[sejoliUser.id] = userByEmail[email];
    }
  }
  console.log(`  ✓ Mapped ${Object.keys(sejoliToDbUserId).length} Sejoli users to DB users`);
  
  let txCount = 0;
  let skippedCount = 0;
  const txBatch = [];
  
  for (const order of sejoliData.orders) {
    const dbUserId = sejoliToDbUserId[order.user_id];
    
    if (!dbUserId) {
      skippedCount++;
      continue;
    }
    
    const status = STATUS_MAP[order.status] || 'FAILED';
    const amount = parseFloat(order.grand_total) || 0;
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    
    txBatch.push({
      id: generateCUID(),
      userId: dbUserId,
      type: 'MEMBERSHIP',
      status: status,
      amount: amount,
      paymentMethod: order.payment_gateway || 'manual',
      reference: `SEJOLI-${order.id}`,
      invoiceNumber: `INV${order.id}`,
      metadata: {
        sejoliOrderId: order.id,
        sejoliUserId: order.user_id,
        sejoliProductId: order.product_id,
        sejoliAffiliateId: order.affiliate_id,
        originalStatus: order.status
      },
      createdAt: createdAt,
      updatedAt: new Date()
    });
    txCount++;
  }
  
  console.log(`  ✓ Prepared ${txCount} transactions (skipped ${skippedCount} without user mapping)`);
  
  // Insert in batches
  for (let i = 0; i < txBatch.length; i += 500) {
    const batch = txBatch.slice(i, i + 500);
    await prisma.transaction.createMany({ data: batch });
    console.log(`  ✓ Batch ${Math.floor(i/500) + 1}/${Math.ceil(txBatch.length/500)}`);
  }
  
  // Step 5: Create memberships for SUCCESS transactions
  console.log('\n🎫 Step 5: Creating memberships for SUCCESS transactions...');
  
  const memberships = await prisma.membership.findMany();
  const defaultMembership = memberships.sort((a, b) => Number(a.price) - Number(b.price))[0];
  console.log(`  Using default membership: ${defaultMembership.name}`);
  
  const successTx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS', type: 'MEMBERSHIP' },
    select: { id: true, userId: true, amount: true, createdAt: true }
  });
  
  console.log(`  Found ${successTx.length} SUCCESS transactions`);
  
  // Group by user, keep latest transaction
  const userLatestTx = {};
  for (const tx of successTx) {
    const existing = userLatestTx[tx.userId];
    if (!existing || new Date(tx.createdAt) > new Date(existing.createdAt)) {
      userLatestTx[tx.userId] = tx;
    }
  }
  
  const uniqueUsers = Object.keys(userLatestTx);
  console.log(`  Unique users with SUCCESS: ${uniqueUsers.length}`);
  
  const membershipData = [];
  for (const userId of uniqueUsers) {
    const tx = userLatestTx[userId];
    const amount = Number(tx.amount);
    
    // Find matching membership by price
    let membership = memberships.find(m => Math.abs(Number(m.price) - amount) < 5000);
    if (!membership) membership = defaultMembership;
    
    const durationMonths = {
      'ONE_MONTH': 1,
      'THREE_MONTHS': 3,
      'SIX_MONTHS': 6,
      'TWELVE_MONTHS': 12,
      'LIFETIME': 1200
    };
    
    const months = durationMonths[membership.duration] || 12;
    const startDate = new Date(tx.createdAt);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    
    membershipData.push({
      id: generateCUID(),
      userId: userId,
      membershipId: membership.id,
      transactionId: tx.id,
      startDate: startDate,
      endDate: endDate,
      createdAt: startDate,
      updatedAt: new Date()
    });
  }
  
  // Insert memberships
  for (let i = 0; i < membershipData.length; i += 500) {
    const batch = membershipData.slice(i, i + 500);
    await prisma.userMembership.createMany({ data: batch, skipDuplicates: true });
    console.log(`  ✓ Membership batch ${Math.floor(i/500) + 1}/${Math.ceil(membershipData.length/500)}`);
  }
  
  // Final stats
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 FINAL STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const stats = await prisma.transaction.groupBy({
    by: ['status'],
    _count: { status: true },
    _sum: { amount: true }
  });
  
  let totalAmount = 0;
  let successAmount = 0;
  let successCount = 0;
  
  for (const s of stats) {
    const count = s._count.status;
    const amount = Number(s._sum.amount) || 0;
    totalAmount += amount;
    if (s.status === 'SUCCESS') {
      successAmount = amount;
      successCount = count;
    }
    console.log(`  ${s.status}: ${count.toLocaleString('id-ID')} transaksi, Rp ${amount.toLocaleString('id-ID')}`);
  }
  
  const totalTx = await prisma.transaction.count();
  const totalMemberships = await prisma.userMembership.count();
  const totalUsers = await prisma.user.count();
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total Transaksi: ${totalTx.toLocaleString('id-ID')}`);
  console.log(`  Total Revenue: Rp ${totalAmount.toLocaleString('id-ID')}`);
  console.log(`  Success Revenue: Rp ${successAmount.toLocaleString('id-ID')}`);
  console.log(`  Conversion Rate: ${((successCount/totalTx)*100).toFixed(1)}%`);
  console.log(`  Total Users: ${totalUsers.toLocaleString('id-ID')}`);
  console.log(`  Total Memberships: ${totalMemberships.toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
  console.log('\n✅ Import completed successfully!');
}

main().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
