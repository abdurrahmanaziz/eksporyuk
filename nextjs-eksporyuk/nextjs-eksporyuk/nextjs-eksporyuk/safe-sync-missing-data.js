/**
 * SAFE SYNC: Import Missing Sejoli Data to Next.js Database
 * - Tidak menghapus data existing
 * - Tidak membuat duplikat
 * - Hanya menambah data yang belum ada
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// Load Sejoli export data
const sejoliData = JSON.parse(fs.readFileSync('sejoli-sales-1766146821365.json', 'utf8'));

// Product to commission mapping
const productCommissionMap = {
  // LIFETIME MEMBERSHIP
  28: 0, 93: 200000, 179: 250000, 1529: 200000, 3840: 300000,
  4684: 200000, 6068: 0, 6810: 0, 11207: 0, 13401: 325000,
  15234: 0, 16956: 0, 17920: 250000, 19296: 0, 20852: 280000,
  // 12 BULAN
  8683: 300000, 13399: 250000,
  // 6 BULAN
  8684: 250000, 13400: 200000,
  // RENEWAL (no commission)
  8910: 0, 8914: 0, 8915: 0,
  // WEBINAR/EVENT
  397: 0, 488: 0, 12994: 0, 13039: 0, 13045: 0, 16130: 0,
  16860: 50000, 16963: 0, 17227: 50000, 17322: 0, 17767: 0,
  18358: 0, 18528: 20000, 18705: 0, 18893: 0, 19042: 50000,
  20130: 50000, 20336: 0, 21476: 50000,
  // TOOLS
  2910: 0, 3764: 0, 4220: 85000, 8686: 0,
  // JASA
  5928: 150000, 5932: 0, 5935: 0, 16581: 0, 16587: 0, 16592: 0,
  // FREE
  300: 0,
  // LAINNYA
  16826: 0
};

async function safeSyncData() {
  console.log('\n=== SAFE SYNC: Import Missing Data ===\n');
  console.log('Date:', new Date().toISOString());
  console.log('');

  try {
    // 1. Get existing data counts
    console.log('📊 CURRENT DATABASE STATE:');
    const existingUsers = await prisma.user.count();
    const existingTx = await prisma.transaction.count();
    const existingSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    
    console.log(`- Users: ${existingUsers}`);
    console.log(`- Transactions: ${existingTx}`);
    console.log(`- SUCCESS: ${existingSuccess}`);

    // 2. Get all existing sejoli_order_ids to avoid duplicates
    console.log('\n🔍 CHECKING FOR DUPLICATES...');
    
    const existingTxWithMeta = await prisma.transaction.findMany({
      select: { id: true, metadata: true }
    });
    
    const existingSejoliIds = new Set();
    existingTxWithMeta.forEach(tx => {
      const meta = tx.metadata;
      if (meta && typeof meta === 'object') {
        if (meta.sejoli_order_id) existingSejoliIds.add(Number(meta.sejoli_order_id));
        if (meta.sejoliOrderId) existingSejoliIds.add(Number(meta.sejoliOrderId));
      }
    });
    console.log(`- Transactions with Sejoli IDs: ${existingSejoliIds.size}`);

    // 3. Get all existing users by email
    const existingUsersByEmail = new Map();
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    allUsers.forEach(u => {
      if (u.email) existingUsersByEmail.set(u.email.toLowerCase(), u.id);
    });
    console.log(`- Users mapped by email: ${existingUsersByEmail.size}`);

    // 4. Find missing orders from Sejoli
    console.log('\n📋 ANALYZING SEJOLI DATA...');
    const completedOrders = sejoliData.filter(o => o.status === 'completed');
    console.log(`- Completed orders in Sejoli: ${completedOrders.length}`);

    const missingOrders = completedOrders.filter(o => !existingSejoliIds.has(Number(o.ID)));
    console.log(`- Orders NOT in database: ${missingOrders.length}`);

    if (missingOrders.length === 0) {
      console.log('\n✅ No missing orders! Database is up to date.');
      return;
    }

    // 5. Preview what will be imported
    console.log('\n📝 PREVIEW OF MISSING ORDERS:');
    const preview = missingOrders.slice(0, 10);
    preview.forEach((o, i) => {
      console.log(`${i+1}. ID:${o.ID} | ${o.user_email || 'NO EMAIL'} | ${o.user_name || 'N/A'} | Rp ${Number(o.grand_total).toLocaleString('id-ID')} | ${o.created_at}`);
    });
    if (missingOrders.length > 10) {
      console.log(`... and ${missingOrders.length - 10} more`);
    }

    // Calculate totals
    const missingRevenue = missingOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
    const missingCommission = missingOrders.reduce((sum, o) => {
      const productId = Number(o.product_id);
      return sum + (productCommissionMap[productId] || 0);
    }, 0);

    console.log(`\n📊 MISSING DATA TOTALS:`);
    console.log(`- Orders: ${missingOrders.length}`);
    console.log(`- Revenue: Rp ${missingRevenue.toLocaleString('id-ID')}`);
    console.log(`- Commission: Rp ${missingCommission.toLocaleString('id-ID')}`);

    // 6. Import missing orders
    console.log('\n🚀 IMPORTING MISSING DATA...');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    let usersCreated = 0;

    for (const order of missingOrders) {
      try {
        // Correct field names from Sejoli data structure
        const email = (order.user_email || '').toLowerCase().trim();
        const userName = order.user_name || email.split('@')[0];
        
        // Skip if no email
        if (!email) {
          skipped++;
          continue;
        }

        // Get or create user
        let userId = existingUsersByEmail.get(email);
        
        if (!userId) {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: email,
              name: userName,
              password: '',
              role: 'MEMBER_FREE',
            }
          });
          userId = newUser.id;
          existingUsersByEmail.set(email, userId);
          usersCreated++;
        }

        // Map status
        const statusMap = {
          'completed': 'SUCCESS',
          'cancelled': 'FAILED',
          'refunded': 'FAILED',
          'on-hold': 'PENDING',
          'payment-confirm': 'PENDING'
        };

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId: userId,
            type: 'MEMBERSHIP',
            amount: Number(order.grand_total) || 0,
            status: statusMap[order.status] || 'PENDING',
            invoiceNumber: `INV${order.ID}`,
            paymentMethod: order.payment_gateway || 'MANUAL',
            metadata: {
              sejoli_order_id: Number(order.ID),
              product_id: Number(order.product_id),
              product_name: order.product_name,
              affiliate_id: order.affiliate_id ? Number(order.affiliate_id) : null,
              affiliate_name: order.affiliate_name || null,
              coupon_code: order.coupon_code || null,
              source: 'sejoli_sync',
              synced_at: new Date().toISOString()
            },
            createdAt: new Date(order.created_at)
          }
        });

        created++;
        
        if (created % 100 === 0) {
          console.log(`  Imported ${created}/${missingOrders.length}...`);
        }

      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`  Error for order ${order.ID}:`, err.message);
        }
      }
    }

    console.log('\n✅ IMPORT COMPLETE:');
    console.log(`- Transactions created: ${created}`);
    console.log(`- Users created: ${usersCreated}`);
    console.log(`- Skipped (no email): ${skipped}`);
    console.log(`- Errors: ${errors}`);

    // 7. Verify new counts
    console.log('\n📊 FINAL DATABASE STATE:');
    const finalUsers = await prisma.user.count();
    const finalTx = await prisma.transaction.count();
    const finalSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    
    console.log(`- Users: ${existingUsers} → ${finalUsers} (+${finalUsers - existingUsers})`);
    console.log(`- Transactions: ${existingTx} → ${finalTx} (+${finalTx - existingTx})`);
    console.log(`- SUCCESS: ${existingSuccess} → ${finalSuccess} (+${finalSuccess - existingSuccess})`);

    // 8. Calculate new totals
    const newRevenue = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    console.log(`- Total Revenue: Rp ${Number(newRevenue._sum.amount || 0).toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run sync
safeSyncData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
