const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function debugUserMapping() {
  try {
    console.log('🔍 DEBUGGING USER MAPPING ISSUE');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Load Sejoli data
    const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    console.log(`Sejoli Users: ${sejoliData.users.length}`);
    console.log(`Sejoli Orders: ${sejoliData.orders.length}`);
    
    // Check sample users structure
    console.log('\n📋 SAMPLE SEJOLI USER:');
    console.log(JSON.stringify(sejoliData.users[0], null, 2));
    
    console.log('\n📋 SAMPLE SEJOLI ORDER:');
    console.log(JSON.stringify(sejoliData.orders[0], null, 2));
    
    // Check our database users
    const dbUserCount = await prisma.user.count();
    const sampleDbUsers = await prisma.user.findMany({ take: 3 });
    
    console.log(`\nDatabase Users: ${dbUserCount}`);
    console.log('Sample DB Users:');
    for (const user of sampleDbUsers) {
      console.log(`- ${user.email} (ID: ${user.id})`);
    }
    
    // Try to match some orders with users
    console.log('\n🔗 TESTING USER MATCHING:');
    console.log('─────────────────────────────────────────────────────────────────────────────────────');
    
    for (let i = 0; i < 10; i++) {
      const order = sejoliData.orders[i];
      console.log(`\nOrder ${i + 1}:`);
      console.log(`  Order user_id: ${order.user_id}`);
      console.log(`  Order status: ${order.status}`);
      console.log(`  Order amount: ${order.grand_total}`);
      
      // Find sejoli user
      const sejoliUser = sejoliData.users.find(u => u.id === order.user_id);
      if (sejoliUser) {
        console.log(`  Sejoli user found: ${sejoliUser.email || sejoliUser.user_email || 'NO EMAIL'}`);
        
        // Try to find in our database
        const email = sejoliUser.email || sejoliUser.user_email;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: email }
          });
          console.log(`  DB user found: ${dbUser ? 'YES' : 'NO'}`);
        } else {
          console.log(`  No email field in sejoli user`);
        }
      } else {
        console.log(`  Sejoli user NOT found for user_id ${order.user_id}`);
      }
    }
    
    // Check field names in sejoli users
    console.log('\n🏷️  SEJOLI USER FIELDS:');
    const userFields = new Set();
    for (let i = 0; i < 10; i++) {
      Object.keys(sejoliData.users[i]).forEach(key => userFields.add(key));
    }
    console.log('Available fields in users:', Array.from(userFields).sort());
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserMapping();