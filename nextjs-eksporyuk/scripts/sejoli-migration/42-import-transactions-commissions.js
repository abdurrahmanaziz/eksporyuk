/**
 * Import Transactions & Commissions from Sejoli
 * 
 * Data Source:
 * - orders_export.tsv: 12,896 completed orders
 * - commissions_export.tsv: 16,989 affiliate commissions
 * - users_export.tsv: 18,753 users
 * 
 * PRD Requirements:
 * - Komisi FLAT (tidak dihitung ulang)
 * - Data dari Sejoli saja
 * - Status: locked/paid/reversed
 * 
 * Target Validation (PRD):
 * - Sales: 12,894
 * - Omset: Rp 4,172,579,962
 * - Komisi: Rp 1,260,896,000
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const EXPORTS_DIR = path.join(__dirname, 'exports');

// Read TSV file
function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

// Parse orders: order_id, created_at, product_id, product_name, user_id, user_email, affiliate_id, grand_total, status, payment_gateway
function parseOrders() {
  const data = readTSV('orders_export.tsv');
  return data.map(row => ({
    orderId: parseInt(row[0]),
    createdAt: new Date(row[1]),
    productId: parseInt(row[2]),
    productName: row[3]?.trim() || 'Unknown',
    userId: parseInt(row[4]),
    userEmail: row[5]?.trim() || '',
    affiliateId: parseInt(row[6]) || 0,
    grandTotal: parseFloat(row[7]) || 0,
    status: row[8]?.trim() || 'completed',
    paymentGateway: row[9]?.trim() || 'manual'
  }));
}

// Parse commissions: ID, created_at, order_id, affiliate_id, product_id, tier, commission, status, paid_status
function parseCommissions() {
  const data = readTSV('commissions_export.tsv');
  return data.map(row => ({
    id: parseInt(row[0]),
    createdAt: new Date(row[1]),
    orderId: parseInt(row[2]),
    affiliateId: parseInt(row[3]),
    productId: parseInt(row[4]),
    tier: parseInt(row[5]) || 1,
    commission: parseFloat(row[6]) || 0,
    status: row[7]?.trim() || 'pending',
    paidStatus: parseInt(row[8]) || 0
  }));
}

// Parse users: ID, user_login, user_email, display_name, user_registered
function parseUsers() {
  const data = readTSV('users_export.tsv');
  return data.map(row => ({
    wpUserId: parseInt(row[0]),
    username: row[1]?.trim() || '',
    email: row[2]?.trim() || '',
    displayName: row[3]?.trim() || '',
    registeredAt: new Date(row[4])
  }));
}

async function main() {
  console.log('==========================================');
  console.log('IMPORT TRANSACTIONS & COMMISSIONS');
  console.log('==========================================\n');

  // 1. Parse all data
  console.log('📂 Parsing exported data...');
  const orders = parseOrders();
  const commissions = parseCommissions();
  const users = parseUsers();
  
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Commissions: ${commissions.length}`);
  console.log(`   Users: ${users.length}`);

  // 2. Create commission lookup by order_id
  const commissionByOrder = {};
  for (const c of commissions) {
    if (!commissionByOrder[c.orderId]) {
      commissionByOrder[c.orderId] = [];
    }
    commissionByOrder[c.orderId].push(c);
  }

  // 3. Create user lookup by wpUserId
  const userByWpId = {};
  for (const u of users) {
    userByWpId[u.wpUserId] = u;
  }

  // 4. Get existing users from database by email
  console.log('\n📊 Loading existing users from database...');
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, username: true }
  });
  const userByEmail = {};
  for (const u of existingUsers) {
    if (u.email) userByEmail[u.email.toLowerCase()] = u;
  }
  console.log(`   Found ${existingUsers.length} users in database`);

  // 5. Get or create products based on unique product names
  console.log('\n📦 Creating/updating products...');
  const productMap = {}; // sejoli_product_id -> eksporyuk_product_id
  const uniqueProducts = {};
  
  for (const order of orders) {
    if (!uniqueProducts[order.productId]) {
      uniqueProducts[order.productId] = {
        sejolId: order.productId,
        name: order.productName,
        totalOrders: 0,
        totalRevenue: 0
      };
    }
    uniqueProducts[order.productId].totalOrders++;
    uniqueProducts[order.productId].totalRevenue += order.grandTotal;
  }

  // Find or create products
  let productsCreated = 0;
  let productsExisting = 0;

  for (const [sejoliId, product] of Object.entries(uniqueProducts)) {
    // Check if product exists by slug
    const slug = `sejoli-${sejoliId}`;
    let existingProduct = await prisma.product.findFirst({
      where: { slug }
    });

    if (!existingProduct) {
      // Check by name
      existingProduct = await prisma.product.findFirst({
        where: { name: product.name }
      });
    }

    if (existingProduct) {
      productMap[sejoliId] = existingProduct.id;
      productsExisting++;
    } else {
      // Create new product
      const newProduct = await prisma.product.create({
        data: {
          creatorId: 'system',
          name: product.name,
          slug: slug,
          description: `Produk dari Sejoli (ID: ${sejoliId})`,
          price: product.totalRevenue / product.totalOrders, // Average price
          productType: 'DIGITAL',
          productStatus: 'PUBLISHED',
          commissionType: 'FLAT',
          affiliateCommissionRate: 0, // Will be from commission data
          isActive: true
        }
      });
      productMap[sejoliId] = newProduct.id;
      productsCreated++;
    }
  }
  console.log(`   Products created: ${productsCreated}`);
  console.log(`   Products existing: ${productsExisting}`);

  // 6. Import transactions
  console.log('\n💳 Importing transactions...');
  
  let transactionsCreated = 0;
  let transactionsSkipped = 0;
  let totalOmset = 0;
  let totalKomisi = 0;
  let conversionsCreated = 0;
  
  // Create a default user for unknown users
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@eksporyuk.com' }
  });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@eksporyuk.com',
        username: 'system',
        name: 'System User',
        password: 'not-for-login',
        role: 'ADMIN'
      }
    });
  }

  // Process in batches
  const BATCH_SIZE = 100;
  const batches = [];
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    batches.push(orders.slice(i, i + BATCH_SIZE));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    for (const order of batch) {
      // Find user
      let userId = systemUser.id;
      const wpUser = userByWpId[order.userId];
      if (wpUser && wpUser.email) {
        const dbUser = userByEmail[wpUser.email.toLowerCase()];
        if (dbUser) {
          userId = dbUser.id;
        }
      }

      // Find affiliate user
      let affiliateId = null;
      if (order.affiliateId > 0) {
        const wpAffiliate = userByWpId[order.affiliateId];
        if (wpAffiliate && wpAffiliate.email) {
          const dbAffiliate = userByEmail[wpAffiliate.email.toLowerCase()];
          if (dbAffiliate) {
            affiliateId = dbAffiliate.id;
          }
        }
      }

      // Check if transaction already exists
      const externalId = `sejoli-${order.orderId}`;
      const existing = await prisma.transaction.findFirst({
        where: { externalId }
      });

      if (existing) {
        transactionsSkipped++;
        continue;
      }

      // Get commission for this order
      const orderCommissions = commissionByOrder[order.orderId] || [];
      let affiliateCommission = 0;
      let commissionStatus = 'locked';
      
      for (const c of orderCommissions) {
        // Only count paid/added commissions (not cancelled)
        if (c.status === 'added' || c.paidStatus === 1) {
          affiliateCommission += c.commission;
          if (c.paidStatus === 1) {
            commissionStatus = 'paid';
          }
        } else if (c.status === 'cancelled') {
          commissionStatus = 'reversed';
        }
      }

      // Create transaction
      const productId = productMap[order.productId];
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: 'PRODUCT',
          status: 'SUCCESS',
          amount: order.grandTotal,
          customerEmail: order.userEmail,
          productId,
          paymentMethod: order.paymentGateway,
          paymentProvider: 'sejoli',
          externalId,
          affiliateId,
          affiliateShare: affiliateCommission,
          paidAt: order.createdAt,
          createdAt: order.createdAt,
          metadata: {
            sejoliOrderId: order.orderId,
            sejoliProductId: order.productId,
            sejoliAffiliateId: order.affiliateId,
            source: 'sejoli_migration'
          }
        }
      });

      transactionsCreated++;
      totalOmset += order.grandTotal;

      // Create AffiliateConversion if there's affiliate commission
      if (affiliateId && affiliateCommission > 0) {
        await prisma.affiliateConversion.create({
          data: {
            affiliateId,
            transactionId: transaction.id,
            commissionAmount: affiliateCommission,
            commissionRate: 0, // FLAT, not percentage
            paidOut: commissionStatus === 'paid',
            paidOutAt: commissionStatus === 'paid' ? order.createdAt : null,
            createdAt: order.createdAt
          }
        });
        conversionsCreated++;
        totalKomisi += affiliateCommission;
      }
    }

    // Progress update
    const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
    process.stdout.write(`\r   Progress: ${progress}% (${transactionsCreated} created, ${transactionsSkipped} skipped)`);
  }

  console.log('\n');

  // 7. Summary
  console.log('\n==========================================');
  console.log('MIGRATION SUMMARY');
  console.log('==========================================');
  console.log(`Transactions Created: ${transactionsCreated}`);
  console.log(`Transactions Skipped: ${transactionsSkipped}`);
  console.log(`Affiliate Conversions: ${conversionsCreated}`);
  console.log(`Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`Total Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);
  
  console.log('\n==========================================');
  console.log('VALIDATION vs PRD TARGET');
  console.log('==========================================');
  console.log('PRD Target:');
  console.log('  - Sales: 12,894');
  console.log('  - Omset: Rp 4,172,579,962');
  console.log('  - Komisi: Rp 1,260,896,000');
  console.log('\nActual:');
  console.log(`  - Sales: ${transactionsCreated}`);
  console.log(`  - Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`  - Komisi: Rp ${totalKomisi.toLocaleString('id-ID')}`);

  await prisma.$disconnect();
}

main().catch(console.error);
