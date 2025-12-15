const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function auditCurrentDBVsSejoli() {
  try {
    console.log('🔍 AUDIT DATABASE NEXT.JS VS SEJOLI WP');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
    // 1. LOAD SEJOLI DATA
    console.log('📂 Loading Sejoli WP data...');
    const sejoliPath = 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    console.log(`✅ Loaded ${sejoliData.orders.length.toLocaleString()} orders from Sejoli\n`);
    
    // 2. ANALYZE SEJOLI ORDERS BY STATUS
    console.log('📊 SEJOLI WP - GROUND TRUTH DATA:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const sejoliByStatus = {};
    let sejoliTotalAmount = 0;
    
    for (const order of sejoliData.orders) {
      const status = order.status || 'unknown';
      const amount = parseFloat(order.grand_total) || 0;
      
      if (!sejoliByStatus[status]) {
        sejoliByStatus[status] = { count: 0, amount: 0, orders: [] };
      }
      
      sejoliByStatus[status].count++;
      sejoliByStatus[status].amount += amount;
      sejoliByStatus[status].orders.push({
        id: order.ID,
        email: order.user_email,
        amount: amount,
        date: order.order_date,
        product: order.product_id
      });
      
      sejoliTotalAmount += amount;
    }
    
    for (const [status, data] of Object.entries(sejoliByStatus).sort((a, b) => b[1].count - a[1].count)) {
      console.log(`  ${status.padEnd(20)} : ${String(data.count).padStart(6)} orders | Rp ${data.amount.toLocaleString('id-ID').padStart(20)}`);
    }
    
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    console.log(`  ${'TOTAL'.padEnd(20)} : ${String(sejoliData.orders.length).padStart(6)} orders | Rp ${sejoliTotalAmount.toLocaleString('id-ID').padStart(20)}\n`);
    
    // 3. TARGET MAPPING (STATUS CONVERSION)
    console.log('🎯 TARGET MAPPING (Sejoli → Next.js):');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const targetSuccess = sejoliByStatus['completed'] || { count: 0, amount: 0 };
    const targetPending = {
      count: (sejoliByStatus['payment-confirm']?.count || 0) + (sejoliByStatus['on-hold']?.count || 0),
      amount: (sejoliByStatus['payment-confirm']?.amount || 0) + (sejoliByStatus['on-hold']?.amount || 0)
    };
    const targetFailed = {
      count: (sejoliByStatus['cancelled']?.count || 0) + (sejoliByStatus['refunded']?.count || 0),
      amount: (sejoliByStatus['cancelled']?.amount || 0) + (sejoliByStatus['refunded']?.amount || 0)
    };
    
    console.log(`  ✅ SUCCESS (completed)           : ${String(targetSuccess.count).padStart(6)} → Rp ${targetSuccess.amount.toLocaleString('id-ID').padStart(20)}`);
    console.log(`  ⏳ PENDING (payment-confirm+hold): ${String(targetPending.count).padStart(6)} → Rp ${targetPending.amount.toLocaleString('id-ID').padStart(20)}`);
    console.log(`  ❌ FAILED (cancelled+refunded)   : ${String(targetFailed.count).padStart(6)} → Rp ${targetFailed.amount.toLocaleString('id-ID').padStart(20)}\n`);
    
    // 4. CURRENT NEXT.JS DATABASE
    console.log('🗄️  CURRENT NEXT.JS DATABASE:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const currentTransactions = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    const currentByStatus = {};
    let currentTotal = 0;
    let currentTotalAmount = 0;
    
    for (const stat of currentTransactions) {
      currentByStatus[stat.status] = {
        count: stat._count.id,
        amount: stat._sum.amount || 0
      };
      currentTotal += stat._count.id;
      currentTotalAmount += stat._sum.amount || 0;
      
      console.log(`  ${stat.status.padEnd(20)} : ${String(stat._count.id).padStart(6)} trans | Rp ${(stat._sum.amount || 0).toLocaleString('id-ID').padStart(20)}`);
    }
    
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    console.log(`  ${'TOTAL'.padEnd(20)} : ${String(currentTotal).padStart(6)} trans | Rp ${currentTotalAmount.toLocaleString('id-ID').padStart(20)}\n`);
    
    // 5. MEMBERSHIPS
    console.log('🎫 MEMBERSHIPS:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const totalMemberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({
      where: { endDate: { gte: new Date() } }
    });
    const expiredMemberships = await prisma.userMembership.count({
      where: { endDate: { lt: new Date() } }
    });
    
    console.log(`  Total Memberships  : ${totalMemberships.toLocaleString()}`);
    console.log(`  Active (not expired): ${activeMemberships.toLocaleString()}`);
    console.log(`  Expired            : ${expiredMemberships.toLocaleString()}`);
    console.log(`  Expected (SUCCESS) : ${targetSuccess.count.toLocaleString()}\n`);
    
    // 6. COMMISSIONS
    console.log('💰 COMMISSIONS & WALLETS:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const walletsWithBalance = await prisma.wallet.findMany({
      where: { balance: { gt: 0 } },
      include: { user: { select: { email: true, name: true } } }
    });
    
    let totalCommissionPaid = 0;
    for (const wallet of walletsWithBalance) {
      totalCommissionPaid += wallet.balance;
      console.log(`  ${wallet.user.email.padEnd(40)} : Rp ${wallet.balance.toLocaleString('id-ID').padStart(15)}`);
    }
    
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    console.log(`  Total Commission Paid: Rp ${totalCommissionPaid.toLocaleString('id-ID')}\n`);
    
    // 7. SEJOLI AFFILIATES
    console.log('🤝 SEJOLI AFFILIATE ORDERS:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const affiliateOrders = sejoliData.orders.filter(o => 
      o.affiliate_id && parseInt(o.affiliate_id) > 0 && o.status === 'completed'
    );
    
    console.log(`  Orders with affiliates: ${affiliateOrders.length.toLocaleString()}`);
    
    // Group by affiliate_id
    const affiliateStats = {};
    for (const order of affiliateOrders) {
      const affId = order.affiliate_id;
      if (!affiliateStats[affId]) {
        affiliateStats[affId] = { count: 0, amount: 0 };
      }
      affiliateStats[affId].count++;
      affiliateStats[affId].amount += parseFloat(order.grand_total) || 0;
    }
    
    console.log(`  Unique affiliates: ${Object.keys(affiliateStats).length}\n`);
    
    // Top 5 affiliates
    const topAffiliates = Object.entries(affiliateStats)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5);
    
    console.log('  Top 5 Affiliates by Revenue:');
    for (const [affId, stats] of topAffiliates) {
      console.log(`    Affiliate ID ${affId}: ${stats.count} orders, Rp ${stats.amount.toLocaleString('id-ID')}`);
    }
    console.log();
    
    // 8. PRODUCTS & COMMISSION RATES
    console.log('📦 SEJOLI PRODUCTS & COMMISSION RATES:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    // Check if products exist in Sejoli data
    if (sejoliData.products && Array.isArray(sejoliData.products)) {
      console.log(`  Total products: ${sejoliData.products.length}`);
      
      // Sample first 10 products with commission info
      const productsWithCommission = sejoliData.products
        .filter(p => p.affiliate_commission || p.commission_rate)
        .slice(0, 10);
      
      if (productsWithCommission.length > 0) {
        console.log('\n  Sample products with commission rates:');
        for (const product of productsWithCommission) {
          const commRate = product.affiliate_commission || product.commission_rate || 'N/A';
          console.log(`    ${product.name || product.title || 'Unknown'}: ${commRate}`);
        }
      } else {
        console.log('  ⚠️  No commission rate data found in products');
      }
    } else {
      console.log('  ⚠️  No products array found in Sejoli data');
    }
    console.log();
    
    // 9. ACCURACY CHECK
    console.log('🎯 ACCURACY VERIFICATION:');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    
    const currentSuccess = currentByStatus['SUCCESS'] || { count: 0, amount: 0 };
    const currentPending = currentByStatus['PENDING'] || { count: 0, amount: 0 };
    const currentFailed = currentByStatus['FAILED'] || { count: 0, amount: 0 };
    
    const checks = [
      {
        name: 'SUCCESS Count',
        current: currentSuccess.count,
        target: targetSuccess.count,
        match: currentSuccess.count === targetSuccess.count
      },
      {
        name: 'SUCCESS Amount',
        current: currentSuccess.amount,
        target: targetSuccess.amount,
        match: Math.abs(currentSuccess.amount - targetSuccess.amount) < 1000
      },
      {
        name: 'PENDING Count',
        current: currentPending.count,
        target: targetPending.count,
        match: currentPending.count === targetPending.count
      },
      {
        name: 'Memberships',
        current: totalMemberships,
        target: targetSuccess.count,
        match: totalMemberships === targetSuccess.count
      }
    ];
    
    let passed = 0;
    for (const check of checks) {
      const status = check.match ? '✅ PASS' : '❌ FAIL';
      const currentStr = typeof check.current === 'number' && check.current > 10000 
        ? `Rp ${check.current.toLocaleString('id-ID')}`
        : check.current.toLocaleString();
      const targetStr = typeof check.target === 'number' && check.target > 10000
        ? `Rp ${check.target.toLocaleString('id-ID')}`
        : check.target.toLocaleString();
      
      console.log(`  ${status} | ${check.name.padEnd(20)} : ${currentStr.padStart(20)} vs ${targetStr.padStart(20)}`);
      if (check.match) passed++;
    }
    
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    console.log(`\n  🎯 ACCURACY SCORE: ${passed}/${checks.length} checks passed (${Math.round(passed/checks.length*100)}%)\n`);
    
    if (passed === checks.length) {
      console.log('  🎉 PERFECT! Data 100% sesuai dengan Sejoli WP!');
    } else {
      console.log('  ⚠️  PERLU PERBAIKAN:');
      for (const check of checks) {
        if (!check.match) {
          const diff = check.current - check.target;
          console.log(`     - ${check.name}: kurang ${Math.abs(diff).toLocaleString()} ${diff > 0 ? '(kelebihan)' : '(kekurangan)'}`);
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error during audit:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

auditCurrentDBVsSejoli();
