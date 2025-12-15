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
  if (type === 'LIFETIME' || type === 'FREE') {
    d.setFullYear(d.getFullYear() + 50);
  } else if (type === '12_MONTHS') {
    d.setMonth(d.getMonth() + 12);
  } else if (type === '6_MONTHS') {
    d.setMonth(d.getMonth() + 6);
  }
  return d;
}

async function restoreAndFix() {
  console.log('🚀 Restore and Fix Memberships (SAFE - NO DELETE)\n');
  
  const orderToProduct = loadOrderMapping();
  
  // Get default membership (assuming id 1 or first membership)
  const defaultMembership = await prisma.membership.findFirst({
    orderBy: { id: 'asc' }
  });
  
  if (!defaultMembership) {
    console.error('❌ No membership found in database!');
    return;
  }
  
  console.log(`📋 Using membership: ${defaultMembership.name} (ID: ${defaultMembership.id})\n`);
  
  console.log('📊 Loading data...');
  const [txs, memberships] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { userId: true, createdAt: true, metadata: true }
    }),
    prisma.userMembership.findMany({
      select: { userId: true, membershipId: true }
    })
  ]);
  
  console.log(`✅ ${txs.length} transactions`);
  console.log(`✅ ${memberships.length} existing memberships\n`);
  
  // Build map of existing memberships
  const existingMemberships = new Set();
  for (const m of memberships) {
    existingMemberships.add(m.userId);
  }
  
  console.log('⚙️  Processing...\n');
  
  let stats = {
    restored: 0,
    updatedLifetime: 0,
    updated12M: 0,
    updated6M: 0,
    updatedFree: 0,
    skipped: 0
  };
  
  // Group transactions by user (keep first transaction)
  const userTx = {};
  for (const tx of txs) {
    if (!userTx[tx.userId]) userTx[tx.userId] = tx;
  }
  
  console.log(`📊 ${Object.keys(userTx).length} unique users with transactions\n`);
  
  // Process each user's first transaction
  let processed = 0;
  for (const userId in userTx) {
    const tx = userTx[userId];
    const sejoliOrderId = tx.metadata?.sejoliOrderId;
    
    if (!sejoliOrderId) {
      stats.skipped++;
      continue;
    }
    
    const productId = orderToProduct[sejoliOrderId];
    if (!productId) {
      stats.skipped++;
      continue;
    }
    
    const type = getType(productId);
    if (!type) {
      stats.skipped++;
      continue;
    }
    
    const endDate = calcEndDate(tx.createdAt, type);
    const status = new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
    
    // Check if user has membership
    if (!existingMemberships.has(userId)) {
      // RESTORE: Create new membership
      await prisma.userMembership.create({
        data: {
          userId: userId,
          membershipId: defaultMembership.id,
          startDate: tx.createdAt,
          endDate,
          status
        }
      });
      stats.restored++;
    } else {
      // UPDATE: Fix existing membership
      await prisma.userMembership.updateMany({
        where: { userId: userId },
        data: {
          startDate: tx.createdAt,
          endDate,
          status
        }
      });
      
      if (type === 'LIFETIME') stats.updatedLifetime++;
      else if (type === '12_MONTHS') stats.updated12M++;
      else if (type === '6_MONTHS') stats.updated6M++;
      else if (type === 'FREE') stats.updatedFree++;
    }
    
    processed++;
    if (processed % 500 === 0) {
      console.log(`  Progress: ${processed}/${Object.keys(userTx).length}...`);
    }
  }
  
  console.log('\n📈 FINAL STATISTICS:');
  console.log(`├─ Restored (previously deleted): ${stats.restored}`);
  console.log(`├─ Updated LIFETIME: ${stats.updatedLifetime}`);
  console.log(`├─ Updated 12 MONTHS: ${stats.updated12M}`);
  console.log(`├─ Updated 6 MONTHS: ${stats.updated6M}`);
  console.log(`├─ Updated FREE: ${stats.updatedFree}`);
  console.log(`└─ Skipped: ${stats.skipped}\n`);
  
  // Final verification
  const final = await prisma.userMembership.findMany({ select: { status: true } });
  const active = final.filter(m => m.status === 'ACTIVE').length;
  const expired = final.filter(m => m.status === 'EXPIRED').length;
  
  console.log('🎯 FINAL VERIFICATION:');
  console.log(`├─ Total UserMemberships: ${final.length}`);
  console.log(`├─ ACTIVE: ${active}`);
  console.log(`└─ EXPIRED: ${expired}`);
  
  await prisma.$disconnect();
  console.log('\n✅ DONE! All FREE users now have membership records with lifetime access.');
}

restoreAndFix().catch(console.error);
