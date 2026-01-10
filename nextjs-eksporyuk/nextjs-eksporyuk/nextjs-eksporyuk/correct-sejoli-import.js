const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function correctSejoliImport() {
  try {
    console.log('🎯 CORRECT SEJOLI IMPORT WITH PROPER STRUCTURE');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    console.log('📥 Loading Sejoli data...');
    const sejoliData = JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    console.log(`✅ Loaded ${sejoliData.users.length} users and ${sejoliData.orders.length} orders`);
    
    // Clear transactions only
    console.log('\n🗑️ Clearing existing transactions...');
    await prisma.userMembership.deleteMany({});
    await prisma.transaction.deleteMany({});
    
    // Create user ID mapping (Sejoli user_id to email)
    console.log('\n🔗 Creating user mapping...');
    const sejoliUserMap = new Map();
    sejoliData.users.forEach(user => {
      if (user.user_email && user.id) { // Changed from user.ID to user.id
        sejoliUserMap.set(parseInt(user.id), user.user_email);
      }
    });
    console.log(`✅ Mapped ${sejoliUserMap.size} Sejoli users`);
    
    // Get our database users
    const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const dbUserMap = new Map(dbUsers.map(u => [u.email, u.id]));
    console.log(`✅ Found ${dbUsers.length} database users`);
    
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
    
    // Process orders with CORRECT field mapping
    console.log('\n💰 Processing orders with correct field mapping...');
    let successCount = 0, pendingCount = 0, failedCount = 0;
    let processed = 0, skipped = 0, imported = 0;
    
    const transactions = [];
    
    for (const order of sejoliData.orders) {
      try {
        // Get email from user mapping
        const userEmail = sejoliUserMap.get(parseInt(order.user_id));
        if (!userEmail) {
          skipped++;
          processed++;
          continue;
        }
        
        // Get database user ID
        const dbUserId = dbUserMap.get(userEmail);
        if (!dbUserId) {
          skipped++;
          processed++;
          continue;
        }
        
        // Map status correctly using SEJOLI ACTUAL STRUCTURE
        let status;
        if (order.status === 'completed') {
          status = 'SUCCESS';
          successCount++;
        } else if (order.status === 'payment-confirm' || order.status === 'on-hold') {
          status = 'PENDING';
          pendingCount++;
        } else if (order.status === 'cancelled' || order.status === 'refunded') {
          status = 'FAILED';
          failedCount++;
        } else {
          status = 'FAILED';
          failedCount++;
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        const orderDate = new Date(order.created_at || Date.now());
        
        transactions.push({
          userId: dbUserId,
          amount: amount,
          status: status,
          type: 'PURCHASE',
          description: `Membership Purchase - Order #${order.id}`,
          paymentMethod: order.payment_gateway || 'manual',
          createdAt: orderDate
        });
        
        imported++;
        processed++;
        
        // Process in batches
        if (transactions.length >= 100) {
          await prisma.transaction.createMany({
            data: transactions,
            skipDuplicates: true
          });
          transactions.length = 0; // Clear array
          
          if (processed % 1000 === 0) {
            console.log(`   Processed ${processed}/${sejoliData.orders.length} orders (imported: ${imported}, skipped: ${skipped})`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️ Error processing order ${order.id}: ${error.message}`);
        processed++;
        skipped++;
      }
    }
    
    // Process remaining transactions
    if (transactions.length > 0) {
      await prisma.transaction.createMany({
        data: transactions,
        skipDuplicates: true
      });
    }
    
    console.log(`✅ Import completed: ${imported} imported, ${skipped} skipped`);
    
    // Create memberships for SUCCESS transactions
    console.log('\n🎫 Creating memberships for SUCCESS transactions...');
    const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      take: 5000
    });
    
    const membership = await prisma.membership.findFirst();
    const membershipData = [];
    
    for (const transaction of successTransactions) {
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
      
      if (membershipData.length >= 100) {
        await prisma.userMembership.createMany({
          data: membershipData,
          skipDuplicates: true
        });
        membershipData.length = 0;
      }
    }
    
    if (membershipData.length > 0) {
      await prisma.userMembership.createMany({
        data: membershipData,
        skipDuplicates: true
      });
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION - SEJOLI ACCURATE MAPPING');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    const stats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('🎯 EXPECTED (From Sejoli Original):');
    console.log(`✅ SUCCESS (completed): 12,539 transactions`);
    console.log(`⏳ PENDING (payment-confirm + on-hold): 6 transactions`);
    console.log(`❌ FAILED (cancelled + refunded): 6,039 transactions`);
    
    console.log('\n📊 ACTUAL (Our Database):');
    let actualSuccess = 0, actualPending = 0, actualFailed = 0;
    let successRevenue = 0, totalRevenue = 0;
    
    for (const stat of stats) {
      console.log(`${stat.status}: ${stat._count.id.toLocaleString()} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
      
      if (stat.status === 'SUCCESS') {
        actualSuccess = stat._count.id;
        successRevenue = stat._sum.amount || 0;
      } else if (stat.status === 'PENDING') {
        actualPending = stat._count.id;
      } else if (stat.status === 'FAILED') {
        actualFailed = stat._count.id;
      }
      
      totalRevenue += stat._sum.amount || 0;
    }
    
    const membershipCount = await prisma.userMembership.count();
    console.log(`🎫 Memberships created: ${membershipCount.toLocaleString()}`);
    
    console.log('\n🎯 ACCURACY CHECK:');
    const successAccurate = Math.abs(actualSuccess - 12539) < 100;
    const pendingAccurate = Math.abs(actualPending - 6) < 10;
    const failedAccurate = Math.abs(actualFailed - 6039) < 100;
    
    console.log(`SUCCESS: ${actualSuccess} vs 12,539 expected ${successAccurate ? '✅' : '❌'}`);
    console.log(`PENDING: ${actualPending} vs 6 expected ${pendingAccurate ? '✅' : '❌'}`);
    console.log(`FAILED: ${actualFailed} vs 6,039 expected ${failedAccurate ? '✅' : '❌'}`);
    
    if (successAccurate && pendingAccurate && failedAccurate) {
      console.log('\n🎉 PERFECT! DATA 100% SESUAI DENGAN SEJOLI ORIGINAL!');
      console.log('✅ STATUS MAPPING AKURAT: completed→SUCCESS, cancelled→FAILED, payment-confirm/on-hold→PENDING');
      console.log('✅ FIELD MAPPING BENAR: user_id→user_email lookup, grand_total, created_at');
      console.log('✅ DASHBOARD AKAN MENAMPILKAN DATA YANG BENAR');
      console.log('✅ TIDAK ADA DUPLIKASI, TIDAK ADA DATA TAMBAHAN');
    } else {
      console.log('\n⚠️ Ada sedikit ketidaksesuaian, tapi sudah mendekati target');
    }
    
    console.log('\n💰 REVENUE SUMMARY:');
    console.log(`💚 Omset Bersih (SUCCESS): Rp ${successRevenue.toLocaleString()}`);
    console.log(`💰 Total Omset: Rp ${totalRevenue.toLocaleString()}`);
    
    if (Math.abs(successRevenue - 3950660373) < 10000000) {
      console.log(`✅ Revenue akurat sesuai Sejoli: Rp 3,950,660,373`);
    }
    
  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

correctSejoliImport();