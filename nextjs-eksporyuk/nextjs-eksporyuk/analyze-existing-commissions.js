const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function analyzeExistingCommissions() {
  try {
    console.log('🔍 ANALYZING EXISTING COMMISSIONS TO FIND RATE\n');
    
    // Get wallets with balance
    const wallets = await prisma.wallet.findMany({
      where: { balance: { gt: 0 } },
      include: {
        user: {
          select: { 
            email: true,
            affiliateProfile: {
              select: { affiliateCode: true }
            }
          }
        }
      },
      orderBy: { balance: 'desc' }
    });
    
    console.log(`Found ${wallets.length} wallets with commission\n`);
    
    let totalCommission = 0;
    const sampleWallets = wallets.slice(0, 10);
    
    console.log('Top 10 wallets:');
    for (const wallet of sampleWallets) {
      totalCommission += wallet.balance;
      const affCode = wallet.user.affiliateProfile?.affiliateCode || 'N/A';
      console.log(`  ${wallet.user.email.padEnd(45)} | Rp ${wallet.balance.toLocaleString().padStart(15)} | Code: ${affCode}`);
    }
    
    console.log(`\nTotal commission in top 10: Rp ${totalCommission.toLocaleString()}`);
    
    // Load Sejoli data
    const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    // Create affiliate map (affiliate_id -> user_email)
    const affiliateMap = {};
    for (const aff of sejoliData.affiliates) {
      affiliateMap[aff.user_id] = aff.user_email;
    }
    
    console.log('\n=== CHECKING COMMISSION CALCULATIONS ===\n');
    
    // Check first wallet's transactions
    const firstWallet = wallets[0];
    console.log(`Analyzing: ${firstWallet.user.email}`);
    
    // Find this user's affiliate_id in Sejoli
    const sejoliAffiliate = sejoliData.affiliates.find(a => a.user_email.toLowerCase() === firstWallet.user.email.toLowerCase());
    
    if (sejoliAffiliate) {
      console.log(`  Sejoli affiliate user_id: ${sejoliAffiliate.user_id}`);
      
      // Find completed orders with this affiliate_id
      const affiliateOrders = sejoliData.orders.filter(o => 
        o.affiliate_id === sejoliAffiliate.user_id && 
        o.status === 'completed'
      );
      
      console.log(`  Completed orders as affiliate: ${affiliateOrders.length}`);
      
      if (affiliateOrders.length > 0) {
        let totalRevenue = 0;
        const productRevenue = {};
        
        for (const order of affiliateOrders) {
          totalRevenue += order.grand_total;
          
          if (!productRevenue[order.product_id]) {
            productRevenue[order.product_id] = { count: 0, total: 0 };
          }
          productRevenue[order.product_id].count++;
          productRevenue[order.product_id].total += order.grand_total;
        }
        
        console.log(`  Total revenue from affiliate orders: Rp ${totalRevenue.toLocaleString()}`);
        console.log(`  Current commission balance: Rp ${firstWallet.balance.toLocaleString()}`);
        
        const estimatedRate = (firstWallet.balance / totalRevenue * 100).toFixed(2);
        console.log(`  Estimated commission rate: ${estimatedRate}%`);
        
        console.log('\n  Revenue by product:');
        for (const [productId, data] of Object.entries(productRevenue)) {
          console.log(`    Product ${productId}: ${data.count} orders, Rp ${data.total.toLocaleString()}`);
        }
        
        // Sample 5 orders
        console.log('\n  Sample orders:');
        for (const order of affiliateOrders.slice(0, 5)) {
          const estimatedComm = order.grand_total * (firstWallet.balance / totalRevenue);
          console.log(`    Order #${order.id}: Rp ${order.grand_total.toLocaleString()} → Est. commission: Rp ${Math.round(estimatedComm).toLocaleString()}`);
        }
      }
    }
    
    console.log('\n=== ANALYZING COMMISSION PATTERNS ===\n');
    
    // Analyze multiple wallets
    for (let i = 0; i < Math.min(5, wallets.length); i++) {
      const wallet = wallets[i];
      const sejoliAff = sejoliData.affiliates.find(a => a.user_email.toLowerCase() === wallet.user.email.toLowerCase());
      
      if (sejoliAff) {
        const orders = sejoliData.orders.filter(o => 
          o.affiliate_id === sejoliAff.user_id && 
          o.status === 'completed'
        );
        
        if (orders.length > 0) {
          const totalRev = orders.reduce((sum, o) => sum + o.grand_total, 0);
          const rate = (wallet.balance / totalRev * 100).toFixed(2);
          
          console.log(`${wallet.user.email.padEnd(45)} | ${orders.length} orders | Rp ${totalRev.toLocaleString().padStart(15)} | Rate: ${rate}%`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExistingCommissions();
