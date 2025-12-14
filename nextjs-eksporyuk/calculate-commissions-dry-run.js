const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function calculateAndDistributeCommissions() {
  try {
    console.log('💰 CALCULATING AND DISTRIBUTING AFFILIATE COMMISSIONS');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    // Create user email lookup
    const sejoliUserMap = new Map();
    for (const user of sejoliData.users) {
      sejoliUserMap.set(user.id, user.user_email);
    }
    
    // Get all users from database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    
    console.log(`👥 Found ${allUsers.length} users in database`);
    
    // Filter affiliate orders (completed only)
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && o.affiliate_id > 0 && o.status === 'completed'
    );
    
    console.log(`💼 Found ${affiliateOrders.length} completed affiliate orders`);
    
    // Commission calculation logic based on price
    function calculateCommission(amount) {
      if (amount >= 1000000) return 325000;
      if (amount >= 800000) return 325000;
      if (amount >= 600000) return 250000;
      if (amount >= 300000) return 200000;
      if (amount >= 35000) return 200000;
      return 0; // No commission for orders below 35K
    }
    
    // Track commission by affiliate
    const affiliateCommissions = {};
    const processedOrders = [];
    let totalCommission = 0;
    let ordersWithCommission = 0;
    let skippedOrders = 0;
    
    console.log('\n🔄 Processing affiliate orders...');
    
    for (const order of affiliateOrders) {
      const amount = parseFloat(order.grand_total) || 0;
      const commission = calculateCommission(amount);
      
      if (commission === 0) {
        skippedOrders++;
        continue;
      }
      
      // Get affiliate email
      const affiliateEmail = sejoliUserMap.get(order.affiliate_id);
      if (!affiliateEmail) {
        skippedOrders++;
        continue;
      }
      
      // Get affiliate user ID from database
      const affiliateUserId = userEmailMap.get(affiliateEmail);
      if (!affiliateUserId) {
        skippedOrders++;
        continue;
      }
      
      // Track commission for this affiliate
      if (!affiliateCommissions[affiliateUserId]) {
        affiliateCommissions[affiliateUserId] = {
          email: affiliateEmail,
          orders: 0,
          totalRevenue: 0,
          totalCommission: 0
        };
      }
      
      affiliateCommissions[affiliateUserId].orders++;
      affiliateCommissions[affiliateUserId].totalRevenue += amount;
      affiliateCommissions[affiliateUserId].totalCommission += commission;
      
      totalCommission += commission;
      ordersWithCommission++;
      
      processedOrders.push({
        orderId: order.id,
        affiliateUserId: affiliateUserId,
        amount: amount,
        commission: commission
      });
    }
    
    console.log(`\n📊 PROCESSING SUMMARY:`);
    console.log(`  Orders with commission: ${ordersWithCommission}`);
    console.log(`  Skipped orders: ${skippedOrders}`);
    console.log(`  Unique affiliates: ${Object.keys(affiliateCommissions).length}`);
    console.log(`  Total commission: Rp ${totalCommission.toLocaleString()}`);
    
    // Show top affiliates
    console.log(`\n🏆 TOP 10 AFFILIATES BY COMMISSION:`);
    const topAffiliates = Object.entries(affiliateCommissions)
      .sort((a, b) => b[1].totalCommission - a[1].totalCommission)
      .slice(0, 10);
    
    for (const [userId, data] of topAffiliates) {
      console.log(`\n${data.email}:`);
      console.log(`  Orders: ${data.orders}`);
      console.log(`  Revenue: Rp ${data.totalRevenue.toLocaleString()}`);
      console.log(`  Commission: Rp ${data.totalCommission.toLocaleString()}`);
    }
    
    // Ask for confirmation before distributing
    console.log(`\n\n⚠️  READY TO DISTRIBUTE COMMISSIONS`);
    console.log(`═══════════════════════════════════════════════════════════════════════`);
    console.log(`This will:`);
    console.log(`  1. Add Rp ${totalCommission.toLocaleString()} to affiliate wallets`);
    console.log(`  2. Update ${Object.keys(affiliateCommissions).length} affiliate wallet balances`);
    console.log(`  3. Record ${ordersWithCommission} commission transactions`);
    console.log(`\nDo you want to continue? (This is a dry run - no changes will be made yet)`);
    
    // Dry run - show what would be updated
    console.log(`\n\n📋 DRY RUN - WALLET UPDATES THAT WOULD BE MADE:`);
    console.log(`─────────────────────────────────────────────────────────────────────`);
    
    for (const [userId, data] of Object.entries(affiliateCommissions).slice(0, 20)) {
      console.log(`\n${data.email}:`);
      console.log(`  Would add: Rp ${data.totalCommission.toLocaleString()} to wallet balance`);
      console.log(`  From ${data.orders} orders`);
    }
    
    if (Object.keys(affiliateCommissions).length > 20) {
      console.log(`\n... and ${Object.keys(affiliateCommissions).length - 20} more affiliates`);
    }
    
    console.log(`\n\n✅ DRY RUN COMPLETE`);
    console.log(`To actually distribute commissions, create a new script with this logic.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateAndDistributeCommissions();