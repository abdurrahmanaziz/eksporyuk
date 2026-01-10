/**
 * Import Sejoli REST API - Update Transactions with Affiliate Name & Commission
 * Sinkronisasi data lokal dengan data live dari Sejoli API
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEJOLI_SALES_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';
const SEJOLI_PRODUCTS_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/products';

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

async function fetchSejoliData() {
  console.log('📡 Fetching data from Sejoli REST API...\n');
  
  // Fetch products
  console.log('  Fetching products...');
  const productsRes = await fetch(SEJOLI_PRODUCTS_API);
  const products = await productsRes.json();
  console.log(`  ✓ ${products.length} products fetched`);
  
  // Build product commission map
  const productCommissionMap = {};
  for (const p of products) {
    const aff = p.affiliate?.['1'] || p.affiliate?.['0'] || {};
    productCommissionMap[p.id] = {
      name: p.title,
      price: parseFloat(p.price || p.product_raw_price) || 0,
      commissionAmount: parseFloat(aff.fee) || 0,
      commissionType: aff.type === 'percentage' ? 'PERCENTAGE' : 'FLAT'
    };
  }
  
  // Fetch orders
  console.log('  Fetching orders...');
  const ordersRes = await fetch(SEJOLI_SALES_API);
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders;
  console.log(`  ✓ ${orders.length} orders fetched`);
  
  return { products, orders, productCommissionMap };
}

async function buildUserMaps(orders) {
  console.log('\n👥 Building user maps...');
  
  // Get existing users from DB
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  
  const userByEmail = {};
  for (const u of existingUsers) {
    userByEmail[u.email.toLowerCase()] = u;
  }
  console.log(`  Found ${existingUsers.length} existing users in DB`);
  
  // Build affiliate map from Sejoli orders (affiliate_id -> affiliate_name)
  const affiliateMap = {};
  for (const order of orders) {
    if (order.affiliate_id && order.affiliate_name) {
      affiliateMap[order.affiliate_id] = order.affiliate_name;
    }
  }
  console.log(`  Found ${Object.keys(affiliateMap).length} unique affiliates`);
  
  // Create missing users
  const newUsers = [];
  for (const order of orders) {
    const email = (order.user_email || '').toLowerCase().trim();
    if (!email || userByEmail[email]) continue;
    
    const userId = generateCUID();
    userByEmail[email] = { id: userId, email: email, name: order.user_name };
    newUsers.push({
      id: userId,
      email: email,
      name: order.user_name || email.split('@')[0],
      password: '$2a$10$defaultpasswordhash',
      role: 'MEMBER_FREE',
      isActive: true,
      createdAt: order.created_at ? new Date(order.created_at) : new Date(),
      updatedAt: new Date()
    });
  }
  
  if (newUsers.length > 0) {
    for (let i = 0; i < newUsers.length; i += 500) {
      const batch = newUsers.slice(i, i + 500);
      await prisma.user.createMany({ data: batch, skipDuplicates: true });
    }
    console.log(`  ✓ Created ${newUsers.length} new users`);
  }
  
  return { userByEmail, affiliateMap };
}

async function importTransactions(orders, userByEmail, affiliateMap, productCommissionMap) {
  console.log('\n💳 Importing transactions...');
  
  // Clear existing data
  await prisma.affiliateConversion.deleteMany({});
  console.log('  ✓ Cleared affiliate conversions');
  
  await prisma.userMembership.deleteMany({});
  console.log('  ✓ Cleared user memberships');
  
  await prisma.transaction.deleteMany({});
  console.log('  ✓ Cleared transactions');
  
  const transactions = [];
  const affiliateConversions = [];
  let skipped = 0;
  
  for (const order of orders) {
    const email = (order.user_email || '').toLowerCase().trim();
    const user = userByEmail[email];
    
    if (!user) {
      skipped++;
      continue;
    }
    
    const status = STATUS_MAP[order.status] || 'FAILED';
    const amount = parseFloat(order.grand_total) || 0;
    const productInfo = productCommissionMap[order.product_id] || {};
    const txId = generateCUID();
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    
    // Get affiliate info
    const affiliateName = order.affiliate_name || affiliateMap[order.affiliate_id] || null;
    const affiliateId = order.affiliate_id || null;
    
    // Calculate commission based on product
    let commissionAmount = 0;
    if (affiliateId && productInfo.commissionAmount) {
      if (productInfo.commissionType === 'PERCENTAGE') {
        commissionAmount = (amount * productInfo.commissionAmount) / 100;
      } else {
        commissionAmount = productInfo.commissionAmount;
      }
    }
    
    transactions.push({
      id: txId,
      userId: user.id,
      type: 'MEMBERSHIP',
      status: status,
      amount: amount,
      paymentMethod: order.payment_gateway || 'xendit',
      reference: `SEJOLI-${order.ID}`,
      invoiceNumber: `INV${order.ID}`,
      description: order.product_name || productInfo.name || 'Membership',
      metadata: {
        sejoliOrderId: order.ID,
        sejoliProductId: order.product_id,
        productName: order.product_name,
        originalStatus: order.status,
        affiliateId: affiliateId,
        affiliateName: affiliateName,
        commissionAmount: commissionAmount
      },
      createdAt: createdAt,
      updatedAt: new Date()
    });
    
    // Create affiliate conversion for SUCCESS with commission
    if (status === 'SUCCESS' && affiliateId && commissionAmount > 0) {
      affiliateConversions.push({
        txId: txId,
        affiliateId: affiliateId,
        affiliateName: affiliateName,
        commissionAmount: commissionAmount,
        createdAt: createdAt
      });
    }
  }
  
  console.log(`  ✓ Prepared ${transactions.length} transactions (skipped ${skipped})`);
  console.log(`  ✓ Prepared ${affiliateConversions.length} affiliate conversions`);
  
  // Insert transactions in batches
  for (let i = 0; i < transactions.length; i += 500) {
    const batch = transactions.slice(i, i + 500);
    await prisma.transaction.createMany({ data: batch });
    if ((i / 500 + 1) % 10 === 0 || i + 500 >= transactions.length) {
      console.log(`  ✓ Batch ${Math.floor(i/500) + 1}/${Math.ceil(transactions.length/500)}`);
    }
  }
  
  return { transactions, affiliateConversions };
}

async function createAffiliateConversions(conversions, userByEmail) {
  console.log('\n🤝 Creating affiliate conversions...');
  
  if (conversions.length === 0) {
    console.log('  No conversions to create');
    return;
  }
  
  // Get all affiliate profiles with user info
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { id: true, name: true } } }
  });
  
  // Build affiliate profile map by user name (case insensitive)
  const profileByName = {};
  for (const ap of affiliateProfiles) {
    if (ap.user?.name) {
      profileByName[ap.user.name.toLowerCase()] = ap;
    }
  }
  console.log(`  Found ${affiliateProfiles.length} affiliate profiles`);
  
  // Get default affiliate profile (admin or first one)
  const defaultProfile = affiliateProfiles.find(ap => ap.user?.name?.toLowerCase().includes('admin')) 
    || affiliateProfiles[0];
  
  if (!defaultProfile) {
    console.log('  ⚠️ No affiliate profiles found, creating conversions will be skipped');
    return;
  }
  
  const conversionData = [];
  let matchedAffiliate = 0;
  let defaultAffiliate = 0;
  
  for (const conv of conversions) {
    // Try to find affiliate profile by name
    let affiliateProfile = null;
    
    if (conv.affiliateName) {
      affiliateProfile = profileByName[conv.affiliateName.toLowerCase()];
      if (affiliateProfile) {
        matchedAffiliate++;
      }
    }
    
    // Fallback to default profile
    if (!affiliateProfile) {
      affiliateProfile = defaultProfile;
      defaultAffiliate++;
    }
    
    // Calculate commission rate (percentage)
    const amount = conv.transactionAmount || conv.commissionAmount * 3; // Estimate
    const commissionRate = amount > 0 ? (conv.commissionAmount / amount) * 100 : 10;
    
    conversionData.push({
      id: generateCUID(),
      affiliateId: affiliateProfile.id,
      transactionId: conv.txId,
      commissionAmount: conv.commissionAmount,
      commissionRate: commissionRate,
      paidOut: false,
      createdAt: conv.createdAt
    });
  }
  
  console.log(`  Matched affiliates: ${matchedAffiliate}`);
  console.log(`  Using default affiliate: ${defaultAffiliate}`);
  
  // Insert in batches, handling unique constraint errors
  let created = 0;
  for (let i = 0; i < conversionData.length; i += 500) {
    const batch = conversionData.slice(i, i + 500);
    try {
      const result = await prisma.affiliateConversion.createMany({ 
        data: batch, 
        skipDuplicates: true 
      });
      created += result.count;
    } catch (error) {
      console.log(`  ⚠️ Batch error: ${error.message.substring(0, 100)}`);
      // Try one by one
      for (const item of batch) {
        try {
          await prisma.affiliateConversion.create({ data: item });
          created++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }
  
  console.log(`  ✓ Created ${created} affiliate conversions`);
  
  // Calculate total commission
  const totalCommission = conversionData.reduce((sum, c) => sum + c.commissionAmount, 0);
  console.log(`  ✓ Total commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
}

async function createMemberships() {
  console.log('\n🎫 Creating memberships for SUCCESS transactions...');
  
  const memberships = await prisma.membership.findMany();
  const defaultMembership = memberships.sort((a, b) => Number(a.price) - Number(b.price))[0];
  
  const successTx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS', type: 'MEMBERSHIP' },
    select: { id: true, userId: true, amount: true, createdAt: true }
  });
  
  console.log(`  Found ${successTx.length} SUCCESS transactions`);
  
  // Group by user, keep latest
  const userLatestTx = {};
  for (const tx of successTx) {
    const existing = userLatestTx[tx.userId];
    if (!existing || new Date(tx.createdAt) > new Date(existing.createdAt)) {
      userLatestTx[tx.userId] = tx;
    }
  }
  
  const uniqueUsers = Object.keys(userLatestTx);
  console.log(`  Unique users: ${uniqueUsers.length}`);
  
  const membershipData = [];
  for (const userId of uniqueUsers) {
    const tx = userLatestTx[userId];
    const amount = Number(tx.amount);
    
    let membership = memberships.find(m => Math.abs(Number(m.price) - amount) < 10000);
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
  
  for (let i = 0; i < membershipData.length; i += 500) {
    const batch = membershipData.slice(i, i + 500);
    await prisma.userMembership.createMany({ data: batch, skipDuplicates: true });
  }
  
  console.log(`  ✓ Created ${membershipData.length} memberships`);
}

async function verifyAndReport() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 FINAL VERIFICATION');
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
  const totalConversions = await prisma.affiliateConversion.count();
  
  const commissionSum = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  const totalCommission = Number(commissionSum._sum.commissionAmount) || 0;
  
  // Get sample transactions with affiliate info
  const sampleWithAffiliate = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      metadata: { path: ['affiliateName'], not: null }
    },
    take: 5,
    select: {
      id: true,
      amount: true,
      description: true,
      metadata: true
    }
  });
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total Transaksi: ${totalTx.toLocaleString('id-ID')}`);
  console.log(`  Total Revenue: Rp ${totalAmount.toLocaleString('id-ID')}`);
  console.log(`  Success Revenue: Rp ${successAmount.toLocaleString('id-ID')}`);
  console.log(`  Conversion Rate: ${((successCount/totalTx)*100).toFixed(1)}%`);
  console.log(`  Total Memberships: ${totalMemberships.toLocaleString('id-ID')}`);
  console.log(`  Total Affiliate Conversions: ${totalConversions.toLocaleString('id-ID')}`);
  console.log(`  Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
  
  if (sampleWithAffiliate.length > 0) {
    console.log('\n📋 Sample Transactions with Affiliate:');
    for (const tx of sampleWithAffiliate) {
      const meta = tx.metadata;
      console.log(`  - ${tx.description}: Rp ${Number(tx.amount).toLocaleString('id-ID')}`);
      console.log(`    Affiliate: ${meta.affiliateName || '-'}, Commission: Rp ${(meta.commissionAmount || 0).toLocaleString('id-ID')}`);
    }
  }
}

async function main() {
  console.log('🚀 SEJOLI REST API IMPORT - Update Transactions & Commissions');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Fetch data from Sejoli API
    const { orders, productCommissionMap } = await fetchSejoliData();
    
    // Step 2: Build user maps
    const { userByEmail, affiliateMap } = await buildUserMaps(orders);
    
    // Step 3: Import transactions
    const { affiliateConversions } = await importTransactions(
      orders, userByEmail, affiliateMap, productCommissionMap
    );
    
    // Step 4: Create affiliate conversions
    await createAffiliateConversions(affiliateConversions, userByEmail);
    
    // Step 5: Create memberships
    await createMemberships();
    
    // Step 6: Verify and report
    await verifyAndReport();
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
