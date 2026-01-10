const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const SEJOLI_PRODUCTS_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/products';
const SEJOLI_SALES_API = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';

// Product ID → Membership Type mapping (sesuai PRD)
const PRODUCT_MEMBERSHIP_MAPPING = {
  13401: 'LIFETIME',    // Paket Ekspor Yuk Lifetime
  13400: '6_MONTH',     // Paket Ekspor Yuk 6 Bulan
  8683: '12_MONTH',     // Paket Ekspor Yuk 12 Bulan
  // Add more mapping as needed
};

async function step1_ImportProducts() {
  console.log('📦 STEP 1: IMPORT PRODUCTS FROM SEJOLI\n');
  
  const response = await fetch(SEJOLI_PRODUCTS_API);
  const products = await response.json();
  
  console.log(`Fetched ${products.length} products from Sejoli\n`);
  
  let imported = 0;
  const productCommissionMap = {};
  
  for (const prod of products) {
    try {
      // Get affiliate commission (tier 1)
      const affiliateData = prod.affiliate?.['1'] || prod.affiliate?.['0'] || {};
      const commissionAmount = parseFloat(affiliateData.fee || 0);
      const commissionType = affiliateData.type === 'fixed' ? 'FLAT' : 'PERCENTAGE';
      
      // Store commission for later use
      productCommissionMap[prod.id] = {
        amount: commissionAmount,
        type: commissionType
      };
      
      // Check if product type is membership
      const isMembership = PRODUCT_MEMBERSHIP_MAPPING[prod.id] !== undefined;
      
      // Determine category based on product_type
      let category = 'OTHER';
      if (prod.title.toLowerCase().includes('webinar')) category = 'WEBINAR';
      else if (prod.title.toLowerCase().includes('course') || prod.title.toLowerCase().includes('kursus')) category = 'COURSE';
      else if (isMembership) category = 'MEMBERSHIP';
      
      // Create or update product
      await prisma.product.upsert({
        where: { id: `sejoli_${prod.id}` },
        create: {
          id: `sejoli_${prod.id}`,
          name: prod.title,
          description: prod.content || prod.excerpt || '',
          price: parseFloat(prod.product_raw_price) || 0,
          category: category,
          status: prod.product_active ? 'ACTIVE' : 'INACTIVE',
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionAmount,
          metadata: {
            sejoliId: prod.id,
            productType: prod.product_type,
            paymentType: prod.payment_type,
            membershipType: PRODUCT_MEMBERSHIP_MAPPING[prod.id] || null
          }
        },
        update: {
          name: prod.title,
          price: parseFloat(prod.product_raw_price) || 0,
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionAmount,
          metadata: {
            sejoliId: prod.id,
            productType: prod.product_type,
            paymentType: prod.payment_type,
            membershipType: PRODUCT_MEMBERSHIP_MAPPING[prod.id] || null
          }
        }
      });
      
      imported++;
      
      if (imported % 10 === 0) {
        console.log(`   Imported ${imported} products...`);
      }
      
    } catch (error) {
      console.log(`   Error importing product ${prod.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Imported ${imported} products\n`);
  
  // Save commission map to file for next step
  fs.writeFileSync('/tmp/product-commission-map.json', JSON.stringify(productCommissionMap, null, 2));
  
  return productCommissionMap;
}

async function step2_DeleteOldData() {
  console.log('🗑️  STEP 2: DELETE OLD TRANSACTION DATA\n');
  
  const conversionCount = await prisma.affiliateConversion.deleteMany({});
  console.log(`   Deleted ${conversionCount.count} affiliate conversions`);
  
  const txCount = await prisma.transaction.deleteMany({});
  console.log(`   Deleted ${txCount.count} transactions\n`);
}

async function step3_ImportTransactions(productCommissionMap) {
  console.log('📥 STEP 3: IMPORT TRANSACTIONS WITH CORRECT MAPPING\n');
  
  const response = await fetch(SEJOLI_SALES_API);
  const data = await response.json();
  const orders = data.orders;
  
  console.log(`Fetched ${orders.length} orders from Sejoli\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let totalCommission = 0;
  
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
            username: (order.user_email.split('@')[0] + '_' + order.user_id).toLowerCase(),
            password: 'imported_from_sejoli',
            role: 'MEMBER_FREE',
            emailVerified: true
          }
        });
      }
      
      // Get product commission
      const productId = order.product_id;
      const commission = productCommissionMap[productId] || { amount: 0, type: 'FLAT' };
      
      // Determine transaction type based on product mapping
      const membershipType = PRODUCT_MEMBERSHIP_MAPPING[productId];
      const transactionType = membershipType ? 'MEMBERSHIP' : 'PRODUCT';
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          user: { connect: { id: user.id } },
          product: { connect: { id: `sejoli_${productId}` } },
          type: transactionType,
          amount: parseFloat(order.grand_total) || 0,
          status: 'SUCCESS',
          paymentMethod: order.payment_gateway || 'xendit',
          invoiceNumber: `INV${String(order.ID).padStart(5, '0')}`,
          reference: `SEJOLI-${order.ID}`,
          metadata: {
            ...order.meta_data,
            sejoliOrderId: order.ID,
            productName: order.product_name
          },
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at)
        }
      });
      
      // Create affiliate conversion if commission > 0
      if (order.affiliate_id && commission.amount > 0) {
        // Try to find affiliate user
        const affiliateUser = await prisma.user.findFirst({
          where: {
            role: { in: ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER'] }
          },
          orderBy: { createdAt: 'asc' },
          take: 1
        });
        
        if (affiliateUser) {
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliateUser.id,
              transactionId: transaction.id,
              commissionAmount: commission.amount,
              status: 'APPROVED',
              createdAt: new Date(order.created_at)
            }
          });
          
          // Update wallet
          await prisma.wallet.upsert({
            where: { userId: affiliateUser.id },
            create: {
              userId: affiliateUser.id,
              balance: commission.amount,
              balancePending: 0
            },
            update: {
              balance: { increment: commission.amount }
            }
          });
          
          totalCommission += commission.amount;
        }
      }
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} orders imported, Rp ${totalCommission.toLocaleString('id')} komisi...`);
      }
      
    } catch (error) {
      errors++;
      if (errors < 10) {
        console.log(`   Error: ${error.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total Commission: Rp ${totalCommission.toLocaleString('id')}\n`);
}

async function step4_Verify() {
  console.log('🔍 STEP 4: VERIFY IMPORT\n');
  
  const products = await prisma.product.count();
  const transactions = await prisma.transaction.count();
  const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  
  const membershipTx = await prisma.transaction.count({ where: { type: 'MEMBERSHIP' } });
  const productTx = await prisma.transaction.count({ where: { type: 'PRODUCT' } });
  
  const omset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  const conversions = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true }
  });
  
  console.log('📊 HASIL AKHIR:');
  console.log('===============');
  console.log(`Products: ${products.toLocaleString()}`);
  console.log(`Total Transactions: ${transactions.toLocaleString()}`);
  console.log(`  ├─ SUCCESS: ${successTx.toLocaleString()}`);
  console.log(`  ├─ MEMBERSHIP: ${membershipTx.toLocaleString()}`);
  console.log(`  └─ PRODUCT: ${productTx.toLocaleString()}`);
  console.log(`Total Omset: Rp ${(omset._sum.amount || 0).toLocaleString('id')}`);
  console.log(`Total Komisi: Rp ${(conversions._sum.commissionAmount || 0).toLocaleString('id')}`);
  console.log('');
  console.log('📊 TARGET (Sejoli Dashboard):');
  console.log('==============================');
  console.log('Total Sales: 12,842');
  console.log('Total Omset: Rp 4.125.031.962');
  console.log('Total Komisi: Rp 1.246.271.000');
}

(async () => {
  try {
    const productCommissionMap = await step1_ImportProducts();
    await step2_DeleteOldData();
    await step3_ImportTransactions(productCommissionMap);
    await step4_Verify();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
