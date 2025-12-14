const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function importSejoliDataFast() {
  try {
    console.log('🚀 IMPORTING SEJOLI DATA - INDIVIDUAL CREATES');
    
    // Clear existing data first
    console.log('🗑️  Clearing existing data...');
    await prisma.userMembership.deleteMany({});
    await prisma.transaction.deleteMany({});
    console.log('✅ Cleared existing data');
    
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
    
    console.log(`📧 Mapped ${sejoliUserMap.size} Sejoli emails`);
    console.log(`👥 Found ${allUsers.length} database users`);
    
    // Get default membership for memberships
    const defaultMembership = await prisma.membership.findFirst({
      orderBy: { id: 'asc' }
    });
    
    let imported = 0;
    let skipped = 0;
    
    console.log('🔄 Processing orders individually...');
    
    // Process in smaller batches to avoid memory issues
    for (let i = 0; i < sejoliData.orders.length; i += 10) {
      const batch = sejoliData.orders.slice(i, i + 10);
      
      for (const order of batch) {
        try {
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
          
          // Create transaction individually
          const transaction = await prisma.transaction.create({
            data: {
              userId: userId,
              amount: amount,
              status: status,
              type: 'MEMBERSHIP',
              paymentMethod: order.payment_gateway || 'BANK_TRANSFER',
              externalId: `sejoli-${order.id}`,
              reference: `Sejoli Order #${order.id}`,
              description: `Import from Sejoli Order #${order.id}`,
              createdAt: new Date(order.created_at || '2024-01-01'),
              updatedAt: new Date()
            }
          });
          
          // Create membership if transaction is successful
          if (status === 'SUCCESS' && defaultMembership) {
            await prisma.userMembership.create({
              data: {
                userId: userId,
                membershipId: defaultMembership.id,
                startDate: new Date(order.created_at || '2024-01-01'),
                endDate: new Date(new Date(order.created_at || '2024-01-01').getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
                status: 'ACTIVE',
                createdAt: new Date()
              }
            });
          }
          
          imported++;
          
        } catch (error) {
          console.error(`❌ Error processing order ${order.id}:`, error.message);
          skipped++;
        }
      }
      
      // Progress update every 1000 records
      if (i % 1000 === 0) {
        console.log(`✅ Processed ${i} orders, imported ${imported} transactions`);
      }
    }
    
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log(`✅ Imported: ${imported} transactions`);
    console.log(`⚠️  Skipped: ${skipped} orders`);
    
    // Verify results
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
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importSejoliDataFast();