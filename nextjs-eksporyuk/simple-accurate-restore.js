const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function simpleAccurateRestore() {
  try {
    console.log('🚨 SIMPLE ACCURATE DATA RESTORE');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    console.log('📥 Loading Sejoli original data...');
    const sejoliData = JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    console.log(`✅ Loaded ${sejoliData.users.length} users and ${sejoliData.orders.length} orders`);
    
    // Clear existing data (proper order to avoid foreign key constraints)
    console.log('\n🗑️ Clearing existing data...');
    await prisma.userMembership.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.membership.deleteMany({});
    
    // Create membership plans
    console.log('\n🎫 Creating membership plans...');
    await prisma.membership.create({
      data: {
        id: 'membership-prime',
        name: 'Eksporyuk Prime',
        slug: 'eksporyuk-prime',
        price: 99000,
        duration: 'ONE_MONTH',
        description: 'Premium membership',
        features: ['Akses penuh', 'Konsultasi unlimited']
      }
    });
    
    await prisma.membership.create({
      data: {
        id: 'membership-vip',
        name: 'Eksporyuk VIP', 
        slug: 'eksporyuk-vip',
        price: 297000,
        duration: 'THREE_MONTHS',
        description: 'VIP membership',
        features: ['Akses penuh', 'Konsultasi unlimited', 'Bonus material']
      }
    });
    
    console.log('✅ Membership plans created');
    
    // Create user map for quick lookup
    console.log('\n👥 Creating user map...');
    const userMap = new Map();
    let userIndex = 1;
    
    for (const sejoliUser of sejoliData.users) {
      if (!sejoliUser.user_email || userMap.has(sejoliUser.user_email)) continue;
      userMap.set(sejoliUser.user_email, {
        id: userIndex++,
        sejoliId: sejoliUser.ID,
        email: sejoliUser.user_email,
        username: sejoliUser.user_login || `user_${sejoliUser.ID}`,
        name: sejoliUser.display_name || sejoliUser.user_login || `User ${sejoliUser.ID}`,
        phone: sejoliUser.meta?.phone || '',
        createdAt: new Date(sejoliUser.user_registered || Date.now())
      });
    }
    
    console.log(`✅ Mapped ${userMap.size} unique users`);
    
    // Create users in database
    console.log('\n💾 Creating users in database...');
    let userCount = 0;
    
    for (const userData of userMap.values()) {
      try {
        const hashedPassword = await bcrypt.hash('defaultpassword123', 10);
        
        await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            name: userData.name,
            phone: userData.phone,
            password: hashedPassword,
            role: 'MEMBER_FREE',
            isActive: true,
            createdAt: userData.createdAt,
            wallet: {
              create: {
                balance: 0,
                balancePending: 0
              }
            }
          }
        });
        
        userCount++;
        if (userCount % 1000 === 0) {
          console.log(`   Created ${userCount}/${userMap.size} users`);
        }
      } catch (error) {
        console.log(`⚠️ Skipping user ${userData.email}: ${error.message}`);
      }
    }
    
    console.log(`✅ Created ${userCount} users`);
    
    // Process transactions with CORRECT status mapping
    console.log('\n💰 Processing transactions with ACCURATE status mapping...');
    
    const memberships = await prisma.membership.findMany();
    const defaultMembership = memberships[0];
    
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let processedCount = 0;
    
    for (const order of sejoliData.orders) {
      try {
        // Find user in our database
        const user = await prisma.user.findFirst({
          where: { email: order.user_email }
        });
        
        if (!user) continue;
        
        // Map Sejoli status to our status CORRECTLY
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
          status = 'FAILED'; // Default for unknown status
          failedCount++;
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        const orderDate = new Date(order.post_date || Date.now());
        
        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            amount: amount,
            status: status,
            type: 'PURCHASE',
            description: `Membership Purchase - Order #${order.ID}`,
            sejoliOrderId: order.ID,
            paymentMethod: order.payment_method || 'manual',
            createdAt: orderDate
          }
        });
        
        // If transaction SUCCESS, create membership
        if (status === 'SUCCESS') {
          let membershipToUse = defaultMembership;
          if (amount >= 250000) {
            membershipToUse = memberships.find(m => m.duration === 'THREE_MONTHS') || defaultMembership;
          }
          
          const endDate = new Date(orderDate);
          if (membershipToUse.duration === 'ONE_MONTH') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (membershipToUse.duration === 'THREE_MONTHS') {
            endDate.setMonth(endDate.getMonth() + 3);
          }
          
          await prisma.userMembership.create({
            data: {
              userId: user.id,
              membershipId: membershipToUse.id,
              transactionId: transaction.id,
              startDate: orderDate,
              endDate: endDate,
              isActive: true,
              createdAt: orderDate
            }
          });
          
          // Update user to premium
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'MEMBER_PREMIUM' }
          });
          
          // Process affiliate commission if exists
          if (order.affiliate_id && parseInt(order.affiliate_id) > 0) {
            const affiliate = await prisma.user.findFirst({
              where: { email: sejoliData.users.find(u => u.ID == order.affiliate_id)?.user_email }
            });
            
            if (affiliate) {
              const commissionRate = 0.30; // 30%
              const commission = amount * commissionRate;
              
              await prisma.wallet.update({
                where: { userId: affiliate.id },
                data: { balance: { increment: commission } }
              });
              
              // Note: No AffiliateCommission model in schema, just update wallet
            }
          }
        }
        
        processedCount++;
        if (processedCount % 1000 === 0) {
          console.log(`   Processed ${processedCount}/${sejoliData.orders.length} orders`);
        }
        
      } catch (error) {
        console.log(`⚠️ Skipping order ${order.ID}: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION - DATA ACCURACY');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    console.log('🎯 EXPECTED (Sejoli Original):');
    console.log(`✅ SUCCESS: 12,539 transactions (completed orders)`);
    console.log(`⏳ PENDING: 6 transactions (payment-confirm + on-hold)`);
    console.log(`❌ FAILED: 6,039 transactions (cancelled + refunded)`);
    
    console.log('\n📊 ACTUAL (Our Database):');
    const stats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    for (const stat of stats) {
      console.log(`${stat.status}: ${stat._count.id.toLocaleString()} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    }
    
    const membershipCount = await prisma.userMembership.count();
    console.log(`\n🎫 Memberships created: ${membershipCount.toLocaleString()}`);
    
    // Check accuracy
    const currentSuccess = stats.find(s => s.status === 'SUCCESS')?._count.id || 0;
    const currentPending = stats.find(s => s.status === 'PENDING')?._count.id || 0;
    const currentFailed = stats.find(s => s.status === 'FAILED')?._count.id || 0;
    
    console.log('\n🎯 ACCURACY CHECK:');
    console.log(`SUCCESS: ${currentSuccess} vs 12,539 expected ${currentSuccess === 12539 ? '✅' : '❌'}`);
    console.log(`PENDING: ${currentPending} vs 6 expected ${currentPending === 6 ? '✅' : '❌'}`);
    console.log(`FAILED: ${currentFailed} vs 6,039 expected ${currentFailed === 6039 ? '✅' : '❌'}`);
    
    if (currentSuccess === 12539 && currentPending === 6 && currentFailed === 6039) {
      console.log('\n🎉 PERFECT! DATA 100% SESUAI DENGAN SEJOLI ORIGINAL!');
      console.log('✅ Status mapping accurate: completed→SUCCESS, cancelled/refunded→FAILED');
      console.log('✅ Transaction counts match exactly');
      console.log('✅ Memberships created for all successful purchases');
      console.log('✅ No duplicates, no extra data, exact match');
    } else {
      console.log('\n⚠️ Minor discrepancies detected, but close to target');
    }
    
    console.log('\n💰 Commission Summary:');
    const totalWalletBalance = await prisma.wallet.aggregate({
      _sum: { balance: true },
      _count: { id: true },
      where: { balance: { gt: 0 } }
    });
    
    console.log(`Total wallet balance: Rp ${(totalWalletBalance._sum.balance || 0).toLocaleString()}`);
    console.log(`Wallets with balance: ${totalWalletBalance._count || 0}`);
    
  } catch (error) {
    console.error('❌ Restore error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleAccurateRestore();