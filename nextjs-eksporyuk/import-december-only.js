import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

console.log('🎄 IMPORTING DECEMBER 2025 COMPLETED ORDERS\n');

// Load TSV
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
const orderLines = ordersRaw.split('\n').slice(1).filter(l => l.trim());

const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8');
const userLines = usersRaw.split('\n').slice(1).filter(l => l.trim());

// Build user mapping
const sejoliUserToEmail = new Map();
const emailToUserId = new Map();

for (const line of userLines) {
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const sejoliUserId = parts[0];
  const email = parts[2]?.trim().toLowerCase();
  if (email) sejoliUserToEmail.set(sejoliUserId, email);
}

// Get all users from DB
const dbUsers = await prisma.user.findMany({ 
  select: { id: true, email: true } 
});

for (const user of dbUsers) {
  if (user.email) {
    emailToUserId.set(user.email.toLowerCase(), user.id);
  }
}

console.log(`📊 Mappings ready:`);
console.log(`  - ${sejoliUserToEmail.size} Sejoli users`);
console.log(`  - ${emailToUserId.size} DB users\n`);

// Get existing transactions
const existingTx = await prisma.transaction.findMany({
  select: { metadata: true }
});

const existingSejoliIds = new Set(
  existingTx
    .map(t => t.metadata?.sejoliOrderId)
    .filter(id => id)
    .map(id => String(id))
);

console.log(`✅ Existing transactions: ${existingSejoliIds.size}\n`);

// Filter December 2025 completed orders
const decemberOrders = [];

for (const line of orderLines) {
  const parts = line.split('\t');
  if (parts.length < 10) continue;
  
  const orderId = parts[0];
  const productId = parts[1];
  const userId = parts[2];
  const affiliateId = parts[3];
  const amount = parseFloat(parts[6]) || 0;
  const status = parts[7];
  const createdAt = parts[8];
  
  // Only December 2025 completed
  if (!createdAt.startsWith('2025-12')) continue;
  if (status !== 'completed') continue;
  
  // Skip if already exists
  if (existingSejoliIds.has(orderId)) continue;
  
  // Get user email
  const userEmail = sejoliUserToEmail.get(userId);
  if (!userEmail) continue;
  
  const dbUserId = emailToUserId.get(userEmail);
  if (!dbUserId) continue;
  
  decemberOrders.push({
    sejoliOrderId: orderId,
    productId,
    userId: dbUserId,
    affiliateId: affiliateId !== '0' ? affiliateId : null,
    amount,
    status: 'SUCCESS',
    createdAt: new Date(createdAt)
  });
}

console.log(`🎯 December 2025 completed orders to import: ${decemberOrders.length}\n`);

if (decemberOrders.length === 0) {
  console.log('✅ No new orders to import!');
  await prisma.$disconnect();
  process.exit(0);
}

// Import in batches
let imported = 0;
const batchSize = 100;

for (let i = 0; i < decemberOrders.length; i += batchSize) {
  const batch = decemberOrders.slice(i, i + batchSize);
  
  for (const order of batch) {
    try {
      await prisma.transaction.create({
        data: {
          userId: order.userId,
          type: 'MEMBERSHIP_PURCHASE',
          amount: order.amount,
          status: order.status,
          paymentMethod: 'XENDIT',
          createdAt: order.createdAt,
          metadata: {
            sejoliOrderId: order.sejoliOrderId,
            sejoliProductId: order.productId,
            sejoliAffiliateId: order.affiliateId,
            source: 'sejoli_import_december'
          }
        }
      });
      imported++;
    } catch (error) {
      console.log(`⚠️  Skip order ${order.sejoliOrderId}: ${error.message}`);
    }
  }
  
  console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${imported}/${decemberOrders.length} imported`);
}

console.log(`\n🎉 IMPORT COMPLETE!`);
console.log(`  Imported: ${imported} December 2025 transactions`);

// Verify
const decCount = await prisma.transaction.count({
  where: {
    createdAt: {
      gte: new Date('2025-12-01'),
      lt: new Date('2026-01-01')
    },
    status: 'SUCCESS'
  }
});

console.log(`  Total December SUCCESS in DB: ${decCount}`);

await prisma.$disconnect();
