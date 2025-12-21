/**
 * FINAL SOLUTION: Import dari SSH tunnel dengan aggressive retry
 * 
 * Strategy: 
 * - Batch size kecil (250 rows)
 * - Fresh MySQL connection setiap batch
 * - Auto-retry jika koneksi putus
 * - Skip batch yang sudah diimport
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Import product mapping
const { getCommissionForProduct, getMembershipForProduct } = require('./scripts/migration/product-membership-mapping.js');

// MySQL config
const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'aziz_member.eksporyuk.com',
  password: 'E%ds(xRh3T]AA|Qh',
  database: 'aziz_member.eksporyuk.com',
  connectTimeout: 60000,
};

async function getMySQLConnection() {
  return await mysql.createConnection(MYSQL_CONFIG);
}

// Check if SSH tunnel is alive
async function ensureSSHTunnel() {
  try {
    const { stdout } = await execAsync('lsof -i :3307 | grep ssh | wc -l');
    const count = parseInt(stdout.trim());
    if (count === 0) {
      console.log('⚠️  SSH tunnel not detected, starting...');
      // Start tunnel in background
      exec('/usr/bin/expect -f /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/ssh-tunnel-expect.sh &');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    }
  } catch (e) {
    console.warn('Could not check SSH tunnel:', e.message);
  }
}

async function importTransactionsWithRetry() {
  console.log('\n💰 IMPORTING TRANSACTIONS (WITH RETRY)');
  console.log('='.repeat(60));
  
  await ensureSSHTunnel();
  
  // Get total
  let conn = await getMySQLConnection();
  const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM wp_sejolisa_orders WHERE deleted_at IS NULL');
  const totalOrders = countResult[0].total;
  await conn.end();
  
  console.log(`📊 Total orders: ${totalOrders.toLocaleString()}`);
  
  // Load users
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  
  let created = 0, updated = 0, errors = 0, skipped = 0;
  const BATCH_SIZE = 250;
  let offset = 0;
  
  while (offset < totalOrders) {
    const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
    console.log(`\n📦 Batch ${batchNum}: Rows ${offset + 1}-${Math.min(offset + BATCH_SIZE, totalOrders)}`);
    
    let retries = 0;
    const MAX_RETRIES = 3;
    let success = false;
    
    while (!success && retries < MAX_RETRIES) {
      try {
        // Ensure tunnel before each batch
        await ensureSSHTunnel();
        
        // Fresh connection
        conn = await getMySQLConnection();
        
        const [orders] = await conn.execute(`
          SELECT 
            o.ID as order_id,
            o.created_at as order_date,
            o.status,
            o.user_id,
            o.product_id,
            o.affiliate_id,
            o.grand_total,
            u.user_email,
            u.display_name as user_name,
            p.post_title as product_name
          FROM wp_sejolisa_orders o
          LEFT JOIN wp_users u ON o.user_id = u.ID
          LEFT JOIN wp_posts p ON o.product_id = p.ID
          WHERE o.deleted_at IS NULL
          ORDER BY o.ID
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        `);
        
        await conn.end();
        
        // Process orders
        for (const order of orders) {
          try {
            if (!order.user_email) { skipped++; continue; }
            
            const userId = emailToUserId.get(order.user_email.toLowerCase());
            if (!userId) { skipped++; continue; }
            
            const amount = parseFloat(order.grand_total || 0);
            const productId = parseInt(order.product_id || 0);
            const affiliateId = parseInt(order.affiliate_id || 0);
            const flatCommission = affiliateId > 0 ? getCommissionForProduct(productId) : 0;
            
            let txStatus = 'PENDING';
            if (order.status === 'completed') txStatus = 'SUCCESS';
            else if (order.status === 'cancelled') txStatus = 'FAILED';
            else if (order.status === 'refunded') txStatus = 'REFUNDED';
            
            const externalId = `sejoli-mysql-${order.order_id}`;
            const existing = await prisma.transaction.findUnique({ where: { externalId } });
            
            if (!existing) {
              await prisma.transaction.create({
                data: {
                  externalId,
                  userId,
                  amount,
                  status: txStatus,
                  customerName: order.user_name,
                  customerEmail: order.user_email,
                  description: order.product_name || 'Produk Sejoli',
                  type: 'PRODUCT',
                  paymentProvider: 'SEJOLI',
                  paymentMethod: 'MANUAL',
                  affiliateShare: flatCommission,
                  invoiceNumber: `INV${String(order.order_id).padStart(5, '0')}`,
                  metadata: { sejoliOrderId: order.order_id, sejoliProductId: productId },
                  createdAt: new Date(order.order_date),
                },
              });
              created++;
            } else {
              updated++;
            }
          } catch (orderError) {
            errors++;
            if (errors < 3) console.error(`   ❌ Order ${order.order_id}:`, orderError.message);
          }
        }
        
        success = true;
        console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
        
      } catch (batchError) {
        retries++;
        console.error(`   ⚠️  Batch error (retry ${retries}/${MAX_RETRIES}):`, batchError.message);
        
        if (retries < MAX_RETRIES) {
          console.log(`   ⏳ Waiting 5s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error(`   ❌ Batch ${batchNum} FAILED after ${MAX_RETRIES} retries. Skipping...`);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`\n✅ DONE! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function main() {
  try {
    await importTransactionsWithRetry();
  } catch (error) {
    console.error('FATAL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
