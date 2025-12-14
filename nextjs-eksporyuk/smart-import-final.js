/**
 * SMART IMPORT - Map products to membership tiers intelligently
 * Based on product price and naming patterns
 */

const {PrismaClient} = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();

// Membership IDs in new system
const MEMBERSHIPS = {
  LIFETIME: 'cmj547h7y001eit1eirlzdklz',
  M12: 'cmj547h4d001dit1edotcuy8b',
  M6: 'cmj547h01001cit1e7n2znhuo',
  M3: 'cmj547gwo001bit1egx205tsi',
  M1: 'cmj547gmc001ait1en83tmjdc'
};

const DURATIONS = {
  [MEMBERSHIPS.LIFETIME]: null,
  [MEMBERSHIPS.M12]: 365,
  [MEMBERSHIPS.M6]: 180,
  [MEMBERSHIPS.M3]: 90,
  [MEMBERSHIPS.M1]: 30
};

// Smart product mapping based on price ranges
function mapProductToMembership(productId, price) {
  // Price-based mapping (in Rupiah)
  if (price >= 1500000) return MEMBERSHIPS.LIFETIME; // >= 1.5jt = Lifetime
  if (price >= 1000000) return MEMBERSHIPS.M12;      // 1-1.5jt = 12 bulan
  if (price >= 700000) return MEMBERSHIPS.M6;        // 700rb-1jt = 6 bulan
  if (price >= 300000) return MEMBERSHIPS.M3;        // 300-700rb = 3 bulan
  if (price > 0) return MEMBERSHIPS.M1;               // >0 = 1 bulan
  
  // Free/promo products = 1 month trial
  return MEMBERSHIPS.M1;
}

// Calculate commission (typical Sejoli affiliate: 30%)
const DEFAULT_COMMISSION_RATE = 0.30;

(async () => {
  console.log('🚀 SMART IMPORT - TRANSAKSI & AFFILIATE\n');
  
  const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Build user mappings
  const wpUserMap = new Map();
  data.users.forEach(u => wpUserMap.set(u.id, u.user_email));
  
  const users = await p.user.findMany({ select: { id: true, email: true } });
  const userMap = new Map(users.map(u => [u.email, u.id]));
  
  // Build affiliate code mapping
  const affiliateCodeMap = new Map();
  if (data.affiliates) {
    data.affiliates.forEach(aff => {
      affiliateCodeMap.set(aff.user_id, aff.affiliate_code);
    });
  }
  
  console.log('📊 DATA SUMMARY:');
  console.log('Orders:', data.orders.length);
  console.log('Users in DB:', userMap.size);
  console.log('Affiliate Codes:', affiliateCodeMap.size);
  console.log('');
  
  let txCreated = 0, memCreated = 0, affCreated = 0;
  let totalCommission = 0;
  let errors = 0, skipped = 0;
  
  // Track affiliates with actual commissions
  const affiliateEarnings = new Map(); // userId => total commission
  const affiliateOrders = new Map();   // userId => order count
  
  console.log('🔄 PROCESSING ORDERS...\n');
  
  for (let i = 0; i < data.orders.length; i++) {
    const order = data.orders[i];
    
    try {
      // Get buyer
      const buyerEmail = wpUserMap.get(order.user_id);
      if (!buyerEmail) { skipped++; continue; }
      
      const buyerId = userMap.get(buyerEmail);
      if (!buyerId) { skipped++; continue; }
      
      const amount = parseFloat(order.grand_total || 0);
      const productId = parseInt(order.product_id);
      
      // Map to membership
      const membershipId = mapProductToMembership(productId, amount);
      if (!membershipId) { skipped++; continue; }
      
      // Create transaction
      const tx = await p.transaction.create({
        data: {
          userId: buyerId,
          type: 'MEMBERSHIP',
          amount: amount,
          status: order.status === 'completed' ? 'SUCCESS' : 'PENDING',
          description: `Order #${order.id} - Product ${productId}`,
          metadata: JSON.stringify({
            orderId: order.id,
            productId: productId,
            affiliateId: order.affiliate_id || 0,
            wpUserId: order.user_id
          }),
          createdAt: order.created_at ? new Date(order.created_at) : new Date()
        }
      });
      txCreated++;
      
      // Create/update membership for completed orders
      if (order.status === 'completed') {
        const duration = DURATIONS[membershipId];
        const startDate = order.created_at ? new Date(order.created_at) : new Date();
        let expiryDate = null;
        
        if (duration) {
          expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + duration);
        }
        
        await p.userMembership.upsert({
          where: { userId_membershipId: { userId: buyerId, membershipId: membershipId } },
          update: {
            status: 'ACTIVE',
            startDate: startDate,
            endDate: expiryDate || new Date('2099-12-31')
          },
          create: {
            userId: buyerId,
            membershipId: membershipId,
            status: 'ACTIVE',
            startDate: startDate,
            endDate: expiryDate || new Date('2099-12-31'),
            autoRenew: false
          }
        });
        memCreated++;
        
        // Track affiliate commission
        if (order.affiliate_id && order.affiliate_id > 0 && amount > 0) {
          const affEmail = wpUserMap.get(order.affiliate_id);
          if (affEmail) {
            const affUserId = userMap.get(affEmail);
            if (affUserId) {
              const commission = amount * DEFAULT_COMMISSION_RATE;
              
              if (!affiliateEarnings.has(affUserId)) {
                affiliateEarnings.set(affUserId, 0);
                affiliateOrders.set(affUserId, 0);
              }
              
              affiliateEarnings.set(affUserId, affiliateEarnings.get(affUserId) + commission);
              affiliateOrders.set(affUserId, affiliateOrders.get(affUserId) + 1);
              totalCommission += commission;
            }
          }
        }
      }
      
      if ((i + 1) % 1000 === 0) {
        console.log(`Progress: ${i + 1}/${data.orders.length} | TX: ${txCreated}, MEM: ${memCreated}, Skip: ${skipped}`);
      }
      
    } catch (error) {
      errors++;
      if (errors <= 3) {
        console.error(`Error order ${order.id}:`, error.message);
      }
    }
  }
  
  console.log('\n✅ TRANSACTIONS & MEMBERSHIPS IMPORTED!\n');
  console.log('💳 Transactions:', txCreated);
  console.log('🎫 Memberships:', memCreated);
  console.log('⏭️  Skipped:', skipped);
  console.log('❌ Errors:', errors);
  console.log('');
  
  // Create affiliate profiles for those who earned commissions
  console.log('🤝 CREATING AFFILIATE PROFILES...\n');
  
  for (const [userId, earnings] of affiliateEarnings.entries()) {
    try {
      const orders = affiliateOrders.get(userId) || 0;
      
      // Create affiliate profile
      await p.affiliateProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId: userId,
          isActive: true,
          approvalStatus: 'APPROVED',
          totalSales: 0,
          totalCommission: 0
        }
      });
      
      // Update wallet
      await p.wallet.upsert({
        where: { userId },
        update: {
          balance: { increment: earnings },
          totalEarnings: { increment: earnings }
        },
        create: {
          userId: userId,
          balance: earnings,
          balancePending: 0,
          totalEarnings: earnings,
          totalPayout: 0
        }
      });
      
      affCreated++;
      
      if (affCreated % 10 === 0) {
        console.log(`✓ ${affCreated} affiliates created, Total commission: Rp ${(totalCommission / 1000000).toFixed(2)}M`);
      }
      
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 IMPORT COMPLETED!');
  console.log('═══════════════════════════════════════');
  console.log('💳 Transactions Created:', txCreated.toLocaleString());
  console.log('🎫 Memberships Created:', memCreated.toLocaleString());
  console.log('🤝 Affiliate Profiles:', affCreated.toLocaleString());
  console.log('💰 Total Commission:', 'Rp', (totalCommission / 1000000).toFixed(2), 'Juta');
  console.log('═══════════════════════════════════════\n');
  
  // Final verification
  const [finalTx, finalMem, finalAff, finalUsers] = await Promise.all([
    p.transaction.count(),
    p.userMembership.count(),
    p.affiliateProfile.count(),
    p.user.count()
  ]);
  
  console.log('📊 FINAL DATABASE STATE:');
  console.log('👥 Users:', finalUsers.toLocaleString());
  console.log('💳 Transactions:', finalTx.toLocaleString());
  console.log('🎫 Memberships:', finalMem.toLocaleString());
  console.log('🤝 Affiliates:', finalAff.toLocaleString());
  console.log('');
  
  await p.$disconnect();
})();
