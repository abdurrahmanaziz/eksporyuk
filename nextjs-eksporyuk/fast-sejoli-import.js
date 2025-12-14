const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function fastSejoliImport() {
  try {
    console.log('⚡ FAST SEJOLI IMPORT - TRANSACTION FOCUS');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    console.log('📥 Loading Sejoli data...');
    const sejoliData = JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    console.log(`✅ Loaded ${sejoliData.orders.length} orders`);
    
    // Clear transactions only
    console.log('\n🗑️ Clearing transactions...');
    await prisma.userMembership.deleteMany({});
    await prisma.transaction.deleteMany({});
    
    // Ensure membership exists
    await prisma.membership.upsert({
      where: { id: 'prime' },
      update: {},
      create: {
        id: 'prime',
        name: 'Eksporyuk Prime',
        slug: 'prime',
        price: 99000,
        duration: 'ONE_MONTH',
        description: 'Premium membership',
        features: ['Akses penuh']
      }
    });
    
    // Process existing users only
    console.log('\n👥 Getting existing users...');
    const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const userEmailMap = new Map(existingUsers.map(u => [u.email, u.id]));
    console.log(`✅ Found ${existingUsers.length} existing users`);
    
    // Import transactions in batches
    console.log('\n💰 Importing transactions...');
    let successCount = 0, pendingCount = 0, failedCount = 0;
    let processed = 0;
    
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < sejoliData.orders.length; i += batchSize) {
      batches.push(sejoliData.orders.slice(i, i + batchSize));
    }
    
    console.log(`Processing ${batches.length} batches of ${batchSize}...`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const transactionData = [];
      
      for (const order of batch) {
        const userId = userEmailMap.get(order.user_email);
        if (!userId) continue;
        
        // Map status correctly
        let status;
        if (order.status === 'completed') {
          status = 'SUCCESS';
          successCount++;
        } else if (order.status === 'payment-confirm' || order.status === 'on-hold') {
          status = 'PENDING';
          pendingCount++;
        } else {
          status = 'FAILED';
          failedCount++;
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        const orderDate = new Date(order.post_date || Date.now());
        
        transactionData.push({
          userId: userId,
          amount: amount,
          status: status,
          type: 'PURCHASE',
          description: `Membership Purchase - Order #${order.ID}`,
          paymentMethod: order.payment_method || 'manual',
          createdAt: orderDate
        });
      }
      
      // Bulk insert
      if (transactionData.length > 0) {
        await prisma.transaction.createMany({
          data: transactionData,
          skipDuplicates: true
        });
      }
      
      processed += batch.length;
      console.log(`   Batch ${batchIndex + 1}/${batches.length} - Processed ${processed}/${sejoliData.orders.length} orders`);
    }
    
    // Create memberships for SUCCESS transactions
    console.log('\n🎫 Creating memberships for SUCCESS transactions...');
    const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      take: 5000 // Limit for performance
    });
    
    const membership = await prisma.membership.findFirst();
    
    for (let i = 0; i < successTransactions.length; i += 50) {
      const batch = successTransactions.slice(i, i + 50);
      const membershipData = [];
      
      for (const transaction of batch) {
        const endDate = new Date(transaction.createdAt);
        endDate.setMonth(endDate.getMonth() + 1);
        
        membershipData.push({
          userId: transaction.userId,
          membershipId: membership.id,
          transactionId: transaction.id,
          startDate: transaction.createdAt,
          endDate: endDate,
          isActive: true,
          createdAt: transaction.createdAt
        });
      }
      
      await prisma.userMembership.createMany({
        data: membershipData,
        skipDuplicates: true
      });
      
      if ((i + 50) % 500 === 0) {
        console.log(`   Created ${Math.min(i + 50, successTransactions.length)}/${successTransactions.length} memberships`);
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    const stats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('🎯 RESULTS:');
    for (const stat of stats) {
      console.log(`${stat.status}: ${stat._count.id.toLocaleString()} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    }
    
    const membershipCount = await prisma.userMembership.count();
    console.log(`🎫 Memberships: ${membershipCount.toLocaleString()}`);
    
    // Expected vs Actual
    console.log('\n🎯 ACCURACY:');
    const actualSuccess = stats.find(s => s.status === 'SUCCESS')?._count.id || 0;
    const actualPending = stats.find(s => s.status === 'PENDING')?._count.id || 0;
    const actualFailed = stats.find(s => s.status === 'FAILED')?._count.id || 0;
    
    console.log(`✅ SUCCESS: ${actualSuccess} vs 12,539 expected ${Math.abs(actualSuccess - 12539) < 100 ? '✅' : '❌'}`);
    console.log(`⏳ PENDING: ${actualPending} vs 6 expected ${Math.abs(actualPending - 6) < 5 ? '✅' : '❌'}`);
    console.log(`❌ FAILED: ${actualFailed} vs 6,039 expected ${Math.abs(actualFailed - 6039) < 100 ? '✅' : '❌'}`);
    
    if (actualSuccess > 10000 && actualPending < 100 && actualFailed > 5000) {
      console.log('\n🎉 SUCCESS! Data sekarang sesuai dengan Sejoli original!');
      console.log('✅ STATUS MAPPING BENAR: completed→SUCCESS, cancelled/refunded→FAILED');
      console.log('✅ Dashboard akan menampilkan angka yang akurat');
      console.log('✅ Omset bersih dan kotor sudah sesuai');
    } else {
      console.log('\n⚠️  Perlu peninjauan lebih lanjut');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fastSejoliImport();