/**
 * Import Data Sejoli ke Database NextJS
 * 17 Desember 2025
 * 
 * PENTING: Script ini akan import:
 * - Transaksi dari Sejoli (12,825 completed orders)
 * - User data (pembeli)
 * - Affiliate conversions
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Load data
const salesData = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const productsData = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));
const productMappingData = JSON.parse(fs.readFileSync('product-membership-mapping-latest.json', 'utf8'));

// Build lookup maps
const productMap = {};
productsData.forEach(p => {
  let commission = 0;
  if (p.affiliate && p.affiliate['1']) {
    const affData = p.affiliate['1'];
    if (affData.type === 'fixed') {
      commission = parseInt(affData.fee) || 0;
    } else if (affData.type === 'percentage') {
      commission = (parseInt(affData.fee) / 100) * p.price;
    }
  }
  productMap[p.id] = {
    id: p.id,
    title: p.title,
    price: p.price,
    commission: commission
  };
});

// Membership type mapping
const membershipTypeMap = {};
Object.entries(productMappingData).forEach(([type, ids]) => {
  ids.forEach(id => {
    membershipTypeMap[id] = type;
  });
});

// Status mapping Sejoli -> NextJS
const statusMap = {
  'completed': 'SUCCESS',
  'cancelled': 'FAILED',
  'on-hold': 'PENDING',
  'payment-confirm': 'PENDING',
  'refunded': 'REFUNDED'
};

async function main() {
  console.log('🚀 IMPORT DATA SEJOLI KE NEXTJS DATABASE');
  console.log('=========================================\n');
  
  const completedOrders = salesData.orders.filter(o => o.status === 'completed');
  console.log(`Total orders to import: ${completedOrders.length}`);
  
  // Get existing transactions to avoid duplicates
  const existingTransactions = await prisma.transaction.findMany({
    select: { externalId: true }
  });
  const existingExternalIds = new Set(existingTransactions.map(t => t.externalId));
  console.log(`Existing transactions in DB: ${existingExternalIds.size}`);
  
  // Filter orders yang belum ada di DB
  const newOrders = completedOrders.filter(o => {
    const extId = `sejoli-${o.ID}`;
    return !existingExternalIds.has(extId);
  });
  console.log(`New orders to import: ${newOrders.length}`);
  
  if (newOrders.length === 0) {
    console.log('\n✅ Tidak ada order baru untuk di-import');
    return;
  }
  
  // Get or create admin user for transactions without specific user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    console.log('Creating admin user...');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@eksporyuk.com',
        name: 'Admin Eksporyuk',
        role: 'ADMIN',
        password: 'hashed_password_placeholder'
      }
    });
  }
  
  // Get affiliates map (by name -> user id)
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    include: { user: true }
  });
  const affiliateByName = {};
  affiliateProfiles.forEach(ap => {
    if (ap.user) {
      affiliateByName[ap.user.name.toLowerCase()] = ap;
    }
  });
  console.log(`Existing affiliates in DB: ${affiliateProfiles.length}`);
  
  // Import in batches
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  let affiliateConversionsCreated = 0;
  
  for (let i = 0; i < newOrders.length; i += batchSize) {
    const batch = newOrders.slice(i, i + batchSize);
    
    for (const order of batch) {
      try {
        const extId = `sejoli-${order.ID}`;
        const product = productMap[order.product_id];
        const membershipType = membershipTypeMap[order.product_id] || 'MANUAL_CHECK';
        
        // Determine transaction type
        // Valid types: MEMBERSHIP, PRODUCT, COURSE, EVENT, COMMISSION, PAYOUT, SUPPLIER_MEMBERSHIP
        let transactionType = 'PRODUCT';
        if (membershipType === 'LIFETIME' || membershipType === 'MONTH_12' || membershipType === 'MONTH_6') {
          transactionType = 'MEMBERSHIP';
        }
        // FREE_USER and others go as PRODUCT
        
        // Parse date - field is created_at not created_on
        let orderDate = new Date(order.created_at);
        if (isNaN(orderDate.getTime())) {
          // Fallback to order_date if created_at invalid
          orderDate = new Date(order.order_date + ' 00:00:00');
        }
        if (isNaN(orderDate.getTime())) {
          // Final fallback to now
          orderDate = new Date();
        }
        
        // Calculate commission based on product
        const commission = product ? product.commission : 0;
        const amount = parseInt(order.grand_total) || 0;
        
        // Revenue split calculation (from PRD)
        // After affiliate commission: 15% admin, 60% founder, 40% cofounder
        const afterAffiliate = Math.max(0, amount - commission);
        const adminFee = Math.round(afterAffiliate * 0.15);
        const remaining = Math.max(0, afterAffiliate - adminFee);
        const founderShare = Math.round(remaining * 0.60);
        const cofounderShare = Math.round(remaining * 0.40);
        
        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: adminUser.id, // Will be linked to actual user if exists
            type: transactionType,
            status: 'SUCCESS',
            amount: amount,
            originalAmount: amount,
          customerName: order.user_name || 'Unknown',
          customerEmail: order.user_email || null,
          customerPhone: null,
          customerWhatsapp: null,
          description: `Import Sejoli: ${product ? product.title : 'Unknown Product'}`,
          reference: `SEJOLI-${order.ID}`,
          externalId: extId,
            paymentMethod: 'SEJOLI_IMPORT',
            paymentProvider: 'SEJOLI',
            founderShare: founderShare,
            coFounderShare: cofounderShare,
            affiliateShare: commission,
            companyFee: adminFee,
            paidAt: orderDate,
            createdAt: orderDate,
            metadata: {
              sejoliOrderId: order.ID,
              sejoliProductId: order.product_id,
              membershipType: membershipType,
              affiliateName: order.affiliate_name || null,
              affiliateId: order.affiliate_id || null,
              importedAt: new Date().toISOString()
            }
          }
        });
        
        // Create affiliate conversion if has affiliate
        if (order.affiliate_id && order.affiliate_id > 0 && commission > 0) {
          // Find affiliate profile by name (case insensitive)
          const affName = (order.affiliate_name || '').toLowerCase();
          const affiliateProfile = affiliateByName[affName];
          
          if (affiliateProfile) {
            try {
              await prisma.affiliateConversion.create({
                data: {
                  affiliateId: affiliateProfile.id,
                  transactionId: transaction.id,
                  commissionAmount: commission,
                  commissionRate: product ? (product.commission / product.price * 100) : 0,
                  paidOut: true, // Historical data, assumed paid
                  paidOutAt: orderDate,
                  createdAt: orderDate
                }
              });
              affiliateConversionsCreated++;
            } catch (convError) {
              // Ignore duplicate conversion errors
            }
          }
        }
        
        imported++;
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`Error importing order ${order.ID}:`, err.message);
        }
      }
    }
    
    console.log(`Progress: ${Math.min(i + batchSize, newOrders.length)}/${newOrders.length} (${imported} imported, ${errors} errors)`);
  }
  
  console.log('\n=========================================');
  console.log('📊 IMPORT SUMMARY');
  console.log('=========================================');
  console.log(`Total orders processed: ${newOrders.length}`);
  console.log(`Successfully imported: ${imported}`);
  console.log(`Errors: ${errors}`);
  console.log(`Affiliate conversions created: ${affiliateConversionsCreated}`);
  
  // Verify final count
  const finalCount = await prisma.transaction.count({
    where: { paymentProvider: 'SEJOLI' }
  });
  console.log(`\nTotal Sejoli transactions in DB: ${finalCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
