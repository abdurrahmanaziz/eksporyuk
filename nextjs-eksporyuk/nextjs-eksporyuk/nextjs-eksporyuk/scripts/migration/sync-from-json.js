const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Load WordPress data from JSON
const wpDataPath = path.join(__dirname, 'wp-data/sejolisa-full-18000users-1765279985617.json');
const wpData = JSON.parse(fs.readFileSync(wpDataPath, 'utf8'));

console.log('📂 Loaded WordPress data:');
console.log('   Users:', wpData.users?.length || 0);
console.log('   Orders:', wpData.orders?.length || 0);
console.log('   Affiliates:', wpData.affiliates?.length || 0);
console.log('   Commissions:', wpData.commissions?.length || 0);

// Product to Membership Mapping
const PRODUCT_MAPPING = {
  LIFETIME: [13401, 3840, 6068, 16956, 15234, 17920, 8910],
  TWELVE_MONTH: [8683, 13399, 8915], 
  SIX_MONTH: [13400, 8684, 8914],
  ONE_MONTH: [179],
  THREE_MONTH: [13398]
};

// Get membership ID mapping
let membershipMapping = {};

async function initMembershipMapping() {
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true }
  });
  
  membershipMapping = {
    LIFETIME: memberships.find(m => m.name.includes('Lifetime'))?.id,
    TWELVE_MONTH: memberships.find(m => m.name.includes('12 Bulan'))?.id,
    SIX_MONTH: memberships.find(m => m.name.includes('6 Bulan'))?.id,
    ONE_MONTH: memberships.find(m => m.name.includes('1 Bulan'))?.id,
    THREE_MONTH: memberships.find(m => m.name.includes('3 Bulan'))?.id
  };
  
  console.log('\n📋 Membership mapping:', membershipMapping);
}

// Map product ID to membership type
const getProductMembershipType = (productId) => {
  for (const [type, products] of Object.entries(PRODUCT_MAPPING)) {
    if (products.includes(productId)) return type;
  }
  return null;
};

// Calculate expiry date
const calculateExpiryDate = (orderDate, membershipType) => {
  const date = new Date(orderDate);
  switch (membershipType) {
    case 'LIFETIME': return new Date('2099-12-31');
    case 'TWELVE_MONTH': date.setFullYear(date.getFullYear() + 1); return date;
    case 'SIX_MONTH': date.setMonth(date.getMonth() + 6); return date;
    case 'THREE_MONTH': date.setMonth(date.getMonth() + 3); return date;
    case 'ONE_MONTH': date.setMonth(date.getMonth() + 1); return date;
    default: return new Date();
  }
};

// Build lookup maps
const wpUserById = new Map();
const wpUserByEmail = new Map();
wpData.users?.forEach(u => {
  wpUserById.set(u.ID, u);
  wpUserByEmail.set(u.user_email?.toLowerCase(), u);
});

// Step 1: Sync Users
async function syncUsers() {
  console.log('\n🚀 STEP 1: Syncing Users...');
  
  const users = wpData.users || [];
  let created = 0, skipped = 0, errors = 0;
  
  // Get existing emails
  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  
  // Batch processing
  const BATCH_SIZE = 100;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    
    for (const wpUser of batch) {
      try {
        const email = wpUser.user_email?.toLowerCase();
        if (!email || existingEmails.has(email)) {
          skipped++;
          continue;
        }
        
        // Generate unique username
        let username = wpUser.user_login || email.split('@')[0];
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${wpUser.user_login || email.split('@')[0]}${counter}`;
          counter++;
        }
        
        await prisma.user.create({
          data: {
            email: email,
            username: username,
            name: wpUser.display_name || wpUser.user_nicename || username,
            password: await bcrypt.hash('eksporyuk2024', 10),
            whatsapp: wpUser.phone || '',
            role: 'MEMBER_FREE',
            isActive: true,
            createdAt: new Date(wpUser.user_registered || Date.now()),
            wallet: { create: { balance: 0, balancePending: 0, totalEarnings: 0, totalWithdrawals: 0 } }
          }
        });
        
        existingEmails.add(email);
        created++;
      } catch (error) {
        errors++;
      }
    }
    
    console.log(`   Progress: ${Math.min(i + BATCH_SIZE, users.length)}/${users.length} - Created: ${created}`);
  }
  
  console.log(`✅ Users: ${created} created, ${skipped} skipped, ${errors} errors`);
  return created;
}

// Step 2: Sync Transactions
async function syncTransactions() {
  console.log('\n🚀 STEP 2: Syncing Transactions...');
  
  const orders = wpData.orders || [];
  let created = 0, skipped = 0, errors = 0;
  
  // Get user email map
  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userByEmail = new Map(dbUsers.map(u => [u.email.toLowerCase(), u.id]));
  
  // Get existing transactions (by unique combo)
  const existingTx = await prisma.transaction.findMany({
    select: { amount: true, createdAt: true, userId: true }
  });
  const txKeys = new Set(existingTx.map(t => `${t.userId}-${t.amount}-${new Date(t.createdAt).toISOString().slice(0,10)}`));
  
  const BATCH_SIZE = 100;
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    
    for (const order of batch) {
      try {
        const wpUser = wpUserById.get(order.user_id);
        if (!wpUser) { skipped++; continue; }
        
        const userId = userByEmail.get(wpUser.user_email?.toLowerCase());
        if (!userId) { skipped++; continue; }
        
        const amount = parseFloat(order.grand_total) || 0;
        const orderDate = new Date(order.created_at);
        const txKey = `${userId}-${amount}-${orderDate.toISOString().slice(0,10)}`;
        
        if (txKeys.has(txKey)) { skipped++; continue; }
        
        const statusMap = { 'completed': 'COMPLETED', 'pending': 'PENDING', 'failed': 'FAILED', 'refunded': 'REFUNDED' };
        
        await prisma.transaction.create({
          data: {
            userId: userId,
            type: 'PURCHASE',
            amount: amount,
            currency: 'IDR',
            status: statusMap[order.status] || 'PENDING',
            description: `Purchase: ${order.product_name || 'Product'}`,
            paymentMethod: order.gateway || 'BANK_TRANSFER',
            createdAt: orderDate,
            metadata: { wpOrderId: order.id, productId: order.product_id }
          }
        });
        
        txKeys.add(txKey);
        created++;
      } catch (error) {
        errors++;
      }
    }
    
    console.log(`   Progress: ${Math.min(i + BATCH_SIZE, orders.length)}/${orders.length} - Created: ${created}`);
  }
  
  console.log(`✅ Transactions: ${created} created, ${skipped} skipped, ${errors} errors`);
  return created;
}

// Step 3: Sync Memberships
async function syncMemberships() {
  console.log('\n🚀 STEP 3: Syncing Memberships...');
  
  const orders = (wpData.orders || []).filter(o => o.status === 'completed');
  let created = 0, skipped = 0, errors = 0;
  
  // Get user email map
  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userByEmail = new Map(dbUsers.map(u => [u.email.toLowerCase(), u.id]));
  
  // Get existing memberships
  const existingMemberships = await prisma.userMembership.findMany({
    select: { userId: true, membershipId: true }
  });
  const membershipKeys = new Set(existingMemberships.map(m => `${m.userId}-${m.membershipId}`));
  
  for (const order of orders) {
    try {
      const membershipType = getProductMembershipType(order.product_id);
      if (!membershipType) continue;
      
      const membershipId = membershipMapping[membershipType];
      if (!membershipId) continue;
      
      const wpUser = wpUserById.get(order.user_id);
      if (!wpUser) continue;
      
      const userId = userByEmail.get(wpUser.user_email?.toLowerCase());
      if (!userId) continue;
      
      const membershipKey = `${userId}-${membershipId}`;
      if (membershipKeys.has(membershipKey)) { skipped++; continue; }
      
      const orderDate = new Date(order.created_at);
      const endDate = calculateExpiryDate(orderDate, membershipType);
      const status = endDate > new Date() ? 'ACTIVE' : 'EXPIRED';
      
      await prisma.userMembership.create({
        data: {
          userId: userId,
          membershipId: membershipId,
          status: status,
          startDate: orderDate,
          endDate: endDate,
          createdAt: orderDate
        }
      });
      
      // Update user role
      if (status === 'ACTIVE') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_PREMIUM' }
        });
      }
      
      membershipKeys.add(membershipKey);
      created++;
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Memberships: ${created} created, ${skipped} skipped, ${errors} errors`);
  return created;
}

// Step 4: Sync Commissions
async function syncCommissions() {
  console.log('\n🚀 STEP 4: Syncing Commissions...');
  
  const commissions = wpData.commissions || [];
  let updated = 0, created = 0, errors = 0;
  
  // Get user email map
  const dbUsers = await prisma.user.findMany({ 
    select: { id: true, email: true, username: true },
    include: { affiliateProfile: true, wallet: true }
  });
  const userByEmail = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]));
  
  // Aggregate commissions by user
  const commissionsByUser = new Map();
  
  for (const comm of commissions) {
    const wpUser = wpUserById.get(comm.user_id);
    if (!wpUser) continue;
    
    const email = wpUser.user_email?.toLowerCase();
    if (!email) continue;
    
    const existing = commissionsByUser.get(email) || { totalSales: 0, totalEarnings: 0, conversions: 0 };
    existing.totalSales += parseFloat(comm.grand_total || comm.order_total || 0);
    existing.totalEarnings += parseFloat(comm.commission || 0);
    existing.conversions += 1;
    commissionsByUser.set(email, existing);
  }
  
  console.log(`   Found ${commissionsByUser.size} affiliates with commissions`);
  
  for (const [email, data] of commissionsByUser) {
    try {
      const dbUser = userByEmail.get(email);
      if (!dbUser) { errors++; continue; }
      
      // Create/update affiliate profile
      if (!dbUser.affiliateProfile) {
        await prisma.affiliateProfile.create({
          data: {
            userId: dbUser.id,
            affiliateCode: dbUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
            totalSales: data.totalSales,
            totalEarnings: data.totalEarnings,
            totalConversions: data.conversions,
            isActive: true
          }
        });
        created++;
      } else {
        await prisma.affiliateProfile.update({
          where: { userId: dbUser.id },
          data: {
            totalSales: data.totalSales,
            totalEarnings: data.totalEarnings,
            totalConversions: data.conversions
          }
        });
        updated++;
      }
      
      // Update wallet
      if (dbUser.wallet) {
        await prisma.wallet.update({
          where: { userId: dbUser.id },
          data: {
            balance: data.totalEarnings,
            totalEarnings: data.totalEarnings
          }
        });
      }
      
      // Update user role
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'AFFILIATE' }
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Commissions: ${created} created, ${updated} updated, ${errors} errors`);
  return created + updated;
}

// Final Verification
async function verify() {
  console.log('\n🔍 FINAL VERIFICATION...');
  
  const [users, premium, free, affiliates, transactions, completed, memberships, active, affProfiles] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
    prisma.user.count({ where: { role: 'MEMBER_FREE' } }),
    prisma.user.count({ where: { role: 'AFFILIATE' } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    prisma.userMembership.count(),
    prisma.userMembership.count({ where: { status: 'ACTIVE' } }),
    prisma.affiliateProfile.count()
  ]);
  
  // Get total earnings
  const totalEarnings = await prisma.affiliateProfile.aggregate({
    _sum: { totalEarnings: true, totalSales: true }
  });
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 FINAL STATISTICS:');
  console.log('═'.repeat(50));
  console.log(`Total Users: ${users.toLocaleString()}`);
  console.log(`  - Premium: ${premium.toLocaleString()}`);
  console.log(`  - Free: ${free.toLocaleString()}`);
  console.log(`  - Affiliates: ${affiliates.toLocaleString()}`);
  console.log(`Transactions: ${transactions.toLocaleString()} (${completed.toLocaleString()} completed)`);
  console.log(`Memberships: ${memberships.toLocaleString()} (${active.toLocaleString()} active)`);
  console.log(`Affiliate Profiles: ${affProfiles.toLocaleString()}`);
  console.log(`Total Omset: Rp ${Number(totalEarnings._sum.totalSales || 0).toLocaleString('id-ID')}`);
  console.log(`Total Komisi: Rp ${Number(totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
  console.log('═'.repeat(50));
  
  // Check duplicates
  const dupCheck = await prisma.$queryRaw`SELECT email, COUNT(*) as cnt FROM "User" GROUP BY email HAVING COUNT(*) > 1`;
  if (dupCheck.length > 0) {
    console.log(`⚠️  Found ${dupCheck.length} duplicate emails!`);
  } else {
    console.log('✅ No duplicate emails');
  }
  
  console.log('\n🎉 SYNC COMPLETE!');
}

// Main
async function main() {
  console.log('\n🚀 Starting Real Data Sync from WordPress JSON...');
  console.log('⏰ Start:', new Date().toLocaleString());
  
  try {
    await initMembershipMapping();
    await syncUsers();
    await syncTransactions();
    await syncMemberships();
    await syncCommissions();
    await verify();
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('⏰ End:', new Date().toLocaleString());
  }
}

main();
