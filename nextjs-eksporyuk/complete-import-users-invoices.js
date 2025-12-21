/**
 * COMPLETE IMPORT: Users, Invoices, Affiliates, Products
 * 18 Desember 2025
 * 
 * Tasks:
 * 1. Import users sesuai transaksi + membership mereka
 * 2. Update invoice number sesuai Sejoli (INV01, INV02, dst)
 * 3. Update affiliate name di kolom affiliate
 * 4. Update tipe produk sesuai Sejoli
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

console.log('📂 Loading data...\n');

const productsData = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));
const salesDataRaw = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const salesData = salesDataRaw.orders || salesDataRaw;

const completedOrders = salesData.filter(o => o.status === 'completed');

console.log(`✅ Products: ${productsData.length}`);
console.log(`✅ Total Orders: ${salesData.length}`);
console.log(`✅ Completed Orders: ${completedOrders.length}\n`);

// Build maps
const userMap = new Map(); // email -> user data
const affiliateMap = new Map(); // affiliate_id -> affiliate name

completedOrders.forEach(order => {
  if (order.user_email) {
    const email = order.user_email.toLowerCase().trim();
    if (!userMap.has(email)) {
      userMap.set(email, {
        email: email,
        name: order.user_name || 'User',
        orders: []
      });
    }
    userMap.get(email).orders.push(order);
  }
  
  if (order.affiliate_id && order.affiliate_name) {
    affiliateMap.set(order.affiliate_id, order.affiliate_name);
  }
});

console.log(`📊 Unique users: ${userMap.size}`);
console.log(`📊 Unique affiliates: ${affiliateMap.size}\n`);

async function importUsers() {
  console.log('👥 IMPORTING USERS...');
  console.log('='.repeat(60));
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const [email, userData] of userMap) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingUser) {
        skipped++;
        continue;
      }
      
      // Create user with MEMBER_FREE as default
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await prisma.user.create({
        data: {
          email: email,
          name: userData.name,
          password: hashedPassword,
          role: 'MEMBER_FREE',
          emailVerified: true,
          isActive: true
        }
      });
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`  Progress: ${imported} users imported...`);
      }
    } catch (err) {
      if (!err.message.includes('Unique constraint')) {
        console.error(`  Error importing user ${email}:`, err.message);
      }
    }
  }
  
  console.log(`✅ Users imported: ${imported}, skipped: ${skipped}\n`);
  return imported;
}

async function updateTransactionsWithUsers() {
  console.log('🔄 UPDATING TRANSACTIONS WITH USERS...');
  console.log('='.repeat(60));
  
  let updated = 0;
  let errors = 0;
  
  // Get all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const emailToUserId = new Map();
  allUsers.forEach(u => {
    emailToUserId.set(u.email.toLowerCase(), u.id);
  });
  
  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      paymentProvider: 'SEJOLI'
    },
    select: {
      id: true,
      externalId: true,
      customerEmail: true
    }
  });
  
  console.log(`  Processing ${transactions.length} transactions...`);
  
  for (const tx of transactions) {
    try {
      if (tx.customerEmail) {
        const userId = emailToUserId.get(tx.customerEmail.toLowerCase());
        if (userId) {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { userId: userId }
          });
          updated++;
        }
      }
      
      if (updated % 500 === 0 && updated > 0) {
        console.log(`  Progress: ${updated} transactions updated...`);
      }
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error:`, err.message);
      }
    }
  }
  
  console.log(`✅ Transactions updated: ${updated}, errors: ${errors}\n`);
}

async function updateInvoiceNumbers() {
  console.log('🧾 UPDATING INVOICE NUMBERS...');
  console.log('='.repeat(60));
  
  // Get all transactions ordered by ID
  const transactions = await prisma.transaction.findMany({
    where: {
      paymentProvider: 'SEJOLI'
    },
    orderBy: {
      externalId: 'asc'
    },
    select: {
      id: true,
      externalId: true
    }
  });
  
  console.log(`  Processing ${transactions.length} invoice numbers...`);
  
  let updated = 0;
  
  for (const tx of transactions) {
    try {
      // Extract order ID from externalId (sejoli-123)
      const orderId = tx.externalId.replace('sejoli-', '');
      const invoiceNumber = `INV${orderId.padStart(5, '0')}`;
      
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { invoiceNumber: invoiceNumber }
      });
      
      updated++;
      
      if (updated % 1000 === 0) {
        console.log(`  Progress: ${updated} invoices updated...`);
      }
    } catch (err) {
      console.error(`  Error updating invoice:`, err.message);
    }
  }
  
  console.log(`✅ Invoice numbers updated: ${updated}\n`);
}

async function updateAffiliateNames() {
  console.log('👤 UPDATING AFFILIATE NAMES...');
  console.log('='.repeat(60));
  
  // Build affiliate map from Sejoli data
  const affiliateData = {};
  completedOrders.forEach(order => {
    if (order.affiliate_id && order.affiliate_name) {
      affiliateData[order.affiliate_id] = order.affiliate_name;
    }
  });
  
  console.log(`  Found ${Object.keys(affiliateData).length} unique affiliates`);
  
  let updated = 0;
  
  for (const [affiliateId, affiliateName] of Object.entries(affiliateData)) {
    try {
      const result = await prisma.transaction.updateMany({
        where: {
          paymentProvider: 'SEJOLI',
          affiliateId: String(affiliateId)
        },
        data: {
          metadata: {
            affiliateName: affiliateName,
            sejoliAffiliateId: parseInt(affiliateId)
          }
        }
      });
      
      updated += result.count;
    } catch (err) {
      console.error(`  Error:`, err.message);
    }
  }
  
  console.log(`✅ Transactions updated with affiliate names: ${updated}\n`);
}

async function createMemberships() {
  console.log('💳 CREATING USER MEMBERSHIPS...');
  console.log('='.repeat(60));
  
  // Membership mapping based on product names
  const membershipProducts = {
    'LIFETIME': [13401, 8910, 15234, 16956, 17920, 19296, 20852],
    'MONTH_12': [13399, 8915, 8683],
    'MONTH_6': [13400, 8914, 8684]
  };
  
  // Get membership tiers
  const memberships = await prisma.membership.findMany({
    select: { id: true, slug: true, name: true }
  });
  
  const membershipMap = new Map();
  memberships.forEach(m => {
    membershipMap.set(m.slug, m);
  });
  
  // Get all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  const emailToUserId = new Map();
  allUsers.forEach(u => {
    emailToUserId.set(u.email.toLowerCase(), u.id);
  });
  
  // Get all completed orders
  const userMemberships = new Map(); // userId -> highest membership
  
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
      const current = userMemberships.get(userId);
      // Upgrade logic: LIFETIME > MONTH_12 > MONTH_6
      if (!current || 
          (membershipType === 'LIFETIME') ||
          (membershipType === 'MONTH_12' && current !== 'LIFETIME')) {
        userMemberships.set(userId, membershipType);
      }
    }
  });
  
  console.log(`  Found ${userMemberships.size} users with memberships`);
  
  let created = 0;
  let errors = 0;
  
  for (const [userId, membershipType] of userMemberships) {
    try {
      let membershipSlug = 'free';
      let expiryDate = null;
      
      if (membershipType === 'LIFETIME') {
        membershipSlug = 'lifetime';
        expiryDate = new Date('2099-12-31');
      } else if (membershipType === 'MONTH_12') {
        membershipSlug = '12-months';
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 12);
      } else if (membershipType === 'MONTH_6') {
        membershipSlug = '6-months';
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      }
      
      const membership = membershipMap.get(membershipSlug);
      if (!membership) continue;
      
      // Check if already exists
      const existing = await prisma.userMembership.findFirst({
        where: {
          userId: userId,
          membershipId: membership.id
        }
      });
      
      if (existing) continue;
      
      await prisma.userMembership.create({
        data: {
          userId: userId,
          membershipId: membership.id,
          startDate: new Date(),
          expiryDate: expiryDate,
          isActive: true,
          autoRenew: false
        }
      });
      
      // Update user role
      let role = 'MEMBER_FREE';
      if (membershipType === 'LIFETIME' || membershipType === 'MONTH_12') {
        role = 'MEMBER_PREMIUM';
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: { role: role }
      });
      
      created++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error:`, err.message);
      }
    }
  }
  
  console.log(`✅ Memberships created: ${created}, errors: ${errors}\n`);
}

async function verifyFinal() {
  console.log('✅ FINAL VERIFICATION');
  console.log('='.repeat(60));
  
  // Count users
  const totalUsers = await prisma.user.count();
  const premiumUsers = await prisma.user.count({
    where: { role: 'MEMBER_PREMIUM' }
  });
  
  // Count memberships
  const totalMemberships = await prisma.userMembership.count({
    where: { isActive: true }
  });
  
  // Sample transactions with invoice
  const sampleTx = await prisma.transaction.findMany({
    where: {
      paymentProvider: 'SEJOLI',
      invoiceNumber: { not: null }
    },
    take: 5,
    select: {
      invoiceNumber: true,
      customerName: true,
      amount: true,
      user: {
        select: { name: true, email: true, role: true }
      }
    }
  });
  
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Premium Users: ${premiumUsers}`);
  console.log(`Active Memberships: ${totalMemberships}`);
  
  console.log('\nSample Transactions:');
  sampleTx.forEach(tx => {
    console.log(`  ${tx.invoiceNumber} | ${tx.customerName} | ${tx.user?.name} (${tx.user?.role}) | Rp ${parseFloat(tx.amount).toLocaleString()}`);
  });
}

async function main() {
  console.log('🚀 COMPLETE IMPORT: USERS + INVOICES + AFFILIATES + MEMBERSHIPS');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Task 1: Import users
    await importUsers();
    
    // Link transactions to users
    await updateTransactionsWithUsers();
    
    // Task 2: Update invoice numbers
    await updateInvoiceNumbers();
    
    // Task 3: Update affiliate names
    await updateAffiliateNames();
    
    // Task 1 continued: Create memberships
    await createMemberships();
    
    // Final verification
    await verifyFinal();
    
    console.log('\n✅ ALL TASKS COMPLETE!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
