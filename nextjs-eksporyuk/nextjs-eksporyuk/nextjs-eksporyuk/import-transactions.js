/**
 * IMPORT TRANSACTIONS, MEMBERSHIPS & AFFILIATES ONLY
 * Run after users are imported
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const MEMBERSHIP_MAP = {
  // Lifetime
  13401: 'cmj547h7y001eit1eirlzdklz', 3840: 'cmj547h7y001eit1eirlzdklz', 
  6068: 'cmj547h7y001eit1eirlzdklz', 16956: 'cmj547h7y001eit1eirlzdklz',
  15234: 'cmj547h7y001eit1eirlzdklz', 17920: 'cmj547h7y001eit1eirlzdklz',
  8910: 'cmj547h7y001eit1eirlzdklz',
  // 12 Bulan
  8683: 'cmj547h4d001dit1edotcuy8b', 13399: 'cmj547h4d001dit1edotcuy8b', 
  8915: 'cmj547h4d001dit1edotcuy8b',
  // 6 Bulan
  13400: 'cmj547h01001cit1e7n2znhuo', 8684: 'cmj547h01001cit1e7n2znhuo',
  8914: 'cmj547h01001cit1e7n2znhuo',
  // 1 Bulan
  179: 'cmj547gmc001ait1en83tmjdc',
  // 3 Bulan
  13398: 'cmj547gwo001bit1egx205tsi',
};

const DURATION_MAP = {
  13401: null, 3840: null, 6068: null, 16956: null, 15234: null, 17920: null, 8910: null,
  8683: 365, 13399: 365, 8915: 365,
  13400: 180, 8684: 180, 8914: 180,
  179: 30, 13398: 90,
};

async function main() {
  console.log('\n🔄 IMPORT TRANSACTIONS & MEMBERSHIPS\n');
  
  const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${data.orders.length} orders\n`);
  
  // Get all users first for quick lookup
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userMap = new Map(allUsers.map(u => [u.email, u.id]));
  console.log(`Loaded ${userMap.size} users from DB\n`);
  
  let txCount = 0;
  let memberCount = 0;
  let affCount = 0;
  let errors = 0;
  
  for (let i = 0; i < data.orders.length; i++) {
    const order = data.orders[i];
    
    try {
      const userId = userMap.get(order.user_email);
      if (!userId) continue;
      
      const productId = parseInt(order.product_id);
      const membershipId = MEMBERSHIP_MAP[productId];
      const duration = DURATION_MAP[productId];
      
      if (!membershipId) continue;
      
      const total = parseFloat(order.grand_total || order.total || 0);
      const affiliateCommission = parseFloat(order.affiliate_commission || 0);
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: userId,
          type: 'MEMBERSHIP_PURCHASE',
          amount: total,
          status: order.status === 'completed' ? 'SUCCESS' : 'PENDING',
          description: `Purchase ${order.product_name || 'Membership'}`,
          metadata: JSON.stringify({
            orderId: order.order_id,
            productId: productId,
            productName: order.product_name,
            affiliateId: order.affiliate_id,
            affiliateCommission: affiliateCommission,
          }),
          createdAt: order.order_date ? new Date(order.order_date) : new Date(),
        }
      });
      txCount++;
      
      // Create membership if completed
      if (order.status === 'completed') {
        const startDate = order.order_date ? new Date(order.order_date) : new Date();
        let expiryDate = null;
        
        if (duration) {
          expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + duration);
        }
        
        await prisma.userMembership.upsert({
          where: { userId: userId },
          update: {
            membershipId: membershipId,
            status: 'ACTIVE',
            startDate: startDate,
            expiryDate: expiryDate,
          },
          create: {
            userId: userId,
            membershipId: membershipId,
            status: 'ACTIVE',
            startDate: startDate,
            expiryDate: expiryDate,
            autoRenew: false,
          }
        });
        memberCount++;
      }
      
      // Handle affiliate
      if (order.affiliate_email && affiliateCommission > 0) {
        const affUserId = userMap.get(order.affiliate_email);
        if (affUserId) {
          // Create affiliate profile
          await prisma.affiliateProfile.upsert({
            where: { userId: affUserId },
            update: {},
            create: {
              userId: affUserId,
              isActive: true,
              approvalStatus: 'APPROVED',
              totalSales: 0,
              totalCommission: 0,
            }
          });
          
          // Update wallet
          if (order.status === 'completed') {
            await prisma.wallet.update({
              where: { userId: affUserId },
              data: {
                balance: { increment: affiliateCommission },
                totalEarnings: { increment: affiliateCommission },
              }
            });
            affCount++;
          }
        }
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`   ✓ Progress: ${i + 1}/${data.orders.length} orders | TX: ${txCount}, Memberships: ${memberCount}, Affiliates: ${affCount}`);
      }
      
    } catch (e) {
      errors++;
      if (errors <= 10) console.log(`   ⚠ Error order ${order.order_id}:`, e.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ IMPORT SELESAI!');
  console.log('═══════════════════════════════════════');
  console.log(`💳 Transactions: ${txCount}`);
  console.log(`🎫 Memberships: ${memberCount}`);
  console.log(`🤝 Affiliate Commissions: ${affCount}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
