const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function distributeAffiliateCommissions() {
  try {
    console.log('💰 DISTRIBUTING AFFILIATE COMMISSIONS TO WALLETS');
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
    
    // Filter affiliate orders (completed only)
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && o.affiliate_id > 0 && o.status === 'completed'
    );
    
    // Commission calculation logic
    function calculateCommission(amount) {
      if (amount >= 1000000) return 325000;
      if (amount >= 800000) return 325000;
      if (amount >= 600000) return 250000;
      if (amount >= 300000) return 200000;
      if (amount >= 35000) return 200000;
      return 0;
    }
    
    // Track commission by affiliate
    const affiliateCommissions = {};
    
    for (const order of affiliateOrders) {
      const amount = parseFloat(order.grand_total) || 0;
      const commission = calculateCommission(amount);
      
      if (commission === 0) continue;
      
      // Get affiliate email and user ID
      const affiliateEmail = sejoliUserMap.get(order.affiliate_id);
      if (!affiliateEmail) continue;
      
      const affiliateUserId = userEmailMap.get(affiliateEmail);
      if (!affiliateUserId) continue;
      
      if (!affiliateCommissions[affiliateUserId]) {
        affiliateCommissions[affiliateUserId] = {
          email: affiliateEmail,
          orders: 0,
          totalCommission: 0
        };
      }
      
      affiliateCommissions[affiliateUserId].orders++;
      affiliateCommissions[affiliateUserId].totalCommission += commission;
    }
    
    console.log(`\n📊 DISTRIBUTION PLAN:`);
    console.log(`  Affiliates to update: ${Object.keys(affiliateCommissions).length}`);
    console.log(`  Total commission: Rp ${Object.values(affiliateCommissions).reduce((sum, a) => sum + a.totalCommission, 0).toLocaleString()}`);
    
    console.log(`\n🔄 Distributing commissions to wallets...`);
    
    let updated = 0;
    let created = 0;
    let errors = 0;
    
    for (const [userId, data] of Object.entries(affiliateCommissions)) {
      try {
        // Upsert wallet - create if doesn't exist, update if exists
        const wallet = await prisma.wallet.upsert({
          where: { userId: userId },
          create: {
            userId: userId,
            balance: data.totalCommission,
            balancePending: 0,
            totalEarnings: data.totalCommission,
            totalWithdrawn: 0
          },
          update: {
            balance: {
              increment: data.totalCommission
            },
            totalEarnings: {
              increment: data.totalCommission
            }
          }
        });
        
        if (wallet) {
          updated++;
          
          // Log progress every 10 affiliates
          if (updated % 10 === 0) {
            console.log(`  ✅ Updated ${updated}/${Object.keys(affiliateCommissions).length} wallets...`);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Error updating wallet for ${data.email}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ DISTRIBUTION COMPLETE!`);
    console.log(`  ✅ Successfully updated: ${updated} wallets`);
    console.log(`  ❌ Errors: ${errors}`);
    
    // Verify final wallet totals
    console.log(`\n🔍 VERIFICATION:`);
    
    const finalWallets = await prisma.wallet.aggregate({
      _sum: {
        balance: true,
        totalEarnings: true
      },
      _count: true,
      where: {
        balance: { gt: 0 }
      }
    });
    
    console.log(`  Wallets with balance: ${finalWallets._count}`);
    console.log(`  Total balance: Rp ${(finalWallets._sum.balance || 0).toLocaleString()}`);
    console.log(`  Total earnings: Rp ${(finalWallets._sum.totalEarnings || 0).toLocaleString()}`);
    
    // Show top 10 wallets
    console.log(`\n💰 TOP 10 AFFILIATE WALLETS:`);
    
    const topWallets = await prisma.wallet.findMany({
      where: {
        balance: { gt: 0 }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        balance: 'desc'
      },
      take: 10
    });
    
    for (const wallet of topWallets) {
      console.log(`\n${wallet.user.name || wallet.user.email}:`);
      console.log(`  Balance: Rp ${parseFloat(wallet.balance).toLocaleString()}`);
      console.log(`  Total Earnings: Rp ${parseFloat(wallet.totalEarnings).toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

distributeAffiliateCommissions();