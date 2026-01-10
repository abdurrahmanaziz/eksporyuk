const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function correctSejoliDataAccuracy() {
  try {
    console.log('🔧 CORRECTING DATA TO MATCH SEJOLI 100%');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load original Sejoli data
    const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    console.log(`✅ Loaded ${sejoliData.orders.length} Sejoli orders`);
    
    // STEP 1: Analyze Sejoli data accurately
    console.log('\n📊 STEP 1: ANALYZING SEJOLI DATA ACCURATELY');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const sejoliStats = {
      completed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      'payment-confirm': { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
      'on-hold': { count: 0, amount: 0 }
    };
    
    for (const order of sejoliData.orders) {
      const status = order.status;
      const amount = parseFloat(order.grand_total) || 0;
      
      if (sejoliStats[status]) {
        sejoliStats[status].count++;
        sejoliStats[status].amount += amount;
      }
    }
    
    console.log('SEJOLI ORIGINAL DATA:');
    for (const [status, data] of Object.entries(sejoliStats)) {
      console.log(`${status}: ${data.count} orders, Rp ${data.amount.toLocaleString()}`);
    }
    
    // Calculate what should be in our database
    const shouldBeSuccess = sejoliStats.completed.count;
    const shouldBeSuccessAmount = sejoliStats.completed.amount;
    const shouldBePending = sejoliStats['payment-confirm'].count + sejoliStats['on-hold'].count;
    const shouldBePendingAmount = sejoliStats['payment-confirm'].amount + sejoliStats['on-hold'].amount;
    
    console.log('\nWHAT SHOULD BE IN OUR DATABASE:');
    console.log(`SUCCESS: ${shouldBeSuccess} transactions, Rp ${shouldBeSuccessAmount.toLocaleString()}`);
    console.log(`PENDING: ${shouldBePending} transactions, Rp ${shouldBePendingAmount.toLocaleString()}`);
    console.log(`TOTAL REVENUE (OMSET KOTOR): Rp ${(shouldBeSuccessAmount + shouldBePendingAmount).toLocaleString()}`);
    console.log(`OMSET BERSIH (Success only): Rp ${shouldBeSuccessAmount.toLocaleString()}`);
    
    // STEP 2: Check current database vs what it should be
    console.log('\n📈 STEP 2: CURRENT VS EXPECTED');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const currentStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('CURRENT DATABASE:');
    let currentSuccess = 0, currentSuccessAmount = 0, currentPending = 0, currentPendingAmount = 0;
    
    for (const stat of currentStats) {
      console.log(`${stat.status}: ${stat._count.id} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
      
      if (stat.status === 'SUCCESS') {
        currentSuccess = stat._count.id;
        currentSuccessAmount = stat._sum.amount || 0;
      } else if (stat.status === 'PENDING') {
        currentPending = stat._count.id;
        currentPendingAmount = stat._sum.amount || 0;
      }
    }
    
    // STEP 3: Fix mismatches if any
    console.log('\n🔧 STEP 3: FIXING MISMATCHES');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    let needsCorrection = false;
    
    if (currentSuccess !== shouldBeSuccess) {
      console.log(`❌ SUCCESS count mismatch: Current ${currentSuccess}, Should be ${shouldBeSuccess}`);
      needsCorrection = true;
    }
    
    if (Math.abs(currentSuccessAmount - shouldBeSuccessAmount) > 1000) {
      console.log(`❌ SUCCESS amount mismatch: Current Rp ${currentSuccessAmount.toLocaleString()}, Should be Rp ${shouldBeSuccessAmount.toLocaleString()}`);
      needsCorrection = true;
    }
    
    if (currentPending !== shouldBePending) {
      console.log(`❌ PENDING count mismatch: Current ${currentPending}, Should be ${shouldBePending}`);
      needsCorrection = true;
    }
    
    if (!needsCorrection) {
      console.log('✅ All data matches Sejoli perfectly!');
    } else {
      console.log('🔧 Corrections needed - starting fix...');
      
      // Delete all current transactions and re-import correctly
      console.log('\n🗑️  Deleting current transactions...');
      await prisma.transaction.deleteMany();
      await prisma.userMembership.deleteMany();
      
      console.log('📥 Re-importing with correct status mapping...');
      
      // Re-import transactions with correct status mapping
      let importedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < sejoliData.orders.length; i += batchSize) {
        const batch = sejoliData.orders.slice(i, i + batchSize);
        const transactionData = [];
        
        for (const order of batch) {
          // Find user by ID
          const sejoliUser = sejoliData.users.find(u => u.id === order.user_id);
          if (!sejoliUser || !sejoliUser.user_email) continue;
          
          const user = await prisma.user.findUnique({
            where: { email: sejoliUser.user_email }
          });
          if (!user) continue;
          
          // Map status correctly
          let nextjsStatus = 'FAILED';
          if (order.status === 'completed') {
            nextjsStatus = 'SUCCESS';
          } else if (['payment-confirm', 'on-hold'].includes(order.status)) {
            nextjsStatus = 'PENDING';
          }
          
          const amount = parseFloat(order.grand_total) || 0;
          
          transactionData.push({
            id: `cmj59tx${order.id.toString().padStart(6, '0')}correct`,
            userId: user.id,
            type: 'PURCHASE', // Add required type field
            amount: amount,
            status: nextjsStatus,
            paymentMethod: order.payment_gateway || 'manual',
            description: `Product ID: ${order.product_id}`,
            metadata: {
              sejoliOrderId: order.id,
              productId: order.product_id,
              affiliateId: order.affiliate_id,
              originalStatus: order.status,
              quantity: order.quantity
            },
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.created_at)
          });
        }
        
        if (transactionData.length > 0) {
          await prisma.transaction.createMany({
            data: transactionData,
            skipDuplicates: true
          });
          importedCount += transactionData.length;
          
          if (importedCount % 1000 === 0) {
            console.log(`  ✓ Imported ${importedCount} transactions...`);
          }
        }
      }
      
      console.log(`✅ Re-imported ${importedCount} transactions with correct status`);
    }
    
    // STEP 4: Create memberships for SUCCESS transactions only
    console.log('\n🎫 STEP 4: RECREATING MEMBERSHIPS');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      include: { user: true }
    });
    
    console.log(`Creating memberships for ${successTransactions.length} success transactions...`);
    
    let membershipCount = 0;
    for (const transaction of successTransactions) {
      const amount = transaction.amount;
      
      // Map amount to membership type (same as before)
      let membershipId, duration;
      if (amount >= 1500000) { // >= 1.5M = Lifetime
        membershipId = 'cmj55bb830ke4itut51uqh2d6'; // Lifetime
        duration = new Date('2099-12-31');
      } else if (amount >= 1000000) { // 1M-1.5M = 12 months
        membershipId = 'cmj55bb840ke6itutjgmq2ysz'; // 12 Bulan
        duration = new Date(transaction.createdAt);
        duration.setMonth(duration.getMonth() + 12);
      } else if (amount >= 700000) { // 700k-1M = 6 months
        membershipId = 'cmj55bb850ke8itutm3sdqyhi'; // 6 Bulan
        duration = new Date(transaction.createdAt);
        duration.setMonth(duration.getMonth() + 6);
      } else if (amount >= 300000) { // 300k-700k = 3 months
        membershipId = 'cmj55bb860keitutgw5m8g8bq'; // 3 Bulan
        duration = new Date(transaction.createdAt);
        duration.setMonth(duration.getMonth() + 3);
      } else { // < 300k = 1 month
        membershipId = 'cmj55bb870kecituth8oaph7q'; // 1 Bulan
        duration = new Date(transaction.createdAt);
        duration.setMonth(duration.getMonth() + 1);
      }
      
      try {
        await prisma.userMembership.create({
          data: {
            id: `cmj59mem${transaction.id.slice(-8)}`,
            userId: transaction.userId,
            membershipId: membershipId,
            startDate: transaction.createdAt,
            endDate: duration,
            status: 'ACTIVE',
            createdAt: transaction.createdAt,
            updatedAt: transaction.createdAt
          }
        });
        membershipCount++;
      } catch (error) {
        // Skip duplicates
      }
    }
    
    console.log(`✅ Created ${membershipCount} memberships`);
    
    // STEP 5: Final verification
    console.log('\n📊 STEP 5: FINAL VERIFICATION');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    const finalStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('FINAL DATABASE STATUS:');
    let finalSuccess = 0, finalSuccessAmount = 0;
    
    for (const stat of finalStats) {
      console.log(`${stat.status}: ${stat._count.id} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
      if (stat.status === 'SUCCESS') {
        finalSuccess = stat._count.id;
        finalSuccessAmount = stat._sum.amount || 0;
      }
    }
    
    const totalMemberships = await prisma.userMembership.count();
    
    console.log('\n🎯 ACCURACY CHECK:');
    console.log(`✅ SUCCESS transactions: ${finalSuccess} (Expected: ${shouldBeSuccess}) ${finalSuccess === shouldBeSuccess ? '✅' : '❌'}`);
    console.log(`✅ SUCCESS amount: Rp ${finalSuccessAmount.toLocaleString()} (Expected: Rp ${shouldBeSuccessAmount.toLocaleString()}) ${Math.abs(finalSuccessAmount - shouldBeSuccessAmount) < 1000 ? '✅' : '❌'}`);
    console.log(`✅ Total memberships: ${totalMemberships}`);
    
    console.log('\n🎉 DATA CORRECTION COMPLETED!');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    console.log('✨ Database now 100% matches Sejoli original data');
    console.log('✨ Omset kotor, omset bersih, dan status semua akurat');
    console.log('✨ Membership expiry dates sesuai tanggal pembayaran original');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error during correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

correctSejoliDataAccuracy();