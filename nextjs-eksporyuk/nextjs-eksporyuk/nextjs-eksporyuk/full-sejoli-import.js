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

// Membership mapping by price
const MEMBERSHIP_MAP = {
  35000: { name: 'Member Free 1', duration: 'ONE_MONTH' },
  99000: { name: 'Member Free 2', duration: 'THREE_MONTHS' },
  199000: { name: 'Member Free 3', duration: 'SIX_MONTHS' },
  224100: { name: 'Member Free 4', duration: 'ONE_MONTH' },
  299000: { name: 'Member Free 5', duration: 'TWELVE_MONTHS' },
  449000: { name: 'Member Premium 1', duration: 'ONE_MONTH' },
  699000: { name: 'Member Premium 2', duration: 'THREE_MONTHS' },
  999000: { name: 'Member Premium 3', duration: 'SIX_MONTHS' },
  1499000: { name: 'Member Premium 4', duration: 'TWELVE_MONTHS' },
  1999000: { name: 'Member Premium 5', duration: 'LIFETIME' }
};

function getMembershipByPrice(price) {
  const amount = parseFloat(price);
  // Find closest match
  const prices = Object.keys(MEMBERSHIP_MAP).map(Number);
  let closest = prices[0];
  for (const p of prices) {
    if (Math.abs(p - amount) < Math.abs(closest - amount)) {
      closest = p;
    }
  }
  return MEMBERSHIP_MAP[closest] || { name: 'Member Free 1', duration: 'ONE_MONTH' };
}

function generateCUID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return 'c' + timestamp + randomPart;
}

async function main() {
  console.log('🚀 FULL SEJOLI IMPORT - Menyamakan Data Lokal dengan Live');
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
  console.log('\n🗑️  Step 1: Clearing existing data...');
  
  await prisma.affiliateConversion.deleteMany({});
  console.log('  ✓ Cleared affiliate conversions');
  
  await prisma.userMembership.deleteMany({});
  console.log('  ✓ Cleared user memberships');
  
  await prisma.transaction.deleteMany({});
  console.log('  ✓ Cleared transactions');
  
  // Step 2: Get existing memberships
  console.log('\n📋 Step 2: Fetching membership plans...');
  const memberships = await prisma.membership.findMany();
  console.log(`  Found ${memberships.length} membership plans`);
  
  // Create membership map by name
  const membershipByName = {};
  for (const m of memberships) {
    membershipByName[m.name] = m;
  }
  
  // Step 3: Create user email to ID map
  console.log('\n👥 Step 3: Building user map...');
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const userByEmail = {};
  for (const u of existingUsers) {
    userByEmail[u.email.toLowerCase()] = u.id;
  }
  console.log(`  Found ${existingUsers.length} existing users`);
  
  // Step 4: Import users yang belum ada
  console.log('\n👤 Step 4: Importing missing users...');
  let newUsersCount = 0;
  const userBatch = [];
  
  for (const sejoliUser of sejoliData.users) {
    const email = (sejoliUser.user_email || sejoliUser.email || '').toLowerCase().trim();
    if (!email || userByEmail[email]) continue;
    
    const userId = generateCUID();
    userByEmail[email] = userId;
    
    userBatch.push({
      id: userId,
      email: email,
      name: sejoliUser.display_name || sejoliUser.user_nicename || email.split('@')[0],
      password: '$2a$10$defaultpasswordhash', // Default hash
      role: 'MEMBER_FREE',
      isActive: true,
      createdAt: sejoliUser.user_registered ? new Date(sejoliUser.user_registered) : new Date(),
      updatedAt: new Date()
    });
    newUsersCount++;
  }
  
  if (userBatch.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < userBatch.length; i += 500) {
      const batch = userBatch.slice(i, i + 500);
      await prisma.user.createMany({ data: batch, skipDuplicates: true });
      console.log(`  ✓ Created users batch ${Math.floor(i/500) + 1}/${Math.ceil(userBatch.length/500)}`);
    }
  }
  console.log(`  ✓ Created ${newUsersCount} new users`);
  
  // Step 5: Import transactions
  console.log('\n💳 Step 5: Importing transactions...');
  let txCount = 0;
  let skippedCount = 0;
  const txBatch = [];
  const membershipBatch = [];
  
  for (const order of sejoliData.orders) {
    const email = (order.user_email || '').toLowerCase().trim();
    const userId = userByEmail[email];
    
    if (!userId) {
      skippedCount++;
      continue;
    }
    
    const status = STATUS_MAP[order.status] || 'FAILED';
    const amount = parseFloat(order.grand_total) || 0;
    const membershipInfo = getMembershipByPrice(amount);
    const membership = membershipByName[membershipInfo.name];
    
    const txId = generateCUID();
    const createdAt = order.created_date ? new Date(order.created_date) : new Date();
    
    // Transaction data
    txBatch.push({
      id: txId,
      userId: userId,
      type: 'MEMBERSHIP',
      status: status,
      amount: amount,
      paymentMethod: order.payment_gateway || 'xendit',
      reference: `SEJOLI-${order.ID || order.id}`,
      invoiceNumber: `INV${order.ID || order.id}`,
      metadata: {
        sejoliOrderId: order.ID || order.id,
        sejoliProductId: order.product_id,
        originalStatus: order.status,
        productName: order.product_name || membershipInfo.name
      },
      createdAt: createdAt,
      updatedAt: new Date()
    });
    
    // Create membership for SUCCESS transactions
    if (status === 'SUCCESS' && membership) {
      const durationMonths = {
        'ONE_MONTH': 1,
        'THREE_MONTHS': 3,
        'SIX_MONTHS': 6,
        'TWELVE_MONTHS': 12,
        'LIFETIME': 1200 // 100 years
      };
      
      const months = durationMonths[membershipInfo.duration] || 12;
      const startDate = createdAt;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      
      membershipBatch.push({
        id: generateCUID(),
        userId: userId,
        membershipId: membership.id,
        transactionId: txId,
        startDate: startDate,
        endDate: endDate,
        createdAt: createdAt,
        updatedAt: new Date()
      });
    }
    
    txCount++;
  }
  
  // Insert transactions in batches
  console.log(`  Processing ${txBatch.length} transactions...`);
  for (let i = 0; i < txBatch.length; i += 500) {
    const batch = txBatch.slice(i, i + 500);
    await prisma.transaction.createMany({ data: batch, skipDuplicates: true });
    console.log(`  ✓ Transactions batch ${Math.floor(i/500) + 1}/${Math.ceil(txBatch.length/500)}`);
  }
  
  // Insert memberships in batches
  console.log(`  Processing ${membershipBatch.length} memberships...`);
  for (let i = 0; i < membershipBatch.length; i += 500) {
    const batch = membershipBatch.slice(i, i + 500);
    await prisma.userMembership.createMany({ data: batch, skipDuplicates: true });
    console.log(`  ✓ Memberships batch ${Math.floor(i/500) + 1}/${Math.ceil(membershipBatch.length/500)}`);
  }
  
  console.log(`  ✓ Created ${txCount} transactions`);
  console.log(`  ✓ Created ${membershipBatch.length} memberships`);
  console.log(`  ⚠️  Skipped ${skippedCount} orders (no matching user)`);
  
  // Step 6: Verify results
  console.log('\n📊 Step 6: Verifying results...');
  
  const finalStats = await prisma.transaction.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true }
  });
  
  const totalTx = await prisma.transaction.count();
  const totalUsers = await prisma.user.count();
  const totalMemberships = await prisma.userMembership.count();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📈 FINAL RESULTS:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Total Transactions: ${totalTx}`);
  console.log(`Total Memberships: ${totalMemberships}`);
  console.log('');
  
  let totalRevenue = 0;
  let successRevenue = 0;
  let pendingRevenue = 0;
  
  for (const stat of finalStats) {
    const amount = Number(stat._sum.amount || 0);
    totalRevenue += amount;
    if (stat.status === 'SUCCESS') successRevenue = amount;
    if (stat.status === 'PENDING') pendingRevenue = amount;
    console.log(`${stat.status}: ${stat._count.id} transaksi, Rp ${amount.toLocaleString('id-ID')}`);
  }
  
  console.log('');
  console.log(`💰 Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
  console.log(`💚 Success Revenue: Rp ${successRevenue.toLocaleString('id-ID')}`);
  console.log(`⏳ Pending Revenue: Rp ${pendingRevenue.toLocaleString('id-ID')}`);
  
  // Calculate conversion rate
  const successCount = finalStats.find(s => s.status === 'SUCCESS')?._count.id || 0;
  const conversionRate = totalTx > 0 ? ((successCount / totalTx) * 100).toFixed(1) : 0;
  console.log(`📊 Conversion Rate: ${conversionRate}%`);
  
  console.log('\n✅ Import completed successfully!');
  console.log('🔄 Refresh your browser to see the updated data.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
