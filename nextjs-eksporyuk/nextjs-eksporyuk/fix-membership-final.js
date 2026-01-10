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
  console.log('📂 Loading TSV data...');
  const tsvData = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const lines = tsvData.split('\n');
  
  const orderToProduct = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;
    const orderId = parseInt(cols[0]);
    const productId = parseInt(cols[1]);
    if (!isNaN(orderId) && !isNaN(productId)) {
      orderToProduct.set(orderId, productId);
    }
  }
  console.log(`✅ Loaded ${orderToProduct.size} orders\n`);
  return orderToProduct;
}

function getProductDurationType(productId) {
  if (PRODUCT_MAPPING.LIFETIME.includes(productId)) return 'LIFETIME';
  if (PRODUCT_MAPPING['12_MONTHS'].includes(productId)) return '12_MONTHS';
  if (PRODUCT_MAPPING['6_MONTHS'].includes(productId)) return '6_MONTHS';
  if (PRODUCT_MAPPING.FREE.includes(productId)) return 'FREE';
  return null;
}

function calculateEndDate(createdAt, durationType) {
  const date = new Date(createdAt);
  switch(durationType) {
    case 'LIFETIME': date.setFullYear(date.getFullYear() + 50); return date;
    case '12_MONTHS': date.setMonth(date.getMonth() + 12); return date;
    case '6_MONTHS': date.setMonth(date.getMonth() + 6); return date;
    default: return null;
  }
}

function getMembershipStatus(endDate) {
  return new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
}

async function fixMembershipDurations() {
  console.log('🚀 Starting...\n');
  
  const orderToProduct = loadOrderMapping();
  
  // Load ALL data at once
  console.log('📊 Loading all transactions...');
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`✅ ${transactions.length} transactions loaded\n`);
  
  // Build userId -> transaction map
  const userFirstTransaction = new Map();
  for (const tx of transactions) {
    if (!userFirstTransaction.has(tx.userId)) {
      userFirstTransaction.set(tx.userId, tx);
    }
  }
  
  console.log('📊 Loading all memberships...');
  const memberships = await prisma.userMembership.findMany({});
  console.log(`✅ ${memberships.length} memberships loaded\n`);
  
  let stats = { lifetime: 0, twelveMonths: 0, sixMonths: 0, deleted: 0, noMapping: 0, active: 0, expired: 0 };
  
  console.log('⚙️  Processing memberships...\n');
  
  for (const membership of memberships) {
    const tx = userFirstTransaction.get(membership.userId);
    
    if (!tx || !tx.metadata?.sejoliOrderId) {
      stats.noMapping++;
      continue;
    }
    
    const productId = orderToProduct.get(tx.metadata.sejoliOrderId);
    if (!productId) {
      stats.noMapping++;
      continue;
    }
    
    const durationType = getProductDurationType(productId);
    if (!durationType) {
      stats.noMapping++;
      continue;
    }
    
    // Delete FREE products
    if (durationType === 'FREE') {
      await prisma.userMembership.delete({ where: { id: membership.id } });
      stats.deleted++;
      continue;
    }
    
    // Update with correct duration
    const endDate = calculateEndDate(tx.createdAt, durationType);
    const status = getMembershipStatus(endDate);
    
    await prisma.userMembership.update({
      where: { id: membership.id },
      data: { endDate, status, startDate: tx.createdAt }
    });
    
    if (durationType === 'LIFETIME') stats.lifetime++;
    else if (durationType === '12_MONTHS') stats.twelveMonths++;
    else if (durationType === '6_MONTHS') stats.sixMonths++;
    
    if (status === 'ACTIVE') stats.active++;
    else stats.expired++;
    
    if ((stats.lifetime + stats.twelveMonths + stats.sixMonths) % 1000 === 0) {
      console.log(`  Progress: ${stats.lifetime + stats.twelveMonths + stats.sixMonths}...`);
    }
  }
  
  console.log('\n📈 FINAL STATISTICS:');
  console.log(`├─ LIFETIME: ${stats.lifetime}`);
  console.log(`├─ 12 MONTHS: ${stats.twelveMonths}`);
  console.log(`├─ 6 MONTHS: ${stats.sixMonths}`);
  console.log(`├─ FREE (deleted): ${stats.deleted}`);
  console.log(`├─ No mapping: ${stats.noMapping}`);
  console.log(`├─ ACTIVE: ${stats.active}`);
  console.log(`└─ EXPIRED: ${stats.expired}`);
  
  const current = await prisma.userMembership.findMany({ select: { status: true } });
  const activeCount = current.filter(m => m.status === 'ACTIVE').length;
  const expiredCount = current.filter(m => m.status === 'EXPIRED').length;
  
  console.log('\n🎯 VERIFICATION:');
  console.log(`├─ Total: ${current.length}`);
  console.log(`├─ ACTIVE: ${activeCount}`);
  console.log(`└─ EXPIRED: ${expiredCount}`);
  
  await prisma.$disconnect();
}

fixMembershipDurations().catch(console.error);
