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
  const tsvData = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const lines = tsvData.split('\n');
  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;
    const orderId = parseInt(cols[0]);
    const productId = parseInt(cols[1]);
    if (!isNaN(orderId) && !isNaN(productId)) map[orderId] = productId;
  }
  return map;
}

function getType(pid) {
  if (PRODUCT_MAPPING.LIFETIME.includes(pid)) return 'LIFETIME';
  if (PRODUCT_MAPPING['12_MONTHS'].includes(pid)) return '12_MONTHS';
  if (PRODUCT_MAPPING['6_MONTHS'].includes(pid)) return '6_MONTHS';
  if (PRODUCT_MAPPING.FREE.includes(pid)) return 'FREE';
  return null;
}

function calcEndDate(createdAt, type) {
  const d = new Date(createdAt);
  if (type === 'LIFETIME' || type === 'FREE') d.setFullYear(d.getFullYear() + 50);
  else if (type === '12_MONTHS') d.setMonth(d.getMonth() + 12);
  else if (type === '6_MONTHS') d.setMonth(d.getMonth() + 6);
  return d;
}

async function fix() {
  console.log('🚀 FAST Membership Fix\n');
  
  console.log('📂 Loading...');
  const orderMap = loadOrderMapping();
  const defaultMembership = await prisma.membership.findFirst({ orderBy: { id: 'asc' } });
  
  const [txs, existing] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { userId: true, createdAt: true, metadata: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.userMembership.findMany({ select: { userId: true } })
  ]);
  
  console.log(`✅ ${txs.length} txs, ${existing.length} memberships\n`);
  
  const existingSet = new Set(existing.map(m => m.userId));
  const userTx = {};
  for (const tx of txs) {
    if (!userTx[tx.userId]) userTx[tx.userId] = tx;
  }
  
  console.log('⚙️  Preparing data...\n');
  
  const toCreate = [];
  const toUpdate = [];
  
  for (const userId in userTx) {
    const tx = userTx[userId];
    const oid = tx.metadata?.sejoliOrderId;
    if (!oid) continue;
    
    const pid = orderMap[oid];
    if (!pid) continue;
    
    const type = getType(pid);
    if (!type) continue;
    
    const endDate = calcEndDate(tx.createdAt, type);
    const status = new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
    
    if (!existingSet.has(userId)) {
      toCreate.push({ userId, membershipId: defaultMembership.id, startDate: tx.createdAt, endDate, status });
    } else {
      toUpdate.push({ userId, startDate: tx.createdAt, endDate, status });
    }
  }
  
  console.log(`📊 To create: ${toCreate.length}, To update: ${toUpdate.length}\n`);
  
  // Batch create
  if (toCreate.length > 0) {
    console.log('➕ Creating in batches...');
    const batchSize = 1000;
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      await prisma.userMembership.createMany({ data: batch, skipDuplicates: true });
      console.log(`  Created: ${Math.min(i + batchSize, toCreate.length)}/${toCreate.length}`);
    }
  }
  
  // Batch update
  if (toUpdate.length > 0) {
    console.log('\n🔄 Updating...');
    let updated = 0;
    for (const item of toUpdate) {
      await prisma.userMembership.updateMany({
        where: { userId: item.userId },
        data: { startDate: item.startDate, endDate: item.endDate, status: item.status }
      });
      updated++;
      if (updated % 1000 === 0) console.log(`  Updated: ${updated}/${toUpdate.length}`);
    }
  }
  
  const final = await prisma.userMembership.findMany({ select: { status: true } });
  const active = final.filter(m => m.status === 'ACTIVE').length;
  
  console.log('\n✅ DONE!');
  console.log(`├─ Total: ${final.length}`);
  console.log(`├─ ACTIVE: ${active}`);
  console.log(`└─ EXPIRED: ${final.length - active}`);
  
  await prisma.$disconnect();
}

fix().catch(console.error);
