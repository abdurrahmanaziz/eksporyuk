const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMissingCompletedOrders() {
  try {
    // Load Sejoli data
    const data = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    // Create user map
    const userMap = {};
    for (const u of data.users) {
      userMap[u.id] = u.user_email;
    }
    
    // Get completed orders from Sejoli
    const completedOrders = data.orders.filter(o => o.status === 'completed');
    console.log(`Sejoli completed orders: ${completedOrders.length.toLocaleString()}`);
    
    // Get SUCCESS transactions from database
    const dbTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { externalId: true }
    });
    console.log(`DB SUCCESS transactions: ${dbTransactions.length.toLocaleString()}`);
    
    // Create set of external IDs in database
    const dbExternalIds = new Set(dbTransactions.map(t => t.externalId));
    
    // Find missing orders
    const missing = completedOrders.filter(o => !dbExternalIds.has(String(o.id)));
    
    console.log(`\nMissing orders: ${missing.length}\n`);
    
    if (missing.length > 0) {
      console.log('Missing order details:');
      for (const order of missing) {
        const email = userMap[order.user_id];
        console.log(`  Order ID: ${order.id}`);
        console.log(`    User ID: ${order.user_id} (${email})`);
        console.log(`    Amount: Rp ${order.grand_total.toLocaleString()}`);
        console.log(`    Date: ${order.created_at}`);
        
        // Check if user exists in DB
        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: { id: true, email: true }
        });
        
        if (dbUser) {
          console.log(`    ✅ User exists in DB: ${dbUser.email}`);
        } else {
          console.log(`    ❌ User NOT in DB`);
        }
        console.log();
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingCompletedOrders();
