const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function findMissingTransactions() {
  try {
    console.log('🔍 FINDING MISSING TRANSACTIONS');
    
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
    
    // Get all imported transactions
    const importedTransactions = await prisma.transaction.findMany({
      where: {
        externalId: { startsWith: 'sejoli-' }
      },
      select: { externalId: true }
    });
    
    const importedOrderIds = new Set(
      importedTransactions.map(t => t.externalId.replace('sejoli-', ''))
    );
    
    console.log(`📊 Imported: ${importedTransactions.length} transactions`);
    console.log(`📊 Sejoli total: ${sejoliData.orders.length} orders`);
    
    // Find missing completed orders
    const missingCompletedOrders = [];
    
    for (const order of sejoliData.orders) {
      if (order.status === 'completed' && !importedOrderIds.has(order.id.toString())) {
        const sejoliEmail = sejoliUserMap.get(order.user_id);
        const userId = userEmailMap.get(sejoliEmail);
        
        if (userId) {
          missingCompletedOrders.push({
            orderId: order.id,
            userId: userId,
            userEmail: sejoliEmail,
            amount: order.grand_total,
            date: order.created_at,
            gateway: order.payment_gateway
          });
        }
      }
    }
    
    console.log(`\n🔍 MISSING COMPLETED ORDERS: ${missingCompletedOrders.length}`);
    
    for (const order of missingCompletedOrders) {
      console.log(`\n📦 Order #${order.orderId}:`);
      console.log(`   User: ${order.userEmail}`);
      console.log(`   Amount: Rp ${order.amount.toLocaleString()}`);
      console.log(`   Date: ${order.date}`);
      console.log(`   Gateway: ${order.gateway}`);
    }
    
    // Import missing orders
    if (missingCompletedOrders.length > 0) {
      console.log(`\n🚀 IMPORTING ${missingCompletedOrders.length} MISSING ORDERS...`);
      
      const defaultMembership = await prisma.membership.findFirst({
        orderBy: { id: 'asc' }
      });
      
      for (const order of missingCompletedOrders) {
        try {
          // Create transaction
          await prisma.transaction.create({
            data: {
              userId: order.userId,
              amount: parseFloat(order.amount),
              status: 'SUCCESS',
              type: 'MEMBERSHIP',
              paymentMethod: order.gateway || 'BANK_TRANSFER',
              externalId: `sejoli-${order.orderId}`,
              reference: `Sejoli Order #${order.orderId}`,
              description: `Import from Sejoli Order #${order.orderId}`,
              createdAt: new Date(order.date || '2024-01-01'),
              updatedAt: new Date()
            }
          });
          
          // Create membership
          if (defaultMembership) {
            try {
              await prisma.userMembership.create({
                data: {
                  userId: order.userId,
                  membershipId: defaultMembership.id,
                  startDate: new Date(order.date || '2024-01-01'),
                  endDate: new Date(new Date(order.date || '2024-01-01').getTime() + (365 * 24 * 60 * 60 * 1000)),
                  status: 'ACTIVE',
                  createdAt: new Date()
                }
              });
            } catch (err) {
              // Skip if membership already exists
              console.log(`   ⚠️  Membership already exists for user`);
            }
          }
          
          console.log(`   ✅ Imported order #${order.orderId}`);
          
        } catch (error) {
          console.log(`   ❌ Error importing order #${order.orderId}: ${error.message}`);
        }
      }
      
      console.log('\n✅ IMPORT COMPLETED!');
    }
    
    // Verify final count
    const finalStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('\n📊 FINAL VERIFICATION:');
    for (const stat of finalStats) {
      console.log(`${stat.status}: ${stat._count.id} transactions, Rp ${(stat._sum.amount || 0).toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingTransactions();