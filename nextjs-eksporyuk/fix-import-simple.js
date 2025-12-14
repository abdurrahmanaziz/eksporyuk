const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function fixImportSimple() {
  try {
    console.log('🔄 FIXING IMPORT - SIMPLE APPROACH');
    console.log('Clearing existing data and importing fresh...');
    
    // Clear existing data
    await prisma.userMembership.deleteMany({});
    await prisma.transaction.deleteMany({});
    console.log('✅ Cleared existing transactions and memberships');
    
    // Load Sejoli data with correct path
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    console.log('📁 Reading Sejoli data from:', sejoliPath);
    
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    console.log(`📊 Loaded ${sejoliData.orders.length} orders from Sejoli`);
    
    // Get all users from database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    console.log(`👥 Found ${allUsers.length} users in database`);
    
    // Create Sejoli user email lookup map
    const sejoliUserMap = new Map();
    for (const user of sejoliData.users) {
      sejoliUserMap.set(user.id, user.user_email);
    }
    console.log(`📧 Mapped ${sejoliUserMap.size} Sejoli user emails`);
    
    // Get default membership
    const defaultMembership = await prisma.membership.findFirst({
      orderBy: { id: 'asc' }
    });
    
    if (!defaultMembership) {
      console.log('❌ No membership found in database');
      return;
    }
    
    console.log(`💼 Using default membership: ${defaultMembership.name} (ID: ${defaultMembership.id})`);
    
    let imported = 0;
    let skipped = 0;
    let matched = 0;
    
    console.log('🚀 Starting import in batches...');
    
    for (let i = 0; i < sejoliData.orders.length; i += 100) {
      const batch = sejoliData.orders.slice(i, i + 100);
      console.log(`Processing batch ${Math.floor(i/100) + 1}/${Math.ceil(sejoliData.orders.length/100)}`);
      
      const transactionsToCreate = [];
      const membershipsToCreate = [];
      
      for (const order of batch) {
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
        
        matched++;
        
        // Map status correctly
        let status = 'FAILED';
        if (order.status === 'completed') {
          status = 'SUCCESS';
        } else if (order.status === 'payment-confirm' || order.status === 'on-hold') {
          status = 'PENDING';
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        
        // Create transaction
        const transactionData = {
          userId: userId,
          amount: amount,
          status: status,
          type: 'PURCHASE',
          paymentMethod: order.payment_gateway || 'BANK_TRANSFER',
          externalId: `sejoli-${order.id}`,
          reference: `Sejoli Order #${order.id}`,
          description: `Import from Sejoli Order #${order.id}`,
          createdAt: new Date(order.created_at || '2024-01-01'),
          updatedAt: new Date()
        };
        
        transactionsToCreate.push(transactionData);
        
        // Create membership if transaction is successful
        if (status === 'SUCCESS') {
          const membershipData = {
            userId: userId,
            membershipId: defaultMembership.id,
            startDate: new Date(order.created_at || '2024-01-01'),
            endDate: new Date(new Date(order.created_at || '2024-01-01').getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
            status: 'ACTIVE',
            createdAt: new Date()
          };
          
          membershipsToCreate.push(membershipData);
        }
      }
      
      // Bulk insert transactions
      if (transactionsToCreate.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToCreate,
          skipDuplicates: true
        });
      }
      
      // Bulk insert memberships
      if (membershipsToCreate.length > 0) {
        await prisma.userMembership.createMany({
          data: membershipsToCreate,
          skipDuplicates: true
        });
      }
      
      imported += transactionsToCreate.length;
      
      // Progress update
      if (i % 1000 === 0) {
        console.log(`✅ Processed ${i} orders, imported ${imported} transactions`);
      }
    }
    
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log(`✅ Imported: ${imported} transactions`);
    console.log(`🔗 Matched: ${matched} orders with users`);
    console.log(`⚠️ Skipped: ${skipped} orders (no matching user)`);
    
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

fixImportSimple();