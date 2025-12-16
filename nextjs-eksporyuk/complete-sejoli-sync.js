const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';

// Membership tier mapping sesuai PRD
const MEMBERSHIP_MAPPING = {
  999000: { tier: 'LIFETIME', duration: null },
  699000: { tier: '6_MONTH', duration: 6 },
  399000: { tier: '3_MONTH', duration: 3 },
  199000: { tier: '1_MONTH', duration: 1 },
  0: { tier: 'FREE', duration: null }
};

async function step1_fetchProducts() {
  console.log('📦 STEP 1: FETCH PRODUCTS FROM SEJOLI\n');
  console.log('   Downloading products from API (may take 30-60 seconds)...\n');
  
  const response = await fetch(`${SEJOLI_API_BASE}/products`);
  const products = await response.json();
  
  console.log(`✅ Fetched ${products.length} products\n`);
  
  // Save to file for reference
  fs.writeFileSync('/tmp/sejoli-products-full.json', JSON.stringify(products, null, 2));
  console.log(`   Saved to /tmp/sejoli-products-full.json\n`);
  
  return products;
}

async function step2_importProducts(sejoliProducts) {
  console.log('📥 STEP 2: IMPORT PRODUCTS TO NEW PLATFORM\n');
  
  let imported = 0;
  const productMapping = {};
  
  for (const sp of sejoliProducts) {
    try {
      // Extract affiliate commission
      const affiliateData = sp.affiliate?.['1'] || {};
      const commissionValue = affiliateData.fee || 0;
      const commissionType = affiliateData.type === 'fixed' ? 'FLAT' : 'PERCENTAGE';
      
      // Determine membership tier if it's a membership product
      const membershipTier = MEMBERSHIP_MAPPING[sp.product_raw_price];
      
      // Create or update product
      const product = await prisma.product.upsert({
        where: { 
          id: `sejoli_${sp.id}` 
        },
        create: {
          id: `sejoli_${sp.id}`,
          name: sp.title,
          slug: sp.slug,
          description: sp.content || sp.excerpt || '',
          price: sp.product_raw_price,
          type: sp.product_type === 'digital' ? 'DIGITAL' : 'PHYSICAL',
          status: sp.product_active ? 'ACTIVE' : 'INACTIVE',
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionValue,
          metadata: {
            sejoli_id: sp.id,
            payment_type: sp.payment_type,
            subscription: sp.subscription,
            membership_tier: membershipTier
          }
        },
        update: {
          name: sp.title,
          price: sp.product_raw_price,
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionValue,
          metadata: {
            sejoli_id: sp.id,
            payment_type: sp.payment_type,
            subscription: sp.subscription,
            membership_tier: membershipTier
          }
        }
      });
      
      productMapping[sp.id] = product.id;
      imported++;
      
      if (imported % 10 === 0) {
        console.log(`   Progress: ${imported} products...`);
      }
      
    } catch (error) {
      console.log(`   Error importing product ${sp.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Imported ${imported} products\n`);
  return productMapping;
}

async function step3_deleteOldTransactions() {
  console.log('🗑️  STEP 3: DELETE OLD TRANSACTIONS\n');
  
  const conversionCount = await prisma.affiliateConversion.deleteMany({});
  console.log(`   Deleted ${conversionCount.count} affiliate conversions`);
  
  const pendingCount = await prisma.pendingRevenue.deleteMany({});
  console.log(`   Deleted ${pendingCount.count} pending revenues`);
  
  const txCount = await prisma.transaction.deleteMany({});
  console.log(`   Deleted ${txCount.count} transactions\n`);
}

async function step4_importTransactions(productMapping) {
  console.log('📥 STEP 4: IMPORT TRANSACTIONS WITH CORRECT MAPPING\n');
  
  const response = await fetch(`${SEJOLI_API_BASE}/sales`);
  const data = await response.json();
  const orders = data.orders || [];
  
  console.log(`✅ Fetched ${orders.length} orders from Sejoli\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of orders) {
    try {
      // Only import completed orders
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
            username: `${order.user_email.split('@')[0]}_${order.user_id}`,
            password: 'imported_from_sejoli',
            role: 'MEMBER_FREE',
            emailVerified: true
          }
        });
      }
      
      // Get product from mapping
      const productId = productMapping[order.product_id];
      const product = productId ? await prisma.product.findUnique({ 
        where: { id: productId } 
      }) : null;
      
      // Determine transaction type based on product
      let txType = 'PRODUCT';
      let membershipTier = null;
      
      if (product?.metadata?.membership_tier) {
        txType = 'MEMBERSHIP';
        membershipTier = product.metadata.membership_tier.tier;
      }
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          user: { connect: { id: user.id } },
          type: txType,
          amount: parseFloat(order.grand_total) || 0,
          status: 'SUCCESS',
          paymentMethod: order.payment_gateway || 'xendit',
          invoiceNumber: `INV${String(order.ID).padStart(5, '0')}`,
          reference: `SEJOLI-${order.ID}`,
          metadata: {
            ...order.meta_data,
            product_id: order.product_id,
            product_name: order.product_name,
            membership_tier: membershipTier
          },
          ...(productId && { product: { connect: { id: productId } } }),
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at)
        }
      });
      
      // Create affiliate conversion if product has commission
      if (order.affiliate_id && product && product.affiliateCommissionRate > 0) {
        const commissionAmount = product.affiliateCommissionType === 'FLAT'
          ? product.affiliateCommissionRate
          : (parseFloat(order.grand_total) * product.affiliateCommissionRate / 100);
        
        // Find or create affiliate user
        let affiliateUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: order.affiliate_name?.toLowerCase() || '' } },
              { name: { contains: order.affiliate_name || '' } }
            ]
          }
        });
        
        if (!affiliateUser) {
          affiliateUser = await prisma.user.create({
            data: {
              email: `affiliate_${order.affiliate_id}@eksporyuk.com`,
              name: order.affiliate_name || `Affiliate ${order.affiliate_id}`,
              username: `affiliate_${order.affiliate_id}`,
              password: 'imported_affiliate',
              role: 'AFFILIATE',
              emailVerified: true
            }
          });
        } else if (affiliateUser.role !== 'AFFILIATE') {
          // Upgrade to affiliate if not already
          await prisma.user.update({
            where: { id: affiliateUser.id },
            data: { role: 'AFFILIATE' }
          });
        }
        
        // Create conversion
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: affiliateUser.id,
            transactionId: transaction.id,
            commissionAmount: commissionAmount,
            status: 'APPROVED',
            createdAt: new Date(order.created_at)
          }
        });
        
        // Update wallet
        await prisma.wallet.upsert({
          where: { userId: affiliateUser.id },
          create: {
            userId: affiliateUser.id,
            balance: commissionAmount,
            balancePending: 0
          },
          update: {
            balance: { increment: commissionAmount }
          }
        });
      }
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} transactions...`);
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

async function step5_verify() {
  console.log('🔍 STEP 5: VERIFY DATA\n');
  
  const products = await prisma.product.count();
  const totalTx = await prisma.transaction.count();
  const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  
  const omset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  const conversions = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: true
  });
  
  console.log('📊 HASIL FINAL:');
  console.log('================');
  console.log(`Products: ${products.toLocaleString()}`);
  console.log(`Total Transactions: ${totalTx.toLocaleString()}`);
  console.log(`Success Transactions: ${successTx.toLocaleString()}`);
  console.log(`Total Omset: Rp ${(omset._sum.amount || 0).toLocaleString('id')}`);
  console.log(`Affiliate Conversions: ${conversions._count.toLocaleString()}`);
  console.log(`Total Komisi: Rp ${(conversions._sum.commissionAmount || 0).toLocaleString('id')}`);
  console.log('');
  console.log('📊 TARGET (Sejoli Dashboard):');
  console.log('===============================');
  console.log('Total Sales: 12,842');
  console.log('Total Omset: Rp 4.125.031.962');
  console.log('Total Komisi: Rp 1.246.271.000');
  console.log('');
  
  // Sample transactions by type
  console.log('📋 Sample Transactions by Type:');
  const byType = await prisma.transaction.groupBy({
    by: ['type'],
    _count: true,
    where: { status: 'SUCCESS' }
  });
  byType.forEach(t => {
    console.log(`   ${t.type}: ${t._count.toLocaleString()}`);
  });
}

// Main execution
(async () => {
  try {
    console.log('🚀 COMPLETE SEJOLI SYNC - PRODUCTION READY\n');
    console.log('==========================================\n');
    
    // Step 1: Fetch products
    const sejoliProducts = await step1_fetchProducts();
    
    // Step 2: Import products with commission mapping
    const productMapping = await step2_importProducts(sejoliProducts);
    
    // Step 3: Clean old transactions
    await step3_deleteOldTransactions();
    
    // Step 4: Import transactions with correct product mapping
    await step4_importTransactions(productMapping);
    
    // Step 5: Verify results
    await step5_verify();
    
    console.log('\n✅ SYNC COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
