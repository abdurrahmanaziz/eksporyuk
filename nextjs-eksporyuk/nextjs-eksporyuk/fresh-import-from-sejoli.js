/**
 * FRESH IMPORT FROM SEJOLI API TO NEXTJS DATABASE
 * 18 Desember 2025
 * 
 * WORKFLOW:
 * 1. Fetch products dari Sejoli API
 * 2. Fetch sales/transaksi dari Sejoli API  
 * 3. Fetch affiliates dari Sejoli API
 * 4. Validate data (no duplicates, no errors)
 * 5. Import ke database NextJS (PostgreSQL Neon)
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

const SEJOLI_BASE_URL = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';

// Utility untuk fetch dari Sejoli API
function fetchFromSejoli(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${SEJOLI_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllSales() {
  console.log('📥 Fetching ALL sales from Sejoli API...');
  const allOrders = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`  Fetching page ${page}...`);
    const response = await fetchFromSejoli('/sales', { 
      page: page,
      per_page: 100 
    });
    
    if (response.orders && response.orders.length > 0) {
      allOrders.push(...response.orders);
      console.log(`    Got ${response.orders.length} orders (total: ${allOrders.length})`);
      
      // Check if there's more data
      if (response.orders.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
    
    // Safety limit
    if (page > 200) {
      console.log('    Reached page limit (200)');
      hasMore = false;
    }
  }
  
  console.log(`✅ Total orders fetched: ${allOrders.length}`);
  return allOrders;
}

async function fetchAllProducts() {
  console.log('📥 Fetching products from Sejoli API...');
  const response = await fetchFromSejoli('/products');
  console.log(`✅ Total products fetched: ${response.length}`);
  return response;
}

async function fetchAllAffiliates() {
  console.log('📥 Fetching affiliates from Sejoli API...');
  const allAffiliates = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`  Fetching affiliate page ${page}...`);
    try {
      const response = await fetchFromSejoli('/affiliates', { 
        page: page,
        per_page: 100 
      });
      
      if (response && response.length > 0) {
        allAffiliates.push(...response);
        console.log(`    Got ${response.length} affiliates (total: ${allAffiliates.length})`);
        
        if (response.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.log(`    Error fetching affiliates: ${error.message}`);
      hasMore = false;
    }
    
    if (page > 50) {
      hasMore = false;
    }
  }
  
  console.log(`✅ Total affiliates fetched: ${allAffiliates.length}`);
  return allAffiliates;
}

async function validateData(products, sales, affiliates) {
  console.log('\n🔍 VALIDATING DATA...');
  console.log('='.repeat(60));
  
  // Check for duplicate order IDs
  const orderIds = sales.map(o => o.ID);
  const uniqueOrderIds = new Set(orderIds);
  console.log(`  Total orders: ${orderIds.length}`);
  console.log(`  Unique order IDs: ${uniqueOrderIds.size}`);
  console.log(`  Duplicates: ${orderIds.length - uniqueOrderIds.size}`);
  
  if (orderIds.length !== uniqueOrderIds.size) {
    throw new Error('❌ DUPLICATE ORDER IDs FOUND!');
  }
  
  // Check completed orders
  const completedOrders = sales.filter(o => o.status === 'completed');
  console.log(`  Completed orders: ${completedOrders.length}`);
  
  // Calculate total omset
  let totalOmset = 0;
  completedOrders.forEach(o => {
    totalOmset += parseFloat(o.grand_total) || 0;
  });
  console.log(`  Total omset: Rp ${totalOmset.toLocaleString()}`);
  
  // Check products
  console.log(`  Total products: ${products.length}`);
  
  // Check affiliates
  console.log(`  Total affiliates: ${affiliates.length}`);
  
  console.log('✅ Data validation passed!');
  
  return {
    totalOrders: orderIds.length,
    completedOrders: completedOrders.length,
    totalOmset: totalOmset,
    totalProducts: products.length,
    totalAffiliates: affiliates.length
  };
}

async function importProducts(products) {
  console.log('\n📦 IMPORTING PRODUCTS...');
  console.log('='.repeat(60));
  
  let imported = 0;
  let updated = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      // Extract commission info
      let commissionRate = 0;
      let commissionType = 'PERCENTAGE';
      
      if (product.affiliate && product.affiliate['1']) {
        const affData = product.affiliate['1'];
        if (affData.type === 'fixed') {
          commissionType = 'FLAT';
          commissionRate = parseFloat(affData.fee) || 0;
        } else if (affData.type === 'percentage') {
          commissionType = 'PERCENTAGE';
          commissionRate = parseFloat(affData.fee) || 0;
        }
      }
      
      // Upsert product
      await prisma.product.upsert({
        where: { 
          externalId: `sejoli-product-${product.id}` 
        },
        create: {
          name: product.title || 'Unknown Product',
          description: product.description || null,
          price: parseFloat(product.price) || 0,
          externalId: `sejoli-product-${product.id}`,
          isActive: true,
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionRate,
          createdById: 'cmj547e5d0004it1e6434w860', // Admin user ID
          metadata: {
            sejoliProductId: product.id,
            originalData: product
          }
        },
        update: {
          name: product.title || 'Unknown Product',
          price: parseFloat(product.price) || 0,
          affiliateCommissionType: commissionType,
          affiliateCommissionRate: commissionRate,
          updatedAt: new Date()
        }
      });
      
      imported++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error importing product ${product.id}:`, err.message);
      }
    }
  }
  
  console.log(`✅ Products imported: ${imported}, errors: ${errors}`);
}

async function importTransactions(sales, products) {
  console.log('\n💰 IMPORTING TRANSACTIONS...');
  console.log('='.repeat(60));
  
  // Build product map
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });
  
  // Get all imported products from DB
  const dbProducts = await prisma.product.findMany({
    select: {
      id: true,
      externalId: true
    }
  });
  
  const productIdMap = {};
  dbProducts.forEach(p => {
    if (p.externalId && p.externalId.startsWith('sejoli-product-')) {
      const sejoliId = p.externalId.replace('sejoli-product-', '');
      productIdMap[sejoliId] = p.id;
    }
  });
  
  // Filter completed orders only
  const completedOrders = sales.filter(o => o.status === 'completed');
  console.log(`  Processing ${completedOrders.length} completed orders...`);
  
  // Check existing transactions
  const existingTx = await prisma.transaction.findMany({
    where: {
      externalId: {
        startsWith: 'sejoli-'
      }
    },
    select: { externalId: true }
  });
  const existingExternalIds = new Set(existingTx.map(t => t.externalId));
  console.log(`  Existing transactions: ${existingExternalIds.size}`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of completedOrders) {
    const externalId = `sejoli-${order.ID}`;
    
    // Skip if already exists
    if (existingExternalIds.has(externalId)) {
      skipped++;
      continue;
    }
    
    try {
      // Get product info
      const sejoliProduct = productMap[order.product_id];
      const dbProductId = productIdMap[order.product_id];
      
      // Calculate commission
      let commission = 0;
      if (sejoliProduct && sejoliProduct.affiliate && sejoliProduct.affiliate['1']) {
        const affData = sejoliProduct.affiliate['1'];
        if (affData.type === 'fixed') {
          commission = parseFloat(affData.fee) || 0;
        } else if (affData.type === 'percentage') {
          commission = (parseFloat(affData.fee) / 100) * parseFloat(order.grand_total);
        }
      }
      
      const amount = parseFloat(order.grand_total) || 0;
      
      // Revenue split calculation
      const afterAffiliate = Math.max(0, amount - commission);
      const adminFee = Math.round(afterAffiliate * 0.15);
      const remaining = Math.max(0, afterAffiliate - adminFee);
      const founderShare = Math.round(remaining * 0.60);
      const cofounderShare = Math.round(remaining * 0.40);
      
      // Parse date
      let orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) {
        orderDate = new Date(order.order_date + ' 00:00:00');
      }
      if (isNaN(orderDate.getTime())) {
        orderDate = new Date();
      }
      
      // Determine transaction type
      let transactionType = 'PRODUCT';
      if (sejoliProduct) {
        const productName = sejoliProduct.title.toLowerCase();
        if (productName.includes('paket ekspor') || productName.includes('membership') || 
            productName.includes('bulan') || productName.includes('lifetime')) {
          transactionType = 'MEMBERSHIP';
        }
      }
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: 'cmj547e5d0004it1e6434w860', // Admin user, will be updated later
          productId: dbProductId || null,
          type: transactionType,
          status: 'SUCCESS',
          amount: amount,
          originalAmount: amount,
          customerName: order.user_name || 'Unknown',
          customerEmail: order.user_email || null,
          description: `Sejoli: ${sejoliProduct ? sejoliProduct.title : 'Unknown Product'}`,
          reference: `SEJOLI-${order.ID}`,
          externalId: externalId,
          paymentMethod: 'SEJOLI_IMPORT',
          paymentProvider: 'SEJOLI',
          founderShare: founderShare,
          coFounderShare: cofounderShare,
          affiliateShare: commission,
          companyFee: adminFee,
          affiliateId: order.affiliate_id ? String(order.affiliate_id) : null,
          paidAt: orderDate,
          createdAt: orderDate,
          metadata: {
            sejoliOrderId: order.ID,
            sejoliProductId: order.product_id,
            sejoliAffiliateId: order.affiliate_id,
            sejoliAffiliateName: order.affiliate_name,
            importedAt: new Date().toISOString()
          }
        }
      });
      
      imported++;
      
      if (imported % 500 === 0) {
        console.log(`    Progress: ${imported} transactions imported...`);
      }
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error importing order ${order.ID}:`, err.message);
      }
    }
  }
  
  console.log(`✅ Transactions imported: ${imported}, skipped: ${skipped}, errors: ${errors}`);
}

async function verifyImport() {
  console.log('\n✅ VERIFYING IMPORT...');
  console.log('='.repeat(60));
  
  const stats = await prisma.transaction.aggregate({
    where: {
      paymentProvider: 'SEJOLI',
      status: 'SUCCESS'
    },
    _count: true,
    _sum: {
      amount: true,
      affiliateShare: true,
      founderShare: true,
      coFounderShare: true,
      companyFee: true
    }
  });
  
  console.log(`  Total transactions: ${stats._count.toLocaleString()}`);
  console.log(`  Total omset: Rp ${parseFloat(stats._sum.amount || 0).toLocaleString()}`);
  console.log(`  Total affiliate commission: Rp ${parseFloat(stats._sum.affiliateShare || 0).toLocaleString()}`);
  console.log(`  Total founder share: Rp ${parseFloat(stats._sum.founderShare || 0).toLocaleString()}`);
  console.log(`  Total cofounder share: Rp ${parseFloat(stats._sum.coFounderShare || 0).toLocaleString()}`);
  console.log(`  Total admin fee: Rp ${parseFloat(stats._sum.companyFee || 0).toLocaleString()}`);
}

async function main() {
  console.log('🚀 FRESH IMPORT FROM SEJOLI API TO NEXTJS DATABASE');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Step 1: Fetch data from Sejoli API
    const products = await fetchAllProducts();
    const sales = await fetchAllSales();
    const affiliates = await fetchAllAffiliates();
    
    // Step 2: Validate data
    const validation = await validateData(products, sales, affiliates);
    
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(JSON.stringify(validation, null, 2));
    
    // Step 3: Import products
    await importProducts(products);
    
    // Step 4: Import transactions
    await importTransactions(sales, products);
    
    // Step 5: Verify import
    await verifyImport();
    
    console.log('\n✅ IMPORT COMPLETE!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
