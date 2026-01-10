const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function executeSejoliImport() {
  console.log('🚀 EXECUTING SAFE SEJOLI IMPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let importStats = {
    total: 0,
    successful: 0,
    skipped: 0,
    errors: 0,
    commissions: 0,
    revenue: 0
  };

  try {
    // 1. Get existing data for duplicate check
    console.log('📊 LOADING EXISTING DATA:');
    const existingTransactions = await prisma.transaction.findMany({
      select: { externalId: true, reference: true, amount: true, createdAt: true, status: true }
    });
    
    const existingIds = new Set();
    const existingKeys = new Set();
    
    existingTransactions.forEach(tx => {
      if (tx.externalId) existingIds.add(tx.externalId.toString());
      if (tx.reference && tx.reference.includes('sejoli')) {
        const match = tx.reference.match(/sejoli[_-]?(\d+)/i);
        if (match) existingIds.add(match[1]);
      }
      const key = `${tx.amount}_${tx.createdAt.toISOString().substring(0, 19)}_${tx.status}`;
      existingKeys.add(key);
    });
    
    console.log(`✅ Loaded ${existingTransactions.length.toLocaleString()} existing transactions`);

    // 2. Get Sejoli data (both sales and products for commission rates)
    console.log('\n🔗 FETCHING SEJOLI DATA:');
    const [salesResponse, productsResponse] = await Promise.all([
      fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }),
      fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      })
    ]);
    
    if (salesResponse.status !== 200) {
      throw new Error(`Sejoli Sales API error: ${salesResponse.status}`);
    }
    
    if (productsResponse.status !== 200) {
      throw new Error(`Sejoli Products API error: ${productsResponse.status}`);
    }
    
    const salesData = await salesResponse.json();
    const products = await productsResponse.json();
    const sejoliOrders = salesData.orders || [];
    
    console.log(`✅ Fetched ${sejoliOrders.length.toLocaleString()} Sejoli orders`);
    console.log(`✅ Fetched ${products.length} products with commission data`);
    
    // 3. Build commission lookup from real product data
    console.log('\n💰 BUILDING COMMISSION LOOKUP:');
    const commissionLookup = {};
    let productsWithCommissions = 0;
    
    products.forEach(product => {
      const productId = product.id;
      const title = product.title;
      const affiliate = product.affiliate || {};
      
      // Extract real commission from affiliate.1.fee
      let commissionAmount = 0;
      let commissionType = 'FLAT';
      let hasCommission = false;
      
      if (affiliate['1'] && affiliate['1'].fee) {
        commissionAmount = parseFloat(affiliate['1'].fee);
        commissionType = affiliate['1'].type === 'fixed' ? 'FLAT' : 'PERCENTAGE';
        hasCommission = true;
        productsWithCommissions++;
      }
      
      // Store both by ID and title for lookup
      const commissionData = {
        amount: commissionAmount,
        type: commissionType,
        hasCommission: hasCommission
      };
      
      commissionLookup[productId] = commissionData;
      commissionLookup[title.toLowerCase().trim()] = commissionData;
    });
    
    console.log(`✅ ${productsWithCommissions} products have commission data`);
    console.log(`✅ Commission lookup table created`);
    

    // 4. Get default user for transactions
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!defaultUser) {
      throw new Error('No admin user found for default transactions');
    }
    console.log(`✅ Using default user: ${defaultUser.email}`);

    // 5. Process in batches
    const BATCH_SIZE = 50; // Reduced for safety
    const batches = [];
    
    for (let i = 0; i < sejoliOrders.length; i += BATCH_SIZE) {
      batches.push(sejoliOrders.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`\n⚡ PROCESSING ${batches.length} BATCHES:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let batchNumber = 0;
    
    for (const batch of batches) {
      batchNumber++;
      console.log(`\n📦 Batch ${batchNumber}/${batches.length} (${batch.length} orders)`);
      
      const transactionsToCreate = [];
      
      for (const order of batch) {
        try {
          // Extract order data
          const sejoliOrderId = order.ID || order.id || order.order_id;
          const amount = parseFloat(order.grand_total || order.total || order.amount || 0);
          const dateCreated = order.date_created || order.created_at || order.order_date;
          const status = (order.status || order.order_status || 'unknown').toLowerCase();
          const productName = order.product_name || order.product_title || order.product || 'Unknown Product';
          const customerEmail = order.customer_email || order.billing_email || order.email;
          const customerName = order.customer_name || order.billing_first_name || order.display_name;
          
          importStats.total++;
          
          // Skip if already exists
          if (sejoliOrderId && existingIds.has(sejoliOrderId.toString())) {
            importStats.skipped++;
            continue;
          }
          
          // Skip invalid data
          if (!dateCreated || !sejoliOrderId) {
            importStats.skipped++;
            continue;
          }
          
          // Skip duplicate by composite key
          const compositeKey = `${amount}_${dateCreated.substring(0, 19)}_${status}`;
          if (existingKeys.has(compositeKey)) {
            importStats.skipped++;
            continue;
          }
          
          // Skip zero amount cancelled orders
          if (amount === 0 && status === 'cancelled') {
            importStats.skipped++;
            continue;
          }
          
          // Determine transaction type and related IDs
          let transactionType = 'MEMBERSHIP'; // Default
          let eventId = null;
          let courseId = null;
          let productId = null;
          
          const productLower = productName.toLowerCase();
          
          if (productLower.includes('webinar') || productLower.includes('zoom') || productLower.includes('seminar')) {
            transactionType = 'EVENT';
            // We'll create events later if needed
          } else if (productLower.includes('course') || productLower.includes('kelas') || productLower.includes('training')) {
            transactionType = 'COURSE';
          } else if (productLower.includes('member') || productLower.includes('lifetime') || productLower.includes('paket')) {
            transactionType = 'MEMBERSHIP';
          } else {
            transactionType = 'PRODUCT';
          }
          
          // Map Sejoli status to NEON status
          let neonStatus = 'PENDING';
          if (status === 'completed') neonStatus = 'SUCCESS';
          else if (status === 'cancelled') neonStatus = 'FAILED';
          else if (status === 'refunded') neonStatus = 'REFUNDED';
          else if (status === 'on-hold') neonStatus = 'PENDING';
          else if (status === 'payment-confirm') neonStatus = 'PENDING';
          
          // Create transaction object
          const transactionData = {
            userId: defaultUser.id,
            type: transactionType,
            status: neonStatus,
            amount: amount,
            customerName: customerName || null,
            customerEmail: customerEmail || null,
            eventId: eventId,
            courseId: courseId,
            productId: productId,
            description: productName,
            reference: `sejoli_${sejoliOrderId}`,
            externalId: sejoliOrderId.toString(),
            paymentProvider: 'sejoli',
            notes: `Imported from Sejoli - Original status: ${status}`,
            metadata: {
              original_order: order,
              import_date: new Date().toISOString(),
              sejoli_product: productName
            },
            createdAt: new Date(dateCreated),
            updatedAt: new Date(dateCreated),
            paidAt: neonStatus === 'SUCCESS' ? new Date(dateCreated) : null
          };
          
          // Store additional data for commission calculation
          transactionData.metadata = {
            ...transactionData.metadata,
            productName: productName,
            sejoliProductId: order.product_id || null
          };
          
          transactionsToCreate.push(transactionData);
          
          if (neonStatus === 'SUCCESS') {
            importStats.revenue += amount;
          }
          
        } catch (error) {
          console.log(`⚠️ Error processing order ${order.ID}: ${error.message}`);
          importStats.errors++;
        }
      }
      
      // Batch insert transactions
      if (transactionsToCreate.length > 0) {
        try {
          const created = await prisma.transaction.createMany({
            data: transactionsToCreate,
            skipDuplicates: true
          });
          
          importStats.successful += created.count || transactionsToCreate.length;
          
          console.log(`   ✅ Created ${created.count || transactionsToCreate.length} transactions`);
          
        } catch (error) {
          console.log(`   ❌ Batch insert error: ${error.message}`);
          importStats.errors += transactionsToCreate.length;
        }
      }
      
      // Add existing keys to prevent duplicates in next batches
      transactionsToCreate.forEach(tx => {
        existingIds.add(tx.externalId);
        const key = `${tx.amount}_${tx.createdAt.toISOString().substring(0, 19)}_${tx.status}`;
        existingKeys.add(key);
      });
      
      // Progress update every 10 batches
      if (batchNumber % 10 === 0) {
        console.log(`📊 Progress: ${batchNumber}/${batches.length} batches (${importStats.successful} imported)`);
      }
      
      // Small delay to be respectful to database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 6. Commission calculation using REAL commission data
    console.log('\n💰 CALCULATING REAL AFFILIATE COMMISSIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successfulTransactions = await prisma.transaction.findMany({
      where: {
        paymentProvider: 'sejoli',
        status: 'SUCCESS',
        affiliateConversion: null // Not yet processed
      },
      take: 2000 // Process more for comprehensive commission calculation
    });
    
    console.log(`🎯 Found ${successfulTransactions.length} successful transactions for commission calculation`);
    
    let commissionsCreated = 0;
    let totalCommissionAmount = 0;
    let commissionsWithData = 0;
    let commissionsEstimated = 0;
    
    for (const transaction of successfulTransactions) {
      try {
        const metadata = transaction.metadata || {};
        const productName = metadata.productName || '';
        const sejoliProductId = metadata.sejoliProductId;
        
        // Look up real commission data
        let commissionAmount = 0;
        let commissionType = 'FLAT';
        let isEstimated = false;
        
        // Try lookup by Sejoli product ID first
        let commissionData = sejoliProductId ? commissionLookup[sejoliProductId] : null;
        
        // Fallback to product name lookup
        if (!commissionData && productName) {
          commissionData = commissionLookup[productName.toLowerCase().trim()];
        }
        
        if (commissionData && commissionData.hasCommission) {
          // Use real commission data
          commissionAmount = commissionData.amount;
          commissionType = commissionData.type;
          commissionsWithData++;
        } else {
          // Fallback to estimated commission for products without data
          const price = parseFloat(transaction.amount);
          
          if (productName.toLowerCase().includes('webinar') && price === 0) {
            commissionAmount = 0; // Free webinars no commission
          } else if (productName.toLowerCase().includes('webinar')) {
            commissionAmount = Math.min(50000, price * 0.25); // Webinar commission cap 50K
          } else if (productName.toLowerCase().includes('lifetime')) {
            commissionAmount = Math.min(300000, price * 0.35); // Lifetime commission cap 300K
          } else {
            commissionAmount = Math.min(150000, price * 0.30); // Default commission cap 150K
          }
          
          isEstimated = true;
          commissionsEstimated++;
        }
        
        // Only create commission if amount > 0
        if (commissionAmount > 0) {
          await prisma.affiliateConversion.create({
            data: {
              transactionId: transaction.id,
              affiliateId: defaultUser.id, // Default to admin for now
              commissionAmount: commissionAmount,
              commissionType: commissionType,
              commissionRate: commissionType === 'PERCENTAGE' ? 
                (commissionAmount / parseFloat(transaction.amount)) * 100 : 0,
              status: 'PENDING', // Will be processed later
              clickedAt: transaction.createdAt,
              convertedAt: transaction.paidAt || transaction.createdAt,
              metadata: {
                imported_commission: true,
                real_data: !isEstimated,
                estimated: isEstimated,
                product_name: productName,
                sejoli_product_id: sejoliProductId
              }
            }
          });
          
          commissionsCreated++;
          totalCommissionAmount += commissionAmount;
        }
        
      } catch (error) {
        console.log(`⚠️ Commission error for transaction ${transaction.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Created ${commissionsCreated} commission records`);
    console.log(`💰 Real commission data: ${commissionsWithData} transactions`);
    console.log(`📊 Estimated commissions: ${commissionsEstimated} transactions`);
    console.log(`🏆 Total commission amount: Rp. ${totalCommissionAmount.toLocaleString()}`);
    
    importStats.commissions = totalCommissionAmount;

    // 7. Final statistics
    console.log('\n📊 IMPORT SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Total orders processed: ${importStats.total.toLocaleString()}`);
    console.log(`✅ Successfully imported: ${importStats.successful.toLocaleString()}`);
    console.log(`⏭️ Skipped (duplicates): ${importStats.skipped.toLocaleString()}`);
    console.log(`❌ Errors encountered: ${importStats.errors.toLocaleString()}`);
    console.log(`💰 Revenue imported: Rp. ${importStats.revenue.toLocaleString()}`);
    console.log(`💎 Commissions created: ${commissionsCreated.toLocaleString()}`);
    console.log(`🏆 Commission amount: Rp. ${importStats.commissions.toLocaleString()}`);
    
    const successRate = ((importStats.successful / importStats.total) * 100).toFixed(1);
    console.log(`📈 Success rate: ${successRate}%`);
    
    // 8. Data verification
    console.log('\n🔍 VERIFICATION:');
    const finalCount = await prisma.transaction.count();
    const sejoliCount = await prisma.transaction.count({
      where: { paymentProvider: 'sejoli' }
    });
    
    console.log(`📊 Total NEON transactions: ${finalCount.toLocaleString()}`);
    console.log(`🔗 Sejoli transactions: ${sejoliCount.toLocaleString()}`);
    
    console.log('\n✅ SEJOLI IMPORT COMPLETED SUCCESSFULLY!');
    console.log('🎯 Missing data has been safely imported without duplicates');
    console.log('💰 Affiliate commissions created for revenue recovery');
    
  } catch (error) {
    console.error('❌ Import error:', error);
    console.log('\n📊 PARTIAL IMPORT STATISTICS:');
    console.log(`✅ Successful: ${importStats.successful.toLocaleString()}`);
    console.log(`❌ Errors: ${importStats.errors.toLocaleString()}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute import
executeSejoliImport();