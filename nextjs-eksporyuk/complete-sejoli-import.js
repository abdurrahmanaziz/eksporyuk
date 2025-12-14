const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function completeSejoliImport() {
  try {
    console.log('🚀 COMPLETING SEJOLI IMPORT');
    
    // Load Sejoli data
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    // Create Sejoli user email lookup map
    const sejoliUserMap = new Map();
    for (const user of sejoliData.users) {
      sejoliUserMap.set(user.id, user.user_email);
    }
    
    // Get all users from database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    
    // Check existing transactions to avoid duplicates
    const existingExternalIds = new Set(
      (await prisma.transaction.findMany({
        select: { externalId: true },
        where: { externalId: { startsWith: 'sejoli-' } }
      })).map(t => t.externalId)
    );
    
    // Get default membership
    const defaultMembership = await prisma.membership.findFirst({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📧 Mapped ${sejoliUserMap.size} Sejoli emails`);
    console.log(`👥 Found ${allUsers.length} database users`);
    console.log(`🔄 Found ${existingExternalIds.size} existing transactions`);
    
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    
    console.log('🔄 Processing remaining orders...');
    
    // Process orders in bigger batches for speed
    for (let i = 0; i < sejoliData.orders.length; i += 50) {
      const batch = sejoliData.orders.slice(i, i + 50);
      
      const transactions = [];
      
      for (const order of batch) {
        // Skip if already imported
        const externalId = `sejoli-${order.id}`;
        if (existingExternalIds.has(externalId)) {
          duplicates++;
          continue;
        }
        
        // Get email from Sejoli user lookup
        const sejoliEmail = sejoliUserMap.get(order.user_id);
        if (!sejoliEmail) {
          skipped++;
          continue;
        }
        
        // Find user by email in our database
        const userId = userEmailMap.get(sejoliEmail);
        if (!userId) {
          skipped++;
          continue;
        }
        
        // Map status correctly
        let status = 'FAILED';
        if (order.status === 'completed') {
          status = 'SUCCESS';
        } else if (order.status === 'payment-confirm' || order.status === 'on-hold') {
          status = 'PENDING';
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        
        transactions.push({
          userId: userId,
          amount: amount,
          status: status,
          type: 'MEMBERSHIP',
          paymentMethod: order.payment_gateway || 'BANK_TRANSFER',
          externalId: externalId,
          reference: `Sejoli Order #${order.id}`,
          description: `Import from Sejoli Order #${order.id}`,
          createdAt: new Date(order.created_at || '2024-01-01'),
          updatedAt: new Date()
        });
      }
      
      // Bulk insert transactions
      if (transactions.length > 0) {
        try {
          const created = await prisma.transaction.createMany({
            data: transactions,
            skipDuplicates: true
          });
          imported += created.count;
        } catch (error) {
          console.error(`❌ Batch error: ${error.message}`);
          // Fall back to individual creates
          for (const txData of transactions) {
            try {
              await prisma.transaction.create({ data: txData });
              imported++;
            } catch (e) {
              skipped++;
            }
          }
        }
      }
      
      // Progress update every 5000 records
      if (i % 5000 === 0) {
        console.log(`✅ Processed ${i}/${sejoliData.orders.length} orders, imported ${imported} new transactions`);
      }
    }
    
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log(`✅ Imported: ${imported} new transactions`);
    console.log(`🔄 Duplicates: ${duplicates} (already existed)`);
    console.log(`⚠️  Skipped: ${skipped} orders`);
    
    // Create remaining memberships for SUCCESS transactions without duplicates
    console.log('\n🎫 Creating memberships for SUCCESS transactions...');
    
    const successTransactionsWithoutMembership = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        externalId: { startsWith: 'sejoli-' },
        membership: null
      },
      include: { user: true }
    });
    
    const userMembershipMap = new Map();
    let membershipCreated = 0;
    
    for (const transaction of successTransactionsWithoutMembership) {
      const userKey = `${transaction.userId}-${defaultMembership.id}`;
      
      // Skip if we already created membership for this user
      if (userMembershipMap.has(userKey)) {
        continue;
      }
      
      try {
        await prisma.userMembership.upsert({
          where: {
            userId_membershipId: {
              userId: transaction.userId,
              membershipId: defaultMembership.id
            }
          },
          update: {}, // Don't update if exists
          create: {
            userId: transaction.userId,
            membershipId: defaultMembership.id,
            startDate: transaction.createdAt,
            endDate: new Date(transaction.createdAt.getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
            status: 'ACTIVE',
            createdAt: new Date()
          }
        });
        
        userMembershipMap.set(userKey, true);
        membershipCreated++;
        
      } catch (error) {
        // Skip if already exists
      }
    }
    
    console.log(`✅ Created/verified ${membershipCreated} memberships`);
    
    // Final verification
    const finalStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('\n📊 FINAL VERIFICATION:');
    for (const stat of finalStats) {
      console.log(`${stat.status}: ${stat._count.id} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    }
    
    const membershipCount = await prisma.userMembership.count();
    console.log(`🎫 Total Memberships: ${membershipCount}`);
    
    // Check accuracy
    const sejoliCompleted = sejoliData.orders.filter(o => o.status === 'completed').length;
    const currentSuccess = finalStats.find(s => s.status === 'SUCCESS')?._count.id || 0;
    
    console.log(`\n🎯 ACCURACY CHECK:`);
    console.log(`Sejoli completed orders: ${sejoliCompleted}`);
    console.log(`Current SUCCESS transactions: ${currentSuccess}`);
    console.log(`Match: ${sejoliCompleted === currentSuccess ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeSejoliImport();