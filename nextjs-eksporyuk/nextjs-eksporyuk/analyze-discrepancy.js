const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function analyzeDiscrepancy() {
  try {
    console.log('🔍 ANALYZING DISCREPANCY');
    
    // Load Sejoli data
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    // Calculate Sejoli completed orders total
    let sejoliCompletedCount = 0;
    let sejoliCompletedAmount = 0;
    
    const sejoliCompletedOrders = [];
    
    for (const order of sejoliData.orders) {
      if (order.status === 'completed') {
        sejoliCompletedCount++;
        const amount = parseFloat(order.grand_total) || 0;
        sejoliCompletedAmount += amount;
        sejoliCompletedOrders.push({
          id: order.id,
          amount: amount,
          user_id: order.user_id
        });
      }
    }
    
    console.log('\n🎯 SEJOLI COMPLETED ORDERS:');
    console.log(`Count: ${sejoliCompletedCount}`);
    console.log(`Total Amount: Rp ${sejoliCompletedAmount.toLocaleString()}`);
    
    // Get database SUCCESS transactions
    const dbSuccessTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        externalId: { startsWith: 'sejoli-' }
      },
      select: {
        externalId: true,
        amount: true
      }
    });
    
    let dbSuccessAmount = 0;
    for (const tx of dbSuccessTransactions) {
      dbSuccessAmount += parseFloat(tx.amount);
    }
    
    console.log('\n📊 DATABASE SUCCESS TRANSACTIONS:');
    console.log(`Count: ${dbSuccessTransactions.length}`);
    console.log(`Total Amount: Rp ${dbSuccessAmount.toLocaleString()}`);
    
    console.log('\n📉 DISCREPANCY:');
    console.log(`Count Difference: ${sejoliCompletedCount - dbSuccessTransactions.length} orders`);
    console.log(`Amount Difference: Rp ${(sejoliCompletedAmount - dbSuccessAmount).toLocaleString()}`);
    
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
    
    // Find completed orders that didn't import
    const importedOrderIds = new Set(
      dbSuccessTransactions.map(t => t.externalId.replace('sejoli-', ''))
    );
    
    console.log('\n🔍 COMPLETED ORDERS NOT IN DATABASE:');
    let notImportedCount = 0;
    let notImportedAmount = 0;
    
    for (const order of sejoliCompletedOrders) {
      if (!importedOrderIds.has(order.id.toString())) {
        const sejoliEmail = sejoliUserMap.get(order.user_id);
        const hasUser = userEmailMap.has(sejoliEmail);
        
        console.log(`\nOrder #${order.id}:`);
        console.log(`  Amount: Rp ${order.amount.toLocaleString()}`);
        console.log(`  User ID: ${order.user_id}`);
        console.log(`  Email: ${sejoliEmail || 'NOT FOUND'}`);
        console.log(`  User in DB: ${hasUser ? '✅' : '❌'}`);
        
        notImportedCount++;
        notImportedAmount += order.amount;
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Not imported: ${notImportedCount} orders`);
    console.log(`Not imported amount: Rp ${notImportedAmount.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDiscrepancy();