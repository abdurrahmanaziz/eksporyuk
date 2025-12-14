const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkCurrentCommissions() {
  try {
    console.log('🔍 CHECKING CURRENT DATABASE COMMISSION SETUP');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    // Check Products table for commission rates
    console.log('\n📦 PRODUCTS IN DATABASE:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });
    
    if (products.length > 0) {
      for (const product of products) {
        console.log(`\n${product.name}:`);
        console.log(`  Price: Rp ${parseFloat(product.price || 0).toLocaleString()}`);
        console.log(`  Commission Type: ${product.commissionType || 'N/A'}`);
        console.log(`  Commission Rate: ${product.affiliateCommissionRate || 'N/A'}`);
        console.log(`  Transactions: ${product._count.transactions}`);
      }
    } else {
      console.log('❌ No products found in database');
    }
    
    // Check Memberships for commission rates
    console.log('\n\n🎫 MEMBERSHIPS IN DATABASE:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        _count: {
          select: {
            userMemberships: true
          }
        }
      }
    });
    
    for (const membership of memberships) {
      console.log(`\n${membership.name}:`);
      console.log(`  Price: Rp ${parseFloat(membership.price || 0).toLocaleString()}`);
      console.log(`  Commission Type: ${membership.commissionType || 'N/A'}`);
      console.log(`  Commission Rate: ${membership.affiliateCommissionRate || 'N/A'}`);
      console.log(`  User Memberships: ${membership._count.userMemberships}`);
    }
    
    // Check current wallet balances
    console.log('\n\n💰 CURRENT WALLET BALANCES:');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const walletsWithBalance = await prisma.wallet.findMany({
      where: {
        OR: [
          { balance: { gt: 0 } },
          { balancePending: { gt: 0 } }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (walletsWithBalance.length > 0) {
      for (const wallet of walletsWithBalance) {
        console.log(`\n${wallet.user.name} (${wallet.user.email}):`);
        console.log(`  Role: ${wallet.user.role}`);
        console.log(`  Balance: Rp ${parseFloat(wallet.balance || 0).toLocaleString()}`);
        console.log(`  Pending: Rp ${parseFloat(wallet.balancePending || 0).toLocaleString()}`);
      }
      
      const totalBalance = walletsWithBalance.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);
      const totalPending = walletsWithBalance.reduce((sum, w) => sum + parseFloat(w.balancePending || 0), 0);
      
      console.log(`\n📊 TOTALS:`);
      console.log(`  Total Balance: Rp ${totalBalance.toLocaleString()}`);
      console.log(`  Total Pending: Rp ${totalPending.toLocaleString()}`);
      console.log(`  Grand Total: Rp ${(totalBalance + totalPending).toLocaleString()}`);
    } else {
      console.log('❌ No wallets with balance found');
    }
    
    // Load Sejoli data to map product prices to commission
    console.log('\n\n💡 SUGGESTED COMMISSION MAPPING (Based on Sejoli data):');
    console.log('─────────────────────────────────────────────────────────────────────');
    
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    // Group affiliate orders by price range to identify commission structure
    const priceRanges = {
      'Rp 35,000 - Rp 50,000': { orders: 0, revenue: 0, suggestedCommission: 200000 },
      'Rp 300,000 - Rp 500,000': { orders: 0, revenue: 0, suggestedCommission: 200000 },
      'Rp 600,000 - Rp 800,000': { orders: 0, revenue: 0, suggestedCommission: 250000 },
      'Rp 800,000 - Rp 1,000,000': { orders: 0, revenue: 0, suggestedCommission: 325000 },
      'Rp 1,000,000+': { orders: 0, revenue: 0, suggestedCommission: 325000 }
    };
    
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && o.affiliate_id > 0 && o.status === 'completed'
    );
    
    for (const order of affiliateOrders) {
      const amount = parseFloat(order.grand_total) || 0;
      
      if (amount >= 1000000) {
        priceRanges['Rp 1,000,000+'].orders++;
        priceRanges['Rp 1,000,000+'].revenue += amount;
      } else if (amount >= 800000) {
        priceRanges['Rp 800,000 - Rp 1,000,000'].orders++;
        priceRanges['Rp 800,000 - Rp 1,000,000'].revenue += amount;
      } else if (amount >= 600000) {
        priceRanges['Rp 600,000 - Rp 800,000'].orders++;
        priceRanges['Rp 600,000 - Rp 800,000'].revenue += amount;
      } else if (amount >= 300000) {
        priceRanges['Rp 300,000 - Rp 500,000'].orders++;
        priceRanges['Rp 300,000 - Rp 500,000'].revenue += amount;
      } else if (amount >= 35000) {
        priceRanges['Rp 35,000 - Rp 50,000'].orders++;
        priceRanges['Rp 35,000 - Rp 50,000'].revenue += amount;
      }
    }
    
    console.log('\nBased on price ranges:');
    for (const [range, data] of Object.entries(priceRanges)) {
      if (data.orders > 0) {
        const totalCommission = data.orders * data.suggestedCommission;
        console.log(`\n${range}:`);
        console.log(`  Orders: ${data.orders}`);
        console.log(`  Revenue: Rp ${data.revenue.toLocaleString()}`);
        console.log(`  Suggested Commission: Rp ${data.suggestedCommission.toLocaleString()} per sale`);
        console.log(`  Total Commission: Rp ${totalCommission.toLocaleString()}`);
      }
    }
    
    // Calculate total expected commission
    const totalExpectedCommission = Object.values(priceRanges).reduce(
      (sum, data) => sum + (data.orders * data.suggestedCommission), 
      0
    );
    
    console.log(`\n📊 EXPECTED TOTAL COMMISSION: Rp ${totalExpectedCommission.toLocaleString()}`);
    console.log(`\n⚠️  CURRENT COMMISSION PAID: Rp 0`);
    console.log(`\n❌ DISCREPANCY: Rp ${totalExpectedCommission.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentCommissions();