/**
 * Import Affiliate Profiles dan Conversions dari Sejoli REST API
 * Script ini akan:
 * 1. Fetch data affiliate dari Sejoli REST API
 * 2. Create affiliate profiles untuk setiap affiliate unik
 * 3. Create affiliate conversions untuk transaksi SUCCESS dengan affiliate
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEJOLI_SALES_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';
const SEJOLI_PRODUCTS_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/products';

function generateCUID() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return 'c' + timestamp + randomPart;
}

function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateShortLink(name) {
  // Generate from name, lowercase, remove special chars
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}${random}`;
}

async function main() {
  console.log('🚀 Import Affiliates & Conversions dari Sejoli REST API\n');
  
  // ==========================================
  // STEP 1: Fetch data dari Sejoli API
  // ==========================================
  console.log('📡 Fetching data dari Sejoli API...');
  
  // Fetch products untuk mendapat commission info
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
  const ordersRes = await fetch(SEJOLI_SALES_API);
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders;
  console.log(`  ✓ ${orders.length} orders fetched\n`);
  
  // ==========================================
  // STEP 2: Extract unique affiliates
  // ==========================================
  console.log('👥 Extracting unique affiliates...');
  
  const affiliateMap = {}; // affiliate_id -> { name, email, orders: [], totalCommission }
  let ordersWithAffiliate = 0;
  
  for (const order of orders) {
    if (order.affiliate_id && order.affiliate_name) {
      ordersWithAffiliate++;
      
      if (!affiliateMap[order.affiliate_id]) {
        affiliateMap[order.affiliate_id] = {
          sejoliId: order.affiliate_id,
          name: order.affiliate_name,
          email: null, // Will try to find later
          orders: [],
          totalCommission: 0
        };
      }
      
      // Calculate commission for this order
      const productInfo = productCommissionMap[order.product_id] || {};
      const amount = parseFloat(order.grand_total) || 0;
      let commission = 0;
      
      if (productInfo.commissionAmount) {
        if (productInfo.commissionType === 'PERCENTAGE') {
          commission = (amount * productInfo.commissionAmount) / 100;
        } else {
          commission = productInfo.commissionAmount;
        }
      }
      
      // Only count SUCCESS orders for commission
      if (order.status === 'completed') {
        affiliateMap[order.affiliate_id].totalCommission += commission;
      }
      
      affiliateMap[order.affiliate_id].orders.push({
        orderId: order.ID,
        productId: order.product_id,
        amount: amount,
        commission: commission,
        status: order.status,
        createdAt: order.created_at
      });
    }
  }
  
  const uniqueAffiliates = Object.values(affiliateMap);
  console.log(`  ✓ Orders dengan affiliate: ${ordersWithAffiliate}`);
  console.log(`  ✓ Unique affiliates: ${uniqueAffiliates.length}`);
  
  // Sort by total commission
  uniqueAffiliates.sort((a, b) => b.totalCommission - a.totalCommission);
  
  console.log('\n📊 Top 10 Affiliates by Commission:');
  uniqueAffiliates.slice(0, 10).forEach((aff, i) => {
    console.log(`  ${i+1}. ${aff.name}: Rp ${aff.totalCommission.toLocaleString('id-ID')} (${aff.orders.length} orders)`);
  });
  
  // ==========================================
  // STEP 3: Create/Update Users for Affiliates
  // ==========================================
  console.log('\n👤 Creating/updating affiliate users...');
  
  // Get existing users
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  
  const userByName = {};
  const userByEmail = {};
  for (const u of existingUsers) {
    if (u.name) userByName[u.name.toLowerCase()] = u;
    if (u.email) userByEmail[u.email.toLowerCase()] = u;
  }
  
  const affiliateUserMap = {}; // sejoliAffiliateId -> userId
  let newUsersCreated = 0;
  let existingUsersMatched = 0;
  
  for (const aff of uniqueAffiliates) {
    // Try to find existing user by name
    let user = userByName[aff.name.toLowerCase()];
    
    if (!user) {
      // Generate email from name
      const cleanName = aff.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `affiliate.${cleanName}@eksporyuk.com`;
      
      // Check if email exists
      user = userByEmail[email];
      
      if (!user) {
        // Create new user
        const userId = generateCUID();
        try {
          user = await prisma.user.create({
            data: {
              id: userId,
              name: aff.name,
              email: email,
              password: '$2a$10$defaultpasswordhash',
              role: 'AFFILIATE',
              isActive: true
            }
          });
          newUsersCreated++;
          userByEmail[email] = user;
          userByName[aff.name.toLowerCase()] = user;
        } catch (e) {
          // If duplicate email, add random suffix
          const newEmail = `affiliate.${cleanName}${Date.now() % 10000}@eksporyuk.com`;
          user = await prisma.user.create({
            data: {
              id: userId,
              name: aff.name,
              email: newEmail,
              password: '$2a$10$defaultpasswordhash',
              role: 'AFFILIATE',
              isActive: true
            }
          });
          newUsersCreated++;
        }
      } else {
        existingUsersMatched++;
      }
    } else {
      existingUsersMatched++;
    }
    
    affiliateUserMap[aff.sejoliId] = user.id;
    aff.userId = user.id;
  }
  
  console.log(`  ✓ New users created: ${newUsersCreated}`);
  console.log(`  ✓ Existing users matched: ${existingUsersMatched}`);
  
  // ==========================================
  // STEP 4: Create Affiliate Profiles
  // ==========================================
  console.log('\n🎯 Creating affiliate profiles...');
  
  // Get existing affiliate profiles
  const existingProfiles = await prisma.affiliateProfile.findMany({
    select: { id: true, userId: true, affiliateCode: true }
  });
  
  const profileByUserId = {};
  for (const p of existingProfiles) {
    profileByUserId[p.userId] = p;
  }
  
  let profilesCreated = 0;
  let profilesExisting = 0;
  
  const affiliateProfileMap = {}; // sejoliAffiliateId -> profileId
  
  for (const aff of uniqueAffiliates) {
    let profile = profileByUserId[aff.userId];
    
    if (!profile) {
      // Generate unique affiliate code
      let affiliateCode = generateAffiliateCode();
      let shortLink = generateShortLink(aff.name);
      let attempts = 0;
      
      while (attempts < 10) {
        const existsCode = await prisma.affiliateProfile.findFirst({
          where: { affiliateCode }
        });
        const existsLink = await prisma.affiliateProfile.findFirst({
          where: { shortLink }
        });
        
        if (!existsCode && !existsLink) break;
        
        affiliateCode = generateAffiliateCode();
        shortLink = generateShortLink(aff.name) + attempts;
        attempts++;
      }
      
      try {
        profile = await prisma.affiliateProfile.create({
          data: {
            id: generateCUID(),
            userId: aff.userId,
            affiliateCode: affiliateCode,
            shortLink: shortLink,
            commissionRate: 10, // Default 10%
            applicationStatus: 'APPROVED',
            approvedAt: new Date(),
            totalEarnings: aff.totalCommission,
            totalSales: aff.totalCommission,
            totalConversions: aff.orders.filter(o => o.status === 'completed').length,
            isActive: true
          }
        });
        profilesCreated++;
        profileByUserId[aff.userId] = profile;
      } catch (e) {
        console.log(`  ⚠️ Error creating profile for ${aff.name}: ${e.message.substring(0, 80)}`);
        profilesExisting++;
        continue;
      }
    } else {
      // Update total earnings
      await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: { 
          totalEarnings: aff.totalCommission,
          totalSales: aff.totalCommission,
          totalConversions: aff.orders.filter(o => o.status === 'completed').length
        }
      });
      profilesExisting++;
    }
    
    affiliateProfileMap[aff.sejoliId] = profile.id;
  }
  
  console.log(`  ✓ Profiles created: ${profilesCreated}`);
  console.log(`  ✓ Profiles existing: ${profilesExisting}`);
  
  // ==========================================
  // STEP 5: Create Affiliate Conversions
  // ==========================================
  console.log('\n💰 Creating affiliate conversions...');
  
  // Get all transactions with Sejoli order ID in metadata
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      reference: { startsWith: 'SEJOLI-' }
    },
    select: {
      id: true,
      amount: true,
      reference: true,
      metadata: true,
      createdAt: true
    }
  });
  
  console.log(`  Found ${transactions.length} SUCCESS transactions from Sejoli`);
  
  // Build transaction map by Sejoli order ID
  const txBySejoliId = {};
  for (const tx of transactions) {
    const sejoliId = tx.reference?.replace('SEJOLI-', '');
    if (sejoliId) {
      txBySejoliId[sejoliId] = tx;
    }
  }
  
  // Clear existing conversions
  const deletedConversions = await prisma.affiliateConversion.deleteMany({});
  console.log(`  ✓ Cleared ${deletedConversions.count} existing conversions`);
  
  // Create conversions
  const conversionsToCreate = [];
  let matched = 0;
  let noTx = 0;
  let noProfile = 0;
  
  for (const aff of uniqueAffiliates) {
    const profileId = affiliateProfileMap[aff.sejoliId];
    if (!profileId) {
      noProfile += aff.orders.filter(o => o.status === 'completed').length;
      continue;
    }
    
    for (const order of aff.orders) {
      if (order.status !== 'completed') continue; // Only SUCCESS
      
      const tx = txBySejoliId[order.orderId];
      if (!tx) {
        noTx++;
        continue;
      }
      
      if (order.commission <= 0) continue;
      
      matched++;
      conversionsToCreate.push({
        id: generateCUID(),
        affiliateId: profileId,
        transactionId: tx.id,
        commissionAmount: order.commission,
        commissionRate: (order.commission / Number(tx.amount)) * 100,
        paidOut: false,
        createdAt: tx.createdAt
      });
    }
  }
  
  console.log(`  Matched transactions: ${matched}`);
  console.log(`  No transaction found: ${noTx}`);
  console.log(`  No profile found: ${noProfile}`);
  
  // Insert in batches
  let created = 0;
  for (let i = 0; i < conversionsToCreate.length; i += 500) {
    const batch = conversionsToCreate.slice(i, i + 500);
    try {
      const result = await prisma.affiliateConversion.createMany({
        data: batch,
        skipDuplicates: true
      });
      created += result.count;
    } catch (e) {
      console.log(`  ⚠️ Batch error: ${e.message.substring(0, 100)}`);
      // Try one by one
      for (const item of batch) {
        try {
          await prisma.affiliateConversion.create({ data: item });
          created++;
        } catch (err) {
          // Skip duplicate
        }
      }
    }
  }
  
  console.log(`  ✓ Created ${created} affiliate conversions`);
  
  // ==========================================
  // STEP 6: Verify Results
  // ==========================================
  console.log('\n✅ Verifying results...');
  
  const totalProfiles = await prisma.affiliateProfile.count();
  const totalConversions = await prisma.affiliateConversion.count();
  const totalCommission = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  // Sample data
  const sampleConversions = await prisma.affiliateConversion.findMany({
    take: 5,
    include: {
      affiliate: {
        include: {
          user: { select: { name: true } }
        }
      },
      transaction: {
        select: { id: true, amount: true, invoiceNumber: true }
      }
    }
  });
  
  console.log('\n=== HASIL IMPORT AFFILIATES & CONVERSIONS ===');
  console.log(`Total Affiliate Profiles: ${totalProfiles}`);
  console.log(`Total Conversions: ${totalConversions}`);
  console.log(`Total Commission: Rp ${Number(totalCommission._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
  
  console.log('\n📋 Sample Conversions:');
  sampleConversions.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.affiliate?.user?.name || 'N/A'}`);
    console.log(`     Invoice: ${c.transaction?.invoiceNumber || c.transaction?.id.slice(0,8)}`);
    console.log(`     Amount: Rp ${Number(c.transaction?.amount || 0).toLocaleString('id-ID')}`);
    console.log(`     Commission: Rp ${Number(c.commissionAmount).toLocaleString('id-ID')}`);
  });
  
  await prisma.$disconnect();
  console.log('\n✅ Import selesai!');
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
