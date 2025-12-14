/**
 * FINAL IMPORT - CORRECT MAPPING
 * Using JSON backup with accurate product-to-membership mapping
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Membership IDs
const LIFETIME = 'cmj547h7y001eit1eirlzdklz';
const M12 = 'cmj547h4d001dit1edotcuy8b';
const M6 = 'cmj547h01001cit1e7n2znhuo';
const M3 = 'cmj547gwo001bit1egx205tsi';
const M1 = 'cmj547gmc001ait1en83tmjdc';

// ACCURATE PRODUCT MAPPING based on Sejoli product analysis
// Berdasarkan harga dan durasi yang sebenarnya
const PRODUCT_MAP = {
  // LIFETIME (harga 700k - 2jt)
  13401: { membership: LIFETIME, name: 'Lifetime 2jt' },
  3840: { membership: LIFETIME, name: 'Lifetime 900k' },
  6068: { membership: LIFETIME, name: 'Lifetime 700k' },
  16956: { membership: LIFETIME, name: 'Lifetime Special' },
  15234: { membership: LIFETIME, name: 'Lifetime Promo' },
  17920: { membership: LIFETIME, name: 'Lifetime Bundle' },
  8910: { membership: LIFETIME, name: 'Lifetime Hemat' },
  
  // 12 BULAN (harga 1.7jt - 1.8jt)
  8683: { membership: M12, name: '12 Bulan 1.8jt' },
  13399: { membership: M12, name: '12 Bulan 1.7jt' },
  8915: { membership: M12, name: '12 Bulan Promo' },
  
  // 6 BULAN (harga 1.3jt - 1.4jt)
  13400: { membership: M6, name: '6 Bulan 1.4jt' },
  8684: { membership: M6, name: '6 Bulan 1.3jt' },
  8914: { membership: M6, name: '6 Bulan Promo' },
  
  // 3 BULAN
  13398: { membership: M3, name: '3 Bulan' },
  
  // 1 BULAN (harga 300k - 400k atau gratis/promo)
  179: { membership: M1, name: '1 Bulan 400k' },
  16963: { membership: M1, name: 'Trial Gratis' },
  17322: { membership: M1, name: 'Promo Gratis' },
  16130: { membership: M1, name: 'Promo 1' },
  17767: { membership: M1, name: 'Promo 2' },
  488: { membership: M1, name: 'Promo 3' },
  18358: { membership: M1, name: 'Promo 4' },
  16587: { membership: M1, name: 'Promo 5' },
  16592: { membership: M1, name: 'Promo 6' },
  16826: { membership: M1, name: 'Promo 7' },
  16860: { membership: M1, name: 'Promo 8' },
  17227: { membership: M1, name: 'Promo 9' },
  18705: { membership: M1, name: 'Promo 10' },
  18893: { membership: M1, name: 'Promo 11' },
  19042: { membership: M1, name: 'Promo 12' },
  19296: { membership: M1, name: 'Promo 13' },
  20130: { membership: M1, name: 'Promo 14' },
  20336: { membership: M1, name: 'Promo 15' },
  20852: { membership: M1, name: 'Promo 16' },
  21476: { membership: M1, name: 'Promo 17' },
  28: { membership: M1, name: 'Basic 1' },
  93: { membership: M1, name: 'Basic 2' },
  300: { membership: M1, name: 'Basic 3' },
  397: { membership: M1, name: 'Basic 4' },
  558: { membership: M1, name: 'Basic 5' },
  1529: { membership: M1, name: 'Basic 6' },
  2910: { membership: M1, name: 'Basic 7' },
  3764: { membership: M1, name: 'Basic 8' },
  4220: { membership: M1, name: 'Basic 9' },
  4684: { membership: M1, name: 'Basic 10' },
  5928: { membership: M1, name: 'Basic 11' },
  5932: { membership: M1, name: 'Basic 12' },
  5935: { membership: M1, name: 'Basic 13' },
  6810: { membership: M1, name: 'Basic 14' },
  8686: { membership: M1, name: 'Basic 15' },
  11207: { membership: M1, name: 'Basic 16' },
  12994: { membership: M1, name: 'Basic 17' },
  13039: { membership: M1, name: 'Basic 18' },
  13045: { membership: M1, name: 'Basic 19' },
  13050: { membership: M1, name: 'Basic 20' },
  18528: { membership: M1, name: 'Basic 21' }
};

const DURATION = {
  [LIFETIME]: null,
  [M12]: 365,
  [M6]: 180,
  [M3]: 90,
  [M1]: 30
};

// Commission rates per membership tier
const COMMISSION_RATE = {
  [LIFETIME]: 0.30, // 30%
  [M12]: 0.30,
  [M6]: 0.25,
  [M3]: 0.25,
  [M1]: 0.20
};

(async () => {
  console.log('🚀 FINAL IMPORT - ACCURATE MAPPING\n');
  console.log('═'.repeat(80));
  
  const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Build user mapping
  const wpUserMap = new Map();
  data.users.forEach(u => wpUserMap.set(u.id, u.user_email));
  
  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userMap = new Map(dbUsers.map(u => [u.email, u.id]));
  
  console.log('📊 DATA SUMMARY:');
  console.log(`  Orders: ${data.orders.length.toLocaleString()}`);
  console.log(`  WP Users: ${wpUserMap.size.toLocaleString()}`);
  console.log(`  DB Users: ${userMap.size.toLocaleString()}`);
  console.log('');
  
  // Track affiliate earnings
  const affiliateEarnings = new Map();
  
  let tx = 0, mem = 0, skip = 0, errors = 0;
  const errorLog = [];
  
  console.log('💾 IMPORTING TRANSACTIONS & MEMBERSHIPS...\n');
  
  for (let i = 0; i < data.orders.length; i++) {
    const order = data.orders[i];
    
    try {
      // Get user
      const email = wpUserMap.get(order.user_id);
      if (!email) { skip++; continue; }
      
      const userId = userMap.get(email);
      if (!userId) { skip++; continue; }
      
      // Get product mapping
      const productInfo = PRODUCT_MAP[parseInt(order.product_id)];
      if (!productInfo) {
        skip++;
        if (errorLog.length < 5) {
          errorLog.push(`Unknown product ID: ${order.product_id}`);
        }
        continue;
      }
      
      const amount = parseFloat(order.grand_total || 0);
      const membershipId = productInfo.membership;
      
      // Calculate commission
      let commission = 0;
      if (order.affiliate_id && order.affiliate_id > 0 && amount > 0) {
        const rate = COMMISSION_RATE[membershipId] || 0.30;
        commission = amount * rate;
        
        // Get affiliate user
        const affEmail = wpUserMap.get(order.affiliate_id);
        if (affEmail) {
          const affUserId = userMap.get(affEmail);
          if (affUserId) {
            if (!affiliateEarnings.has(affUserId)) {
              affiliateEarnings.set(affUserId, { commission: 0, orders: 0, email: affEmail });
            }
            const stats = affiliateEarnings.get(affUserId);
            stats.commission += commission;
            stats.orders += 1;
          }
        }
      }
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId,
          type: 'MEMBERSHIP',
          amount,
          status: order.status === 'completed' ? 'SUCCESS' : 'PENDING',
          description: `Purchase: ${productInfo.name}`,
          metadata: JSON.stringify({
            orderId: order.id,
            productId: order.product_id,
            affiliateId: order.affiliate_id,
            commission
          }),
          createdAt: order.created_at ? new Date(order.created_at) : new Date()
        }
      });
      tx++;
      
      // Create membership for completed orders
      if (order.status === 'completed') {
        const start = order.created_at ? new Date(order.created_at) : new Date();
        const duration = DURATION[membershipId];
        let expiry = null;
        
        if (duration) {
          expiry = new Date(start);
          expiry.setDate(expiry.getDate() + duration);
        }
        
        await prisma.userMembership.upsert({
          where: { userId },
          update: {
            membershipId,
            status: 'ACTIVE',
            startDate: start,
            expiryDate: expiry
          },
          create: {
            userId,
            membershipId,
            status: 'ACTIVE',
            startDate: start,
            expiryDate: expiry,
            autoRenew: false
          }
        });
        mem++;
      }
      
      if ((i + 1) % 1000 === 0) {
        console.log(`  ✓ ${i + 1}/${data.orders.length} | TX:${tx} MEM:${mem} SKIP:${skip} ERR:${errors}`);
      }
      
    } catch (error) {
      errors++;
      if (errorLog.length < 5) {
        errorLog.push(`Order ${order.id}: ${error.message}`);
      }
    }
  }
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ TRANSACTIONS & MEMBERSHIPS IMPORTED');
  console.log('═'.repeat(80));
  console.log(`  Transactions: ${tx.toLocaleString()}`);
  console.log(`  Memberships: ${mem.toLocaleString()}`);
  console.log(`  Skipped: ${skip.toLocaleString()}`);
  console.log(`  Errors: ${errors.toLocaleString()}`);
  
  if (errorLog.length > 0) {
    console.log('\n  Sample errors:');
    errorLog.forEach(e => console.log(`    - ${e}`));
  }
  console.log('');
  
  // Create affiliate profiles
  console.log('🤝 CREATING AFFILIATE PROFILES...\n');
  
  let affCreated = 0;
  const sortedAffiliates = Array.from(affiliateEarnings.entries())
    .sort((a, b) => b[1].commission - a[1].commission);
  
  console.log(`  Found ${sortedAffiliates.length} users with commissions\n`);
  
  for (const [userId, stats] of sortedAffiliates) {
    try {
      await prisma.affiliateProfile.upsert({
        where: { userId },
        update: {
          totalCommission: stats.commission,
          totalSales: stats.orders
        },
        create: {
          userId,
          isActive: true,
          approvalStatus: 'APPROVED',
          totalSales: stats.orders,
          totalCommission: stats.commission,
          commissionRate: '30'
        }
      });
      
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: { increment: stats.commission },
          totalEarnings: { increment: stats.commission }
        }
      });
      
      affCreated++;
      
      if (affCreated % 25 === 0) {
        console.log(`    ✓ ${affCreated} affiliates created...`);
      }
      
    } catch (error) {
      console.log(`    ⚠️  Error for ${stats.email}: ${error.message}`);
    }
  }
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ AFFILIATES CREATED');
  console.log('═'.repeat(80));
  console.log(`  Affiliates: ${affCreated.toLocaleString()}`);
  console.log(`  Total Commission: Rp ${(sortedAffiliates.reduce((sum, [_, s]) => sum + s.commission, 0) / 1000000).toFixed(2)}M`);
  console.log('');
  
  // Final summary
  const [finalUsers, finalTx, finalMem, finalAff] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.userMembership.count(),
    prisma.affiliateProfile.count()
  ]);
  
  console.log('═'.repeat(80));
  console.log('🎉 IMPORT COMPLETE!');
  console.log('═'.repeat(80));
  console.log('');
  console.log('📊 FINAL DATABASE:');
  console.log(`  👥 Users: ${finalUsers.toLocaleString()}`);
  console.log(`  💳 Transactions: ${finalTx.toLocaleString()}`);
  console.log(`  🎫 Memberships: ${finalMem.toLocaleString()}`);
  console.log(`  🤝 Affiliates: ${finalAff.toLocaleString()}`);
  console.log('');
  console.log('═'.repeat(80));
  
  await prisma.$disconnect();
})();
