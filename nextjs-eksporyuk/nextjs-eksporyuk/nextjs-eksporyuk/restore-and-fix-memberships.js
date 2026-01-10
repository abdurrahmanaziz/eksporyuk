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
    d.setFullYear(d.getFullYear() + 50); // FREE juga dapat lifetime access
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
  
  console.log('📊 Loading all data...');
  const [txs, memberships, allUsers] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { userId: true, membershipId: true, createdAt: true, metadata: true }
    }),
    prisma.userMembership.findMany({
      select: { id: true, userId: true, membershipId: true }
    }),
    prisma.user.findMany({
      where: { role: 'MEMBER_FREE' },
      select: { id: true }
    })
  ]);
  
  console.log(`✅ ${txs.length} transactions`);
  console.log(`✅ ${memberships.length} existing memberships`);
  console.log(`✅ ${allUsers.length} MEMBER_FREE users\n`);
  
  // Build maps
  const userTx = {};
  for (const tx of txs) {
    if (!userTx[tx.userId]) userTx[tx.userId] = tx;
  }
  
  const existingMemberships = new Set();
  for (const m of memberships) {
    existingMemberships.add(`${m.userId}-${m.membershipId}`);
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
  
  // Process ALL transactions
  for (const tx of txs) {
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
    
    const key = `${tx.userId}-${tx.membershipId}`;
    
    // Check if membership exists
    if (!existingMemberships.has(key)) {
      // RESTORE deleted membership
      await prisma.userMembership.create({
        data: {
          userId: tx.userId,
          membershipId: tx.membershipId,
          startDate: tx.createdAt,
          endDate,
          status
        }
      });
      stats.restored++;
      
      if ((stats.restored + stats.updatedLifetime + stats.updated12M + stats.updated6M + stats.updatedFree) % 500 === 0) {
        console.log(`  Progress: ${stats.restored + stats.updatedLifetime + stats.updated12M + stats.updated6M + stats.updatedFree} processed...`);
      }
    } else {
      // UPDATE existing membership
      await prisma.userMembership.updateMany({
        where: {
          userId: tx.userId,
          membershipId: tx.membershipId
        },
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
      
      if ((stats.restored + stats.updatedLifetime + stats.updated12M + stats.updated6M + stats.updatedFree) % 500 === 0) {
        console.log(`  Progress: ${stats.restored + stats.updatedLifetime + stats.updated12M + stats.updated6M + stats.updatedFree} processed...`);
      }
    }
  }
  
  console.log('\n📈 FINAL STATISTICS:');
  console.log(`├─ Restored (deleted): ${stats.restored}`);
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
  console.log('\n✅ DONE! No data deleted.');
}

restoreAndFix().catch(console.error);
