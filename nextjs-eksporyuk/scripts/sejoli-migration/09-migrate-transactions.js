/**
 * Migrate Sejoli Transactions
 * Import orders/transactions from Sejoli to new system
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, 'exports');
const BATCH_SIZE = 100;

async function migrateTransactions() {
  console.log('💰 MIGRATING SEJOLI TRANSACTIONS');
  console.log('=================================\n');

  try {
    // Load orders
    const orders = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_orders.json'), 'utf-8')
    );

    console.log(`📊 Total orders: ${orders.length}\n`);

    // Build user mapping
    const userMapping = {};
    const eksporyukUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    const sejoliUsers = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_users.json'), 'utf-8')
    );

    const emailToEksporyukId = {};
    eksporyukUsers.forEach(u => emailToEksporyukId[u.email] = u.id);

    sejoliUsers.forEach(su => {
      if (su.user_email && emailToEksporyukId[su.user_email]) {
        userMapping[su.ID] = emailToEksporyukId[su.user_email];
      }
    });

    console.log(`📊 User mapping: ${Object.keys(userMapping).length} users\n`);

    // Status mapping
    const statusMap = {
      'on-hold': 'PENDING',
      'pending': 'PENDING',
      'processing': 'PENDING',
      'completed': 'COMPLETED',
      'complete': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'FAILED',
      'refunded': 'REFUNDED',
    };

    // Payment method mapping
    const paymentMethodMap = {
      'bank_transfer': 'BANK_TRANSFER',
      'manual': 'BANK_TRANSFER',
      'xendit': 'VIRTUAL_ACCOUNT',
      'duitku': 'VIRTUAL_ACCOUNT',
      'tripay': 'VIRTUAL_ACCOUNT',
      'bca': 'BANK_TRANSFER',
      'bni': 'BANK_TRANSFER',
      'bri': 'BANK_TRANSFER',
      'mandiri': 'BANK_TRANSFER',
    };

    let imported = 0;
    let skipped = 0;

    // Import in batches
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, orders.length)} of ${orders.length})`);

      for (const order of batch) {
        try {
          // Skip if user not found
          if (!order.user_id || !userMapping[order.user_id]) {
            skipped++;
            continue;
          }

          const userId = userMapping[order.user_id];
          const amount = parseFloat(order.grand_total || order.total || 0);
          const status = statusMap[order.status?.toLowerCase()] || 'PENDING';
          const paymentGateway = order.payment_gateway?.toLowerCase() || 'manual';
          const paymentMethod = paymentMethodMap[paymentGateway] || 'BANK_TRANSFER';

          // Create transaction
          await prisma.transaction.create({
            data: {
              userId: userId,
              amount: amount,
              type: 'MEMBERSHIP_PURCHASE',
              status: status,
              paymentMethod: paymentMethod,
              paymentGateway: paymentGateway.toUpperCase(),
              description: `Migrated from Sejoli - Order #${order.ID}`,
              metadata: {
                sejoliOrderId: order.ID,
                sejoliProductId: order.product_id,
                orderVia: order.order_via,
              },
              createdAt: new Date(order.created_at),
            }
          });

          imported++;

          if (imported % 10 === 0) {
            process.stdout.write(`  ✅ ${imported} imported, ${skipped} skipped\r`);
          }

        } catch (error) {
          console.error(`  ❌ Order ${order.ID}: ${error.message}`);
          skipped++;
        }
      }

      console.log(`  ✅ Batch complete: ${imported} imported, ${skipped} skipped`);
    }

    // Summary
    const finalCounts = {
      total: await prisma.transaction.count(),
      completed: await prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      pending: await prisma.transaction.count({ where: { status: 'PENDING' } }),
      failed: await prisma.transaction.count({ where: { status: 'FAILED' } }),
    };

    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    });

    console.log('\n\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total transactions: ${finalCounts.total}`);
    console.log(`   - Completed: ${finalCounts.completed}`);
    console.log(`   - Pending: ${finalCounts.pending}`);
    console.log(`   - Failed: ${finalCounts.failed}`);
    console.log(`💰 Total revenue: Rp ${(totalRevenue._sum.amount || 0).toLocaleString('id-ID')}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateTransactions().catch(console.error);
