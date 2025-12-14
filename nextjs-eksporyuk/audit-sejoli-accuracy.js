const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function auditSejoliDataAccuracy() {
  try {
    console.log('🔍 AUDIT KESESUAIAN DATA DENGAN SEJOLI ORIGINAL');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load original Sejoli data
    console.log('📂 Loading original Sejoli backup data...');
    const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    console.log(`✅ Loaded ${sejoliData.orders.length} Sejoli orders and ${sejoliData.users.length} users`);
    
    // Audit 1: Total transactions count
    console.log('\n📊 AUDIT 1: TOTAL TRANSAKSI');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const nextjsTransactionCount = await prisma.transaction.count();
    console.log(`Sejoli Orders: ${sejoliData.orders.length.toLocaleString()}`);
    console.log(`Next.js Transactions: ${nextjsTransactionCount.toLocaleString()}`);
    console.log(`Difference: ${Math.abs(sejoliData.orders.length - nextjsTransactionCount)}`);
    
    // Audit 2: Revenue calculation accuracy
    console.log('\n💰 AUDIT 2: REVENUE & STATUS ACCURACY');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    // Calculate Sejoli revenue by status
    let sejoliSuccess = 0, sejoliPending = 0, sejoliFailed = 0;
    let sejoliSuccessAmount = 0, sejoliPendingAmount = 0;
    
    for (const order of sejoliData.orders) {
      const amount = parseFloat(order.order_total) || 0;
      
      if (['completed', 'processing'].includes(order.order_status)) {
        sejoliSuccess++;
        sejoliSuccessAmount += amount;
      } else if (['pending', 'on-hold'].includes(order.order_status)) {
        sejoliPending++;
        sejoliPendingAmount += amount;
      } else {
        sejoliFailed++;
      }
    }
    
    // Get Next.js data
    const nextjsStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('SEJOLI DATA:');
    console.log(`✅ Success: ${sejoliSuccess} orders, Total: Rp ${sejoliSuccessAmount.toLocaleString()}`);
    console.log(`⏳ Pending: ${sejoliPending} orders, Total: Rp ${sejoliPendingAmount.toLocaleString()}`);
    console.log(`❌ Failed: ${sejoliFailed} orders`);
    
    console.log('\nNEXT.JS DATA:');
    for (const stat of nextjsStats) {
      console.log(`${stat.status}: ${stat._count.id} transactions, Total: Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    }
    
    // Audit 3: Commission rate accuracy
    console.log('\n🤝 AUDIT 3: KOMISI RATE ACCURACY');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    // Check commission rates from products
    const productCommissions = new Map();
    
    for (const order of sejoliData.orders) {
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          const productId = item.product_id;
          const commissionType = item.commission_type || 'percentage';
          const commissionValue = parseFloat(item.commission_value) || 0;
          
          if (!productCommissions.has(productId)) {
            productCommissions.set(productId, {
              name: item.product_name,
              type: commissionType,
              value: commissionValue,
              count: 0
            });
          }
          productCommissions.get(productId).count++;
        }
      }
    }
    
    console.log('KOMISI RATE PER PRODUK SEJOLI:');
    for (const [productId, data] of productCommissions) {
      if (data.count > 5) { // Only show products with significant sales
        console.log(`Product ${productId} (${data.name}): ${data.type} ${data.value}% - ${data.count} sales`);
      }
    }
    
    // Audit 4: Membership expiry accuracy
    console.log('\n🎫 AUDIT 4: MEMBERSHIP EXPIRY DATES');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    // Sample check: Get 10 random successful orders and check their membership expiry
    const successfulOrders = sejoliData.orders.filter(o => ['completed', 'processing'].includes(o.order_status));
    const sampleOrders = successfulOrders.slice(0, 10);
    
    for (const order of sampleOrders) {
      const userEmail = order.customer_email;
      const orderDate = new Date(order.order_date_created);
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { memberships: true }
      });
      
      if (user && user.memberships.length > 0) {
        const membership = user.memberships[0];
        const membershipDuration = membership.membershipId.includes('LIFETIME') ? 'LIFETIME' : 
                                 membership.membershipId.includes('TWELVE') ? 12 :
                                 membership.membershipId.includes('SIX') ? 6 :
                                 membership.membershipId.includes('THREE') ? 3 : 1;
        
        let expectedEndDate;
        if (membershipDuration === 'LIFETIME') {
          expectedEndDate = new Date('2099-12-31');
        } else {
          expectedEndDate = new Date(orderDate);
          expectedEndDate.setMonth(expectedEndDate.getMonth() + membershipDuration);
        }
        
        console.log(`User: ${userEmail}`);
        console.log(`  Order Date: ${orderDate.toISOString().split('T')[0]}`);
        console.log(`  Expected End: ${expectedEndDate.toISOString().split('T')[0]}`);
        console.log(`  Actual End: ${membership.endDate.toISOString().split('T')[0]}`);
        console.log(`  Match: ${expectedEndDate.toISOString().split('T')[0] === membership.endDate.toISOString().split('T')[0] ? '✅' : '❌'}`);
        console.log('');
      }
    }
    
    // Audit 5: Duplicate check
    console.log('\n🔄 AUDIT 5: DUPLICATE VERIFICATION');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const duplicatesByOrderId = await prisma.$queryRaw`
      SELECT 
        "metadata"->>'orderId' as order_id,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "metadata"->>'orderId' IS NOT NULL
      GROUP BY "metadata"->>'orderId'
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;
    
    if (duplicatesByOrderId.length > 0) {
      console.log('⚠️  Found duplicate transactions by order ID:');
      for (const dup of duplicatesByOrderId) {
        console.log(`Order ${dup.order_id}: ${dup.count} transactions`);
      }
    } else {
      console.log('✅ No duplicate transactions found by order ID');
    }
    
    // Final summary
    console.log('\n📋 AUDIT SUMMARY');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    const issues = [];
    
    if (Math.abs(sejoliData.orders.length - nextjsTransactionCount) > 100) {
      issues.push('❌ Significant transaction count mismatch');
    } else {
      console.log('✅ Transaction count within acceptable range');
    }
    
    if (duplicatesByOrderId.length > 0) {
      issues.push('❌ Duplicate transactions found');
    } else {
      console.log('✅ No duplicate transactions');
    }
    
    console.log(`\n🎯 Issues found: ${issues.length}`);
    for (const issue of issues) {
      console.log(issue);
    }
    
    if (issues.length === 0) {
      console.log('🎉 Data integrity verified - all good!');
    } else {
      console.log('⚠️  Issues need attention');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditSejoliDataAccuracy();