import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const FREE_PRODUCTS = [397, 488, 16130, 16963, 17322, 17767, 18358, 18528, 19042, 20130, 21476,
  12994, 13039, 13045, 16860, 17227, 18705, 300, 1529,
  2910, 3764, 4220, 558, 4684, 5928, 5932, 5935, 8686, 
  16581, 16587, 16592, 16826, 18893, 20336, 28, 93];

async function check() {
  console.log('📂 Loading TSV...');
  const tsvData = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const lines = tsvData.split('\n');
  
  const orderToProduct = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;
    const orderId = parseInt(cols[0]);
    const productId = parseInt(cols[1]);
    if (!isNaN(orderId) && !isNaN(productId)) {
      orderToProduct[orderId] = productId;
    }
  }
  
  console.log('📊 Loading transactions...');
  const txs = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { userId: true, metadata: true }
  });
  
  const freeUserIds = new Set();
  for (const tx of txs) {
    const orderId = tx.metadata?.sejoliOrderId;
    if (!orderId) continue;
    
    const productId = orderToProduct[orderId];
    if (FREE_PRODUCTS.includes(productId)) {
      freeUserIds.add(tx.userId);
    }
  }
  
  console.log(`\n✅ Found ${freeUserIds.size} users who bought FREE products`);
  
  // Check how many have memberships
  const memberships = await prisma.userMembership.findMany({
    where: { userId: { in: Array.from(freeUserIds) } }
  });
  
  console.log(`├─ Have UserMembership: ${memberships.length}`);
  console.log(`└─ Need to create: ${freeUserIds.size - memberships.length}`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
