import { PrismaClient } from '@prisma/client';

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
    // Get all transactions with SUCCESS status
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📊 Found ${transactions.length} SUCCESS transactions\n`);
    
    let stats = {
      lifetime: 0,
      twelveMonths: 0,
      sixMonths: 0,
      deleted: 0,
      noMapping: 0,
      active: 0,
      expired: 0
    };
    
    // Process each transaction
    for (const tx of transactions) {
      const productId = tx.metadata?.sejoliProductId;
      
      if (!productId) {
        console.log(`⚠️  Transaction ${tx.id} has no sejoliProductId in metadata`);
        stats.noMapping++;
        continue;
      }
      
      const durationType = getProductDurationType(productId);
      
      if (!durationType) {
        console.log(`⚠️  Product ${productId} not found in mapping`);
        stats.noMapping++;
        continue;
      }
      
      // For FREE products, delete UserMembership
      if (durationType === 'FREE') {
        await prisma.userMembership.deleteMany({
          where: {
            userId: tx.userId,
            membershipId: tx.membershipId
          }
        });
        stats.deleted++;
        console.log(`🗑️  Deleted membership for user ${tx.userId} (FREE product ${productId})`);
        continue;
      }
      
      // Calculate endDate based on transaction createdAt
      const endDate = calculateEndDate(tx.createdAt, durationType);
      const status = getMembershipStatus(endDate);
      
      // Update or create UserMembership
      await prisma.userMembership.upsert({
        where: {
          userId_membershipId: {
            userId: tx.userId,
            membershipId: tx.membershipId
          }
        },
        update: {
          endDate,
          status
        },
        create: {
          userId: tx.userId,
          membershipId: tx.membershipId,
          startDate: tx.createdAt,
          endDate,
          status
        }
      });
      
      // Update stats
      if (durationType === 'LIFETIME') stats.lifetime++;
      else if (durationType === '12_MONTHS') stats.twelveMonths++;
      else if (durationType === '6_MONTHS') stats.sixMonths++;
      
      if (status === 'ACTIVE') stats.active++;
      else stats.expired++;
      
      const monthsRemaining = durationType === 'LIFETIME' ? '50 years' : 
        durationType === '12_MONTHS' ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24 * 30)) + ' months' :
        Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24 * 30)) + ' months';
      
      console.log(`✅ User ${tx.userId}: ${durationType} (${status}) - ${monthsRemaining} remaining`);
    }
    
    console.log('\n📈 FINAL STATISTICS:');
    console.log(`├─ LIFETIME memberships: ${stats.lifetime}`);
    console.log(`├─ 12 MONTHS memberships: ${stats.twelveMonths}`);
    console.log(`├─ 6 MONTHS memberships: ${stats.sixMonths}`);
    console.log(`├─ FREE (deleted): ${stats.deleted}`);
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
