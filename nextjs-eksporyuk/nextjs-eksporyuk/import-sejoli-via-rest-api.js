const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEJOLI_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';

async function fetchSejoliOrders() {
  console.log('🔄 Fetching orders from Sejoli REST API...\n');
  
  const response = await fetch(SEJOLI_API);
  const data = await response.json();
  
  if (!data.valid) {
    throw new Error('Invalid response from Sejoli API');
  }
  
  console.log(`✅ Fetched ${data.orders.length} orders from Sejoli\n`);
  return data.orders;
}

async function deleteAllTransactions() {
  console.log('🗑️  DELETING ALL EXISTING DATA...\n');
  
  // Delete in order (respect foreign keys)
  const conversionCount = await prisma.affiliateConversion.deleteMany({});
  console.log(`   Deleted ${conversionCount.count} affiliate conversions`);
  
  const pendingCount = await prisma.pendingRevenue.deleteMany({});
  console.log(`   Deleted ${pendingCount.count} pending revenues`);
  
  const txCount = await prisma.transaction.deleteMany({});
  console.log(`   Deleted ${txCount.count} transactions`);
  
  console.log('\n✅ All data deleted\n');
}

async function importSejoliOrders(orders) {
  console.log('📥 IMPORTING SEJOLI ORDERS...\n');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of orders) {
    try {
      // Skip if not completed
      if (order.status !== 'completed') {
        skipped++;
        continue;
      }
      
      // Get or create user
      let user = await prisma.user.findFirst({
        where: { email: order.user_email }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: order.user_email,
            name: order.user_name || 'Unknown',
            username: order.user_email.split('@')[0] + '_' + order.user_id,
            password: 'imported_from_sejoli',
            role: 'MEMBER_FREE',
            emailVerified: true
          }
        });
      }
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          user: { connect: { id: user.id } },
          type: 'MEMBERSHIP',
          amount: parseFloat(order.grand_total) || 0,
          status: 'SUCCESS',
          paymentMethod: order.payment_gateway || 'xendit',
          invoiceNumber: `INV${String(order.ID).padStart(5, '0')}`,
          reference: `SEJOLI-${order.ID}`,
          metadata: order.meta_data || {},
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at)
        }
      });
      
      // Create affiliate conversion if exists
      if (order.affiliate_id && parseFloat(order.total_affiliate_amount) > 0) {
        const affiliateUser = await prisma.user.findFirst({
          where: { 
            OR: [
              { id: { contains: String(order.affiliate_id) } },
              { email: { contains: order.affiliate_name?.toLowerCase() || '' } }
            ]
          }
        });
        
        if (affiliateUser) {
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliateUser.id,
              transactionId: transaction.id,
              commissionAmount: parseFloat(order.total_affiliate_amount) || 0,
              status: 'APPROVED',
              createdAt: new Date(order.created_at)
            }
          });
          
          // Update wallet balance
          await prisma.wallet.upsert({
            where: { userId: affiliateUser.id },
            create: {
              userId: affiliateUser.id,
              balance: parseFloat(order.total_affiliate_amount) || 0,
              balancePending: 0
            },
            update: {
              balance: {
                increment: parseFloat(order.total_affiliate_amount) || 0
              }
            }
          });
        }
      }
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} orders imported...`);
      }
      
    } catch (error) {
      errors++;
      if (errors < 10) {
        console.log(`   Error importing order ${order.ID}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}\n`);
}

async function verifyImport() {
  console.log('🔍 VERIFYING IMPORT...\n');
  
  const totalTx = await prisma.transaction.count();
  const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  
  const omset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  const conversions = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  console.log('📊 HASIL IMPORT:');
  console.log('================');
  console.log(`Total Transactions: ${totalTx.toLocaleString()}`);
  console.log(`Success Transactions: ${successTx.toLocaleString()}`);
  console.log(`Total Omset: Rp ${(omset._sum.amount || 0).toLocaleString('id')}`);
  console.log(`Total Komisi: Rp ${(conversions._sum.commissionAmount || 0).toLocaleString('id')}`);
  console.log('');
  console.log('📊 TARGET (dari Sejoli):');
  console.log('=========================');
  console.log('Total Sales: 12,842');
  console.log('Total Omset: Rp 4.125.031.962');
  console.log('Total Komisi: Rp 1.246.271.000');
}

(async () => {
  try {
    // Step 1: Delete all existing data
    await deleteAllTransactions();
    
    // Step 2: Fetch from Sejoli REST API
    const orders = await fetchSejoliOrders();
    
    // Step 3: Import orders
    await importSejoliOrders(orders);
    
    // Step 4: Verify
    await verifyImport();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
