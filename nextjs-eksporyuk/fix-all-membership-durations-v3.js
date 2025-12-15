import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Product mapping berdasarkan ALL_PRODUCTS_MAPPING.md
const PRODUCT_MAPPING = {
  // LIFETIME Products (12 products)
  LIFETIME: [179, 3840, 6068, 8910, 13401, 6810, 11207, 15234, 16956, 17920, 19296, 20852],
  
  // 12 BULAN Products (3 products)
  '12_MONTHS': [8683, 8915, 13399],
  
  // 6 BULAN Products (3 products)
  '6_MONTHS': [8684, 8914, 13400],
  
  // FREE ACCESS - NO MEMBERSHIP (36 products)
  FREE: [
    // Webinar/Zoom (11)
    397, 488, 16130, 16963, 17322, 17767, 18358, 18528, 19042, 20130, 21476,
    
    // Workshops/Events (6)
    12994, 13039, 13045, 16860, 17227, 18705,
    
    // Free/Gratis/Donasi (2)
    300, 1529,
    
    // Products/Services (15)
    2910, 3764, 4220, 558, 4684, 5928, 5932, 5935, 8686, 
    16581, 16587, 16592, 16826, 18893, 20336,
    
    // Old/Prelaunch (2)
    28, 93
  ]
};

// Load order data from TSV
function loadOrderMapping() {
  console.log('📂 Loading order data from sejoli_orders_raw.tsv...');
  const tsvData = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const lines = tsvData.split('\n');
  
  const orderToProduct = new Map();
  
  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;
    
    const orderId = parseInt(cols[0]);
    const productId = parseInt(cols[1]);
    
    if (!isNaN(orderId) && !isNaN(productId)) {
      orderToProduct.set(orderId, productId);
    }
  }
  
  console.log(`✅ Loaded ${orderToProduct.size} order-to-product mappings\n`);
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
    case 'LIFETIME':
      date.setFullYear(date.getFullYear() + 50);
      return date;
    case '12_MONTHS':
      date.setMonth(date.getMonth() + 12);
      return date;
    case '6_MONTHS':
      date.setMonth(date.getMonth() + 6);
      return date;
    default:
      return null;
  }
}

function getMembershipStatus(endDate) {
  if (!endDate) return 'ACTIVE';
  return new Date() < endDate ? 'ACTIVE' : 'EXPIRED';
}

async function fixMembershipDurations() {
  console.log('🚀 Starting membership duration fix...\n');
  
  try {
    // Load order to product mapping
    const orderToProduct = loadOrderMapping();
    
    // Get all UserMemberships
    const memberships = await prisma.userMembership.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📊 Found ${memberships.length} UserMembership records\n`);
    
    let stats = {
      lifetime: 0,
      twelveMonths: 0,
      sixMonths: 0,
      deleted: 0,
      noTransaction: 0,
      noMapping: 0,
      active: 0,
      expired: 0
    };
    
    // Process each membership
    for (const membership of memberships) {
      // Find transaction for this user
      const tx = await prisma.transaction.findFirst({
        where: {
          userId: membership.userId,
          status: 'SUCCESS'
        },
        orderBy: {
          createdAt: 'asc'  // Get first transaction
        }
      });
      
      if (!tx) {
        console.log(`⚠️  No transaction found for user ${membership.userId}`);
        stats.noTransaction++;
        continue;
      }
      
      const sejoliOrderId = tx.metadata?.sejoliOrderId;
      
      if (!sejoliOrderId) {
        console.log(`⚠️  Transaction ${tx.id} has no sejoliOrderId`);
        stats.noMapping++;
        continue;
      }
      
      const productId = orderToProduct.get(sejoliOrderId);
      
      if (!productId) {
        console.log(`⚠️  Order ${sejoliOrderId} not found in TSV`);
        stats.noMapping++;
        continue;
      }
      
      const durationType = getProductDurationType(productId);
      
      if (!durationType) {
        console.log(`⚠️  Product ${productId} not in mapping`);
        stats.noMapping++;
        continue;
      }
      
      // For FREE products, delete UserMembership
      if (durationType === 'FREE') {
        await prisma.userMembership.delete({
          where: {
            id: membership.id
          }
        });
        stats.deleted++;
        console.log(`🗑️  Deleted membership ${membership.id} for user ${membership.userId} (FREE product ${productId})`);
        continue;
      }
      
      // Calculate endDate based on transaction createdAt
      const endDate = calculateEndDate(tx.createdAt, durationType);
      const status = getMembershipStatus(endDate);
      
      // Update UserMembership
      await prisma.userMembership.update({
        where: {
          id: membership.id
        },
        data: {
          endDate,
          status,
          startDate: tx.createdAt
        }
      });
      
      // Update stats
      if (durationType === 'LIFETIME') stats.lifetime++;
      else if (durationType === '12_MONTHS') stats.twelveMonths++;
      else if (durationType === '6_MONTHS') stats.sixMonths++;
      
      if (status === 'ACTIVE') stats.active++;
      else stats.expired++;
      
      const monthsRemaining = durationType === 'LIFETIME' ? '50 years' : 
        Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24 * 30));
      
      if (stats.lifetime + stats.twelveMonths + stats.sixMonths <= 20 || (stats.lifetime + stats.twelveMonths + stats.sixMonths) % 1000 === 0) {
        console.log(`✅ User ${membership.userId}: ${durationType} (${status}) - ${monthsRemaining} ${durationType === 'LIFETIME' ? '' : 'months'} remaining`);
      }
    }
    
    console.log('\n📈 FINAL STATISTICS:');
    console.log(`├─ LIFETIME memberships: ${stats.lifetime}`);
    console.log(`├─ 12 MONTHS memberships: ${stats.twelveMonths}`);
    console.log(`├─ 6 MONTHS memberships: ${stats.sixMonths}`);
    console.log(`├─ FREE (deleted): ${stats.deleted}`);
    console.log(`├─ No transaction: ${stats.noTransaction}`);
    console.log(`├─ No mapping found: ${stats.noMapping}`);
    console.log(`├─ ACTIVE status: ${stats.active}`);
    console.log(`└─ EXPIRED status: ${stats.expired}`);
    
    // Verify current memberships
    const currentMemberships = await prisma.userMembership.findMany({
      select: {
        status: true
      }
    });
    
    const activeCount = currentMemberships.filter(m => m.status === 'ACTIVE').length;
    const expiredCount = currentMemberships.filter(m => m.status === 'EXPIRED').length;
    
    console.log('\n🎯 VERIFICATION:');
    console.log(`├─ Total UserMembership records: ${currentMemberships.length}`);
    console.log(`├─ ACTIVE: ${activeCount}`);
    console.log(`└─ EXPIRED: ${expiredCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixMembershipDurations();
