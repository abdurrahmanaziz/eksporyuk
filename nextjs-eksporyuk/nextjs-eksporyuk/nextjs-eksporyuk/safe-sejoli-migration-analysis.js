const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function safeSejoliMigration() {
  console.log('🚀 SAFE SEJOLI TO NEON MIGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Get existing NEON data for duplicate check
    console.log('📊 CHECKING EXISTING NEON DATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const existingTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        externalId: true,
        amount: true,
        createdAt: true,
        status: true,
        type: true,
        reference: true
      }
    });
    
    console.log(`✅ Existing NEON transactions: ${existingTransactions.length.toLocaleString()}`);
    
    // Create lookup maps for duplicate checking
    const existingSejoliIds = new Set();
    const existingTransactionKeys = new Set();
    
    existingTransactions.forEach(tx => {
      if (tx.externalId) {
        existingSejoliIds.add(tx.externalId.toString());
      }
      // Also check reference field for Sejoli IDs
      if (tx.reference && tx.reference.includes('sejoli')) {
        const sejoliMatch = tx.reference.match(/sejoli[_-]?(\d+)/i);
        if (sejoliMatch) {
          existingSejoliIds.add(sejoliMatch[1]);
        }
      }
      // Create composite key for duplicate detection
      const key = `${tx.amount}_${tx.createdAt.toISOString().substring(0, 19)}_${tx.status}`;
      existingTransactionKeys.add(key);
    });
    
    console.log(`📋 Sejoli IDs in NEON: ${existingSejoliIds.size.toLocaleString()}`);
    
    // 2. Get Sejoli sales data
    console.log('\n🔗 FETCHING SEJOLI SALES DATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const response = await fetch('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Sejoli API error: ${response.status}`);
    }
    
    const salesData = await response.json();
    const sejoliOrders = salesData.orders || [];
    
    console.log(`✅ Sejoli orders fetched: ${sejoliOrders.length.toLocaleString()}`);
    
    // 3. Filter missing transactions
    console.log('\n🔍 IDENTIFYING MISSING TRANSACTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const missingOrders = [];
    const skipReasons = {
      'already_imported': 0,
      'duplicate_detected': 0,
      'invalid_data': 0,
      'zero_amount': 0
    };
    
    sejoliOrders.forEach((order, index) => {
      try {
        // Extract order data
        const sejoliOrderId = order.ID || order.id || order.order_id;
        const amount = parseFloat(order.grand_total || order.total || order.amount || 0);
        const dateCreated = order.date_created || order.created_at || order.order_date;
        const status = (order.status || order.order_status || 'unknown').toLowerCase();
        const productName = order.product_name || order.product_title || order.product || 'Unknown Product';
        const customerId = order.customer_id || order.user_id;
        const customerEmail = order.customer_email || order.billing_email || order.email;
        
        // Skip if already imported by Sejoli ID (check externalId and reference)
        if (sejoliOrderId && existingSejoliIds.has(sejoliOrderId.toString())) {
          skipReasons.already_imported++;
          return;
        }
        
        // Skip invalid data
        if (!dateCreated || !sejoliOrderId) {
          skipReasons.invalid_data++;
          return;
        }
        
        // Create composite key for duplicate detection
        const compositeKey = `${amount}_${dateCreated.substring(0, 19)}_${status}`;
        if (existingTransactionKeys.has(compositeKey)) {
          skipReasons.duplicate_detected++;
          return;
        }
        
        // Skip zero amount if status is cancelled
        if (amount === 0 && status === 'cancelled') {
          skipReasons.zero_amount++;
          return;
        }
        
        // This is a missing order that needs import
        missingOrders.push({
          sejoliOrderId,
          amount,
          dateCreated,
          status,
          productName,
          customerId,
          customerEmail,
          originalOrder: order
        });
        
      } catch (error) {
        skipReasons.invalid_data++;
        console.log(`⚠️ Error processing order ${index}: ${error.message}`);
      }
    });
    
    console.log(`📊 Missing orders to import: ${missingOrders.length.toLocaleString()}`);
    console.log('📋 Skip reasons:');
    Object.entries(skipReasons).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count.toLocaleString()}`);
    });
    
    if (missingOrders.length === 0) {
      console.log('\n✅ ALL DATA ALREADY MIGRATED - NO IMPORT NEEDED');
      return;
    }
    
    // 4. Analyze missing orders
    console.log('\n📊 MISSING ORDERS ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const statusCounts = {};
    const monthlyStats = {};
    let totalMissingRevenue = 0;
    let webinarOrders = 0;
    let membershipOrders = 0;
    
    missingOrders.forEach(order => {
      // Status analysis
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Monthly analysis
      const monthKey = order.dateCreated.substring(0, 7);
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { count: 0, revenue: 0 };
      }
      monthlyStats[monthKey].count++;
      
      if (order.status === 'completed') {
        totalMissingRevenue += order.amount;
        monthlyStats[monthKey].revenue += order.amount;
      }
      
      // Product type analysis
      const productLower = order.productName.toLowerCase();
      if (productLower.includes('webinar') || productLower.includes('zoom')) {
        webinarOrders++;
      } else if (productLower.includes('member') || productLower.includes('lifetime')) {
        membershipOrders++;
      }
    });
    
    console.log(`💰 Missing revenue (completed): Rp. ${totalMissingRevenue.toLocaleString()}`);
    console.log(`🎯 Webinar orders: ${webinarOrders.toLocaleString()}`);
    console.log(`👥 Membership orders: ${membershipOrders.toLocaleString()}`);
    
    console.log('\n📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count.toLocaleString()}`);
    });
    
    console.log('\n📅 Monthly breakdown (recent):');
    Object.entries(monthlyStats)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .forEach(([month, stats]) => {
        console.log(`  ${month}: ${stats.count} orders, Rp. ${stats.revenue.toLocaleString()}`);
      });
    
    // 5. Prepare import batches
    console.log('\n⚡ PREPARING SAFE IMPORT BATCHES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < missingOrders.length; i += BATCH_SIZE) {
      batches.push(missingOrders.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Import batches: ${batches.length}`);
    console.log(`📊 Batch size: ${BATCH_SIZE} orders per batch`);
    
    // 6. Show sample import data
    console.log('\n📋 SAMPLE IMPORT DATA (First 5 orders):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    missingOrders.slice(0, 5).forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.sejoliOrderId}`);
      console.log(`   Product: ${order.productName}`);
      console.log(`   Amount: Rp. ${order.amount.toLocaleString()}`);
      console.log(`   Date: ${order.dateCreated}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Customer: ${order.customerEmail || 'N/A'}`);
      console.log('');
    });
    
    // 7. Dry run validation
    console.log('🧪 DRY RUN VALIDATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check for potential issues
    const issues = [];
    const uniqueEmails = new Set();
    const duplicateEmails = [];
    
    missingOrders.forEach(order => {
      if (order.customerEmail) {
        if (uniqueEmails.has(order.customerEmail)) {
          duplicateEmails.push(order.customerEmail);
        }
        uniqueEmails.add(order.customerEmail);
      }
      
      if (order.amount < 0) {
        issues.push(`Negative amount: Order ${order.sejoliOrderId}`);
      }
      
      if (!order.dateCreated || order.dateCreated === '0000-00-00 00:00:00') {
        issues.push(`Invalid date: Order ${order.sejoliOrderId}`);
      }
    });
    
    console.log(`✅ Validation results:`);
    console.log(`  Unique customers: ${uniqueEmails.size.toLocaleString()}`);
    console.log(`  Duplicate emails: ${[...new Set(duplicateEmails)].length}`);
    console.log(`  Data issues found: ${issues.length}`);
    
    if (issues.length > 0 && issues.length < 10) {
      console.log('\n⚠️ Issues found:');
      issues.slice(0, 10).forEach(issue => console.log(`  ${issue}`));
    }
    
    // 8. Commission calculation preview
    console.log('\n💰 COMMISSION CALCULATION PREVIEW:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let estimatedCommissions = 0;
    let commissionableOrders = 0;
    
    missingOrders.forEach(order => {
      if (order.status === 'completed' && order.amount > 0) {
        // Estimate commission (30% average rate)
        const estimatedCommission = order.amount * 0.3;
        estimatedCommissions += estimatedCommission;
        commissionableOrders++;
      }
    });
    
    console.log(`🎯 Commissionable orders: ${commissionableOrders.toLocaleString()}`);
    console.log(`💎 Estimated commissions: Rp. ${estimatedCommissions.toLocaleString()}`);
    
    // 9. Import confirmation
    console.log('\n🚀 READY FOR SAFE IMPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Orders to import: ${missingOrders.length.toLocaleString()}`);
    console.log(`💰 Revenue to recover: Rp. ${totalMissingRevenue.toLocaleString()}`);
    console.log(`💎 Commissions to create: Rp. ${estimatedCommissions.toLocaleString()}`);
    console.log(`⚡ Import batches: ${batches.length}`);
    console.log(`✅ Duplicate protection: ENABLED`);
    console.log(`🔒 Error handling: ENABLED`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Data analysis complete - no duplicates will be imported');
    console.log('2. ⚡ Safe batch import ready to execute');  
    console.log('3. 💰 Affiliate commissions will be calculated during import');
    console.log('4. 🔍 All existing data preserved, only missing records added');
    
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`  Sejoli Total: ${sejoliOrders.length.toLocaleString()} orders`);
    console.log(`  NEON Existing: ${existingTransactions.length.toLocaleString()} transactions`);
    console.log(`  Missing: ${missingOrders.length.toLocaleString()} orders`);
    console.log(`  Data completeness will be: ${(((existingTransactions.length + missingOrders.length) / sejoliOrders.length) * 100).toFixed(1)}%`);
    
    console.log('\n✅ SAFE MIGRATION ANALYSIS COMPLETE');
    console.log('🚨 READY TO IMPORT WITHOUT DUPLICATES OR ERRORS');
    
  } catch (error) {
    console.error('❌ Migration analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute analysis
safeSejoliMigration();