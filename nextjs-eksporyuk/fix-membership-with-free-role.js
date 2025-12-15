import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const PRODUCT_MAPPING = {
  LIFETIME: [179, 3840, 6068, 8910, 13401, 6810, 11207, 15234, 16956, 17920, 19296, 20852],
  '12_MONTHS': [8683, 8915, 13399],
  '6_MONTHS': [8684, 8914, 13400],
  FREE: [397, 488, 16130, 16963, 17322, 17767, 18358, 18528, 19042, 20130, 21476,
    12994, 13039, 13045, 16860, 17227, 18705, 300, 1529,
    2910, 3764, 4220, 558, 4684, 5928, 5932, 5935, 8686, 
    16581, 16587, 16592, 16826, 18893, 20336, 28, 93]
};

function loadOrderMapping() {
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
  console.log(`✅ ${Object.keys(orderToProduct).length} orders\n`);
  return orderToProduct;
}

function getType(productId) {
  if (PRODUCT_MAPPING.LIFETIME.includes(productId)) return 'LIFETIME';
  if (PRODUCT_MAPPING['12_MONTHS'].includes(productId)) return '12_MONTHS';
  if (PRODUCT_MAPPING['6_MONTHS'].includes(productId)) return '6_MONTHS';
  if (PRODUCT_MAPPING.FREE.includes(productId)) return 'FREE';
  return null;
}

function calcEndDate(createdAt, type) {
  const d = new Date(createdAt);
  if (type === 'LIFETIME') d.setFullYear(d.getFullYear() + 50);
  else if (type === '12_MONTHS') d.setMonth(d.getMonth() + 12);
  else if (type === '6_MONTHS') d.setMonth(d.getMonth() + 6);
  else if (type === 'FREE') d.setFullYear(d.getFullYear() + 50); // FREE juga lifetime access
  return d;
}

async function fix() {
  console.log('🚀 Starting batch fix WITH FREE ROLE...\n');
  
  const orderToProduct = loadOrderMapping();
  
  console.log('📊 Loading transactions...');
  const txs = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { userId: true, createdAt: true, metadata: true }
  });
  console.log(`✅ ${txs.length} transactions\n`);
  
  const userTx = {};
  for (const tx of txs) {
    if (!userTx[tx.userId]) userTx[tx.userId] = tx;
  }
  
  console.log('📊 Loading memberships...');
  const memberships = await prisma.userMembership.findMany({
    select: { id: true, userId: true }
  });
  console.log(`✅ ${memberships.length} memberships\n`);
  
  console.log('⚙️  Categorizing...');
  
  const toUpdateLifetime = [];
  const toUpdate12M = [];
  const toUpdate6M = [];
  const toUpdateFree = [];
  const userIdsToSetFreeRole = [];
  let skipped = 0;
  
  for (const m of memberships) {
    const tx = userTx[m.userId];
    if (!tx || !tx.metadata?.sejoliOrderId) {
      skipped++;
      continue;
    }
    
    const productId = orderToProduct[tx.metadata.sejoliOrderId];
    if (!productId) {
      skipped++;
      continue;
    }
    
    const type = getType(productId);
    if (!type) {
      skipped++;
      continue;
    }
    
    const endDate = calcEndDate(tx.createdAt, type);
    const status = new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
    const data = { id: m.id, userId: m.userId, startDate: tx.createdAt, endDate, status };
    
    if (type === 'FREE') {
      toUpdateFree.push(data);
      userIdsToSetFreeRole.push(m.userId);
    } else if (type === 'LIFETIME') {
      toUpdateLifetime.push(data);
    } else if (type === '12_MONTHS') {
      toUpdate12M.push(data);
    } else if (type === '6_MONTHS') {
      toUpdate6M.push(data);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`├─ LIFETIME: ${toUpdateLifetime.length}`);
  console.log(`├─ 12 MONTHS: ${toUpdate12M.length}`);
  console.log(`├─ 6 MONTHS: ${toUpdate6M.length}`);
  console.log(`├─ FREE (keep with MEMBER_FREE role): ${toUpdateFree.length}`);
  console.log(`└─ Skipped: ${skipped}\n`);
  
  // Update memberships in batches
  console.log('⚙️  Updating memberships...');
  
  const batchSize = 500;
  let totalUpdated = 0;
  
  const allUpdates = [...toUpdateLifetime, ...toUpdate12M, ...toUpdate6M, ...toUpdateFree];
  
  for (let i = 0; i < allUpdates.length; i += batchSize) {
    const chunk = allUpdates.slice(i, i + batchSize);
    
    await prisma.$transaction(
      chunk.map(d => 
        prisma.userMembership.update({
          where: { id: d.id },
          data: { startDate: d.startDate, endDate: d.endDate, status: d.status }
        })
      )
    );
    
    totalUpdated += chunk.length;
    console.log(`  Memberships updated: ${totalUpdated}/${allUpdates.length}`);
  }
  
  // Update user roles to MEMBER_FREE for FREE product buyers
  console.log(`\n👤 Setting MEMBER_FREE role for ${userIdsToSetFreeRole.length} users...`);
  
  let roleUpdated = 0;
  for (let i = 0; i < userIdsToSetFreeRole.length; i += batchSize) {
    const chunk = userIdsToSetFreeRole.slice(i, i + batchSize);
    
    await prisma.$transaction(
      chunk.map(userId => 
        prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER_FREE' }
        })
      )
    );
    
    roleUpdated += chunk.length;
    console.log(`  Roles updated: ${roleUpdated}/${userIdsToSetFreeRole.length}`);
  }
  
  console.log('\n🎯 FINAL CHECK:');
  const final = await prisma.userMembership.findMany({ select: { status: true } });
  const active = final.filter(m => m.status === 'ACTIVE').length;
  const expired = final.filter(m => m.status === 'EXPIRED').length;
  
  console.log(`├─ Total memberships: ${final.length}`);
  console.log(`├─ ACTIVE: ${active}`);
  console.log(`└─ EXPIRED: ${expired}`);
  
  const users = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });
  
  console.log('\n👥 User roles:');
  users.forEach(u => console.log(`├─ ${u.role}: ${u._count}`));
  
  await prisma.$disconnect();
  console.log('\n✅ DONE!');
}

fix().catch(console.error);
