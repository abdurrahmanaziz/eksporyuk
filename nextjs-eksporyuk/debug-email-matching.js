const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function debugEmailMatching() {
  try {
    console.log('🔍 DEBUG EMAIL MATCHING');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    const sejoliData = JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    // Get some orders and check emails
    console.log('📧 Sample Sejoli order emails:');
    const sampleOrders = sejoliData.orders.slice(0, 10);
    sampleOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.ID}: ${order.user_email} (status: ${order.status}, amount: ${order.grand_total})`);
    });
    
    // Check if these emails exist in our database
    console.log('\n🔍 Checking if emails exist in database:');
    for (const order of sampleOrders) {
      const user = await prisma.user.findFirst({
        where: { email: order.user_email }
      });
      
      console.log(`  ${order.user_email}: ${user ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    }
    
    // Get some database users
    console.log('\n👥 Sample database users:');
    const dbUsers = await prisma.user.findMany({ 
      take: 10, 
      skip: 5, // Skip admin users
      select: { email: true, name: true }
    });
    
    dbUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.name})`);
    });
    
    // Try to find any Sejoli users that exist in database
    console.log('\n🔗 Finding matching users...');
    let matchCount = 0;
    
    for (let i = 0; i < Math.min(sejoliData.users.length, 100); i++) {
      const sejoliUser = sejoliData.users[i];
      if (!sejoliUser.user_email) continue;
      
      const dbUser = await prisma.user.findFirst({
        where: { email: sejoliUser.user_email }
      });
      
      if (dbUser) {
        console.log(`  ✅ MATCH: ${sejoliUser.user_email}`);
        matchCount++;
        if (matchCount >= 5) break; // Show first 5 matches
      }
    }
    
    console.log(`\n📊 Found ${matchCount} matching users in first 100 Sejoli users`);
    
    // Check if we have any Sejoli-originated users
    const sejoliOriginUsers = await prisma.user.findMany({
      where: {
        email: { not: { in: ['superadmin@eksporyuk.com', 'founder@eksporyuk.com', 'cofounder@eksporyuk.com', 'admin@eksporyuk.com', 'mentor@eksporyuk.com'] } }
      },
      take: 5,
      select: { email: true, name: true, createdAt: true }
    });
    
    console.log('\n👤 Non-admin users in database:');
    sejoliOriginUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - created: ${user.createdAt.toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEmailMatching();