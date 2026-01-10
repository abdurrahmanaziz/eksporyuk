const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');

const prisma = new PrismaClient();

// Sejoli API Configuration
const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';
const SEJOLI_USERNAME = 'eksporyukapi';
const SEJOLI_PASSWORD = 'Eksporyuk2022!';

// Product commission mapping
const PRODUCT_COMMISSIONS = {
  179: 250000, 13401: 325000, 3840: 300000, 28: 280000, 93: 250000,
  1529: 250000, 4684: 250000, 6068: 250000, 6810: 250000, 11207: 250000,
  15234: 250000, 16956: 250000, 17920: 250000, 19296: 280000, 20852: 280000,
  8683: 300000, 13399: 250000, 8684: 250000, 13400: 200000,
  397: 0, 488: 0, 12994: 0, 13039: 0, 13045: 0, 16130: 0, 16860: 0,
  16963: 0, 17227: 0, 17322: 0, 17767: 0, 18358: 0, 18528: 20000,
  18705: 0, 18893: 0, 19042: 50000, 20130: 50000, 20336: 0, 21476: 50000,
  8910: 0, 8914: 0, 8915: 0,
  2910: 0, 3764: 85000, 4220: 0, 8686: 0,
  5928: 0, 5932: 150000, 5935: 0, 16581: 0, 16587: 0, 16592: 0,
  300: 0, 16826: 0
};

/**
 * Fetch from Sejoli REST API with pagination
 */
async function fetchSejoliAPI(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${SEJOLI_USERNAME}:${SEJOLI_PASSWORD}`).toString('base64');
    const queryString = Object.keys(params).map(k => `${k}=${params[k]}`).join('&');
    const url = `${SEJOLI_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    https.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch ALL sales data with pagination
 */
async function fetchAllSales() {
  console.log('📡 Fetching ALL sales data from Sejoli API...\n');
  
  const allSales = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      process.stdout.write(`   Fetching page ${page}...`);
      const response = await fetchSejoliAPI('/sales', { per_page: 100, page });
      
      if (response && response.data && response.data.length > 0) {
        allSales.push(...response.data);
        process.stdout.write(` ✅ Got ${response.data.length} orders\n`);
        page++;
        
        // Check if there are more pages
        if (response.data.length < 100) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`\n❌ Error fetching page ${page}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`\n✅ Total orders fetched: ${allSales.length}\n`);
  return allSales;
}

/**
 * Get commission for product
 */
function getCommission(productId) {
  return PRODUCT_COMMISSIONS[productId] || 0;
}

/**
 * Main audit function
 */
async function comprehensiveAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          🔍 COMPREHENSIVE SEJOLI DATA AUDIT - DETAILED ANALYSIS              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // ========================================================================
    // STEP 1: FETCH SEJOLI DATA
    // ========================================================================
    console.log('═'.repeat(80));
    console.log('📊 STEP 1: FETCHING DATA FROM SEJOLI REST API');
    console.log('═'.repeat(80) + '\n');
    
    const sejoliSales = await fetchAllSales();
    
    // Analyze Sejoli data
    const sejoliStats = {
      total: sejoliSales.length,
      completed: sejoliSales.filter(s => s.status === 'completed').length,
      pending: sejoliSales.filter(s => s.status === 'pending-payment' || s.status === 'on-hold').length,
      cancelled: sejoliSales.filter(s => s.status === 'cancelled' || s.status === 'refunded').length,
      withAffiliate: sejoliSales.filter(s => s.status === 'completed' && s.affiliate_id).length,
    };
    
    console.log('📈 SEJOLI DATA SUMMARY:');
    console.log(`   Total Orders: ${sejoliStats.total}`);
    console.log(`   Completed: ${sejoliStats.completed}`);
    console.log(`   Pending: ${sejoliStats.pending}`);
    console.log(`   Cancelled/Refunded: ${sejoliStats.cancelled}`);
    console.log(`   Completed with Affiliate: ${sejoliStats.withAffiliate}`);
    
    // Calculate Sejoli omset
    const sejoliOmsetKotor = sejoliSales
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + parseFloat(s.grand_total || 0), 0);
    
    const sejoliOmsetPending = sejoliSales
      .filter(s => s.status === 'pending-payment' || s.status === 'on-hold')
      .reduce((sum, s) => sum + parseFloat(s.grand_total || 0), 0);
    
    console.log(`\n💰 OMSET SEJOLI:`);
    console.log(`   Omset Kotor (Completed): Rp ${sejoliOmsetKotor.toLocaleString('id-ID')}`);
    console.log(`   Omset Pending: Rp ${sejoliOmsetPending.toLocaleString('id-ID')}`);
    
    // Calculate affiliate commission from Sejoli
    const sejoliAffiliateData = {};
    let sejoliTotalCommission = 0;
    
    sejoliSales.forEach(sale => {
      if (sale.status === 'completed' && sale.affiliate_id) {
        const affId = sale.affiliate_id.toString();
        const productId = parseInt(sale.product_id);
        const commission = getCommission(productId);
        
        if (!sejoliAffiliateData[affId]) {
          sejoliAffiliateData[affId] = {
            name: sale.affiliate_name || `Affiliate ${affId}`,
            orders: 0,
            commission: 0
          };
        }
        
        sejoliAffiliateData[affId].orders++;
        sejoliAffiliateData[affId].commission += commission;
        sejoliTotalCommission += commission;
      }
    });
    
    console.log(`\n👥 AFFILIATE DATA SEJOLI:`);
    console.log(`   Unique Affiliates: ${Object.keys(sejoliAffiliateData).length}`);
    console.log(`   Total Commission: Rp ${sejoliTotalCommission.toLocaleString('id-ID')}`);
    
    const sejoliOmsetBersih = sejoliOmsetKotor - sejoliTotalCommission;
    console.log(`   Omset Bersih (after commission): Rp ${sejoliOmsetBersih.toLocaleString('id-ID')}`);
    
    // ========================================================================
    // STEP 2: FETCH DATABASE DATA
    // ========================================================================
    console.log('\n' + '═'.repeat(80));
    console.log('💾 STEP 2: FETCHING DATA FROM DATABASE');
    console.log('═'.repeat(80) + '\n');
    
    const dbTransactions = await prisma.transaction.findMany({
      include: {
        affiliateConversion: true
      }
    });
    
    const dbStats = {
      total: dbTransactions.length,
      success: dbTransactions.filter(t => t.status === 'SUCCESS').length,
      pending: dbTransactions.filter(t => t.status === 'PENDING').length,
      failed: dbTransactions.filter(t => t.status === 'FAILED').length,
      withAffiliate: dbTransactions.filter(t => t.status === 'SUCCESS' && t.sejoliAffiliateId).length,
    };
    
    console.log('📈 DATABASE SUMMARY:');
    console.log(`   Total Transactions: ${dbStats.total}`);
    console.log(`   SUCCESS: ${dbStats.success}`);
    console.log(`   PENDING: ${dbStats.pending}`);
    console.log(`   FAILED: ${dbStats.failed}`);
    console.log(`   SUCCESS with Affiliate: ${dbStats.withAffiliate}`);
    
    // Calculate DB omset
    const dbOmsetKotor = dbTransactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dbOmsetPending = dbTransactions
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`\n💰 OMSET DATABASE:`);
    console.log(`   Omset Kotor (SUCCESS): Rp ${dbOmsetKotor.toLocaleString('id-ID')}`);
    console.log(`   Omset Pending: Rp ${dbOmsetPending.toLocaleString('id-ID')}`);
    
    // Get affiliate data from DB
    const dbAffiliateConversions = await prisma.affiliateConversion.findMany({
      where: {
        transaction: { status: 'SUCCESS' }
      },
      include: {
        affiliate: {
          include: {
            user: true
          }
        },
        transaction: true
      }
    });
    
    const dbAffiliateData = {};
    let dbTotalCommission = 0;
    
    dbAffiliateConversions.forEach(conv => {
      const affId = conv.affiliateId;
      const name = conv.affiliate?.user?.name || 'Unknown';
      
      if (!dbAffiliateData[affId]) {
        dbAffiliateData[affId] = {
          name,
          conversions: 0,
          commission: 0
        };
      }
      
      dbAffiliateData[affId].conversions++;
      dbAffiliateData[affId].commission += conv.commissionAmount;
      dbTotalCommission += conv.commissionAmount;
    });
    
    console.log(`\n👥 AFFILIATE DATA DATABASE:`);
    console.log(`   Unique Affiliates: ${Object.keys(dbAffiliateData).length}`);
    console.log(`   Total Conversions: ${dbAffiliateConversions.length}`);
    console.log(`   Total Commission: Rp ${dbTotalCommission.toLocaleString('id-ID')}`);
    
    const dbOmsetBersih = dbOmsetKotor - dbTotalCommission;
    console.log(`   Omset Bersih (after commission): Rp ${dbOmsetBersih.toLocaleString('id-ID')}`);
    
    // ========================================================================
    // STEP 3: COMPARISON & GAP ANALYSIS
    // ========================================================================
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 STEP 3: COMPARISON & GAP ANALYSIS');
    console.log('═'.repeat(80) + '\n');
    
    console.log('📊 TRANSACTION COMPARISON:');
    console.log(`   Sejoli Completed: ${sejoliStats.completed}`);
    console.log(`   DB SUCCESS: ${dbStats.success}`);
    console.log(`   Gap: ${sejoliStats.completed - dbStats.success} transactions`);
    
    console.log(`\n💰 OMSET KOTOR COMPARISON:`);
    console.log(`   Sejoli: Rp ${sejoliOmsetKotor.toLocaleString('id-ID')}`);
    console.log(`   Database: Rp ${dbOmsetKotor.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(sejoliOmsetKotor - dbOmsetKotor).toLocaleString('id-ID')}`);
    
    console.log(`\n👥 AFFILIATE COMPARISON:`);
    console.log(`   Sejoli Completed with Affiliate: ${sejoliStats.withAffiliate}`);
    console.log(`   DB Conversions: ${dbAffiliateConversions.length}`);
    console.log(`   Gap: ${sejoliStats.withAffiliate - dbAffiliateConversions.length} conversions`);
    
    console.log(`\n💸 COMMISSION COMPARISON:`);
    console.log(`   Sejoli Expected: Rp ${sejoliTotalCommission.toLocaleString('id-ID')}`);
    console.log(`   DB Actual: Rp ${dbTotalCommission.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(sejoliTotalCommission - dbTotalCommission).toLocaleString('id-ID')}`);
    
    console.log(`\n💵 OMSET BERSIH COMPARISON:`);
    console.log(`   Sejoli: Rp ${sejoliOmsetBersih.toLocaleString('id-ID')}`);
    console.log(`   Database: Rp ${dbOmsetBersih.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(sejoliOmsetBersih - dbOmsetBersih).toLocaleString('id-ID')}`);
    
    // ========================================================================
    // STEP 4: TOP 10 AFFILIATES COMPARISON
    // ========================================================================
    console.log('\n' + '═'.repeat(80));
    console.log('🏆 STEP 4: TOP 10 AFFILIATES COMPARISON');
    console.log('═'.repeat(80) + '\n');
    
    const sejoliTop10 = Object.entries(sejoliAffiliateData)
      .sort((a, b) => b[1].commission - a[1].commission)
      .slice(0, 10);
    
    const dbTop10 = Object.entries(dbAffiliateData)
      .sort((a, b) => b[1].commission - a[1].commission)
      .slice(0, 10);
    
    console.log('📊 SEJOLI TOP 10:');
    sejoliTop10.forEach(([id, data], i) => {
      console.log(`   ${i+1}. ${data.name}: Rp ${data.commission.toLocaleString('id-ID')} (${data.orders} orders)`);
    });
    
    console.log(`\n💾 DATABASE TOP 10:`);
    dbTop10.forEach(([id, data], i) => {
      console.log(`   ${i+1}. ${data.name}: Rp ${data.commission.toLocaleString('id-ID')} (${data.conversions} conversions)`);
    });
    
    // ========================================================================
    // STEP 5: MISSING DATA IDENTIFICATION
    // ========================================================================
    console.log('\n' + '═'.repeat(80));
    console.log('⚠️  STEP 5: MISSING DATA IDENTIFICATION');
    console.log('═'.repeat(80) + '\n');
    
    // Find Sejoli orders not in database
    const sejoliOrderIds = new Set(sejoliSales.map(s => s.id.toString()));
    const dbOrderIds = new Set(dbTransactions.map(t => t.sejoliOrderId).filter(Boolean));
    
    const missingOrders = [];
    sejoliSales.forEach(sale => {
      if (sale.status === 'completed' && !dbOrderIds.has(sale.id.toString())) {
        missingOrders.push({
          id: sale.id,
          date: sale.date,
          amount: sale.grand_total,
          hasAffiliate: !!sale.affiliate_id,
          affiliateName: sale.affiliate_name
        });
      }
    });
    
    console.log(`🔍 MISSING TRANSACTIONS IN DATABASE:`);
    console.log(`   Total Missing: ${missingOrders.length} completed orders`);
    
    if (missingOrders.length > 0) {
      console.log(`\n   Sample Missing Orders (first 10):`);
      missingOrders.slice(0, 10).forEach((order, i) => {
        console.log(`   ${i+1}. Order #${order.id} - Rp ${parseFloat(order.amount).toLocaleString('id-ID')} - ${order.hasAffiliate ? `Affiliate: ${order.affiliateName}` : 'No affiliate'}`);
      });
      
      const missingWithAffiliate = missingOrders.filter(o => o.hasAffiliate).length;
      console.log(`\n   Missing orders with affiliate: ${missingWithAffiliate}`);
    }
    
    // Find missing conversions (transactions with affiliate but no conversion)
    const txWithAffiliateNoConversion = dbTransactions.filter(t => 
      t.status === 'SUCCESS' && 
      t.sejoliAffiliateId && 
      !t.affiliateConversion
    );
    
    console.log(`\n🔍 TRANSACTIONS WITH AFFILIATE BUT NO CONVERSION:`);
    console.log(`   Total: ${txWithAffiliateNoConversion.length}`);
    
    if (txWithAffiliateNoConversion.length > 0) {
      console.log(`   Sample (first 10):`);
      txWithAffiliateNoConversion.slice(0, 10).forEach((tx, i) => {
        console.log(`   ${i+1}. Transaction #${tx.id} - Order #${tx.sejoliOrderId} - Affiliate ID: ${tx.sejoliAffiliateId}`);
      });
    }
    
    // ========================================================================
    // STEP 6: RECOMMENDATIONS
    // ========================================================================
    console.log('\n' + '═'.repeat(80));
    console.log('💡 STEP 6: RECOMMENDATIONS');
    console.log('═'.repeat(80) + '\n');
    
    if (missingOrders.length > 0) {
      console.log(`⚠️  RECOMMENDATION 1: Import ${missingOrders.length} missing orders`);
      console.log(`   Run: node import-missing-sejoli-orders.js`);
    } else {
      console.log(`✅ All Sejoli completed orders are in database`);
    }
    
    if (txWithAffiliateNoConversion.length > 0) {
      console.log(`\n⚠️  RECOMMENDATION 2: Create ${txWithAffiliateNoConversion.length} missing affiliate conversions`);
      console.log(`   Run: node fix-missing-conversions.js`);
    } else {
      console.log(`\n✅ All affiliate transactions have conversions`);
    }
    
    if (Math.abs(sejoliTotalCommission - dbTotalCommission) > 1000) {
      console.log(`\n⚠️  RECOMMENDATION 3: Commission mismatch detected`);
      console.log(`   Difference: Rp ${Math.abs(sejoliTotalCommission - dbTotalCommission).toLocaleString('id-ID')}`);
      console.log(`   Action: Review commission calculation mapping`);
    } else {
      console.log(`\n✅ Commission calculations are accurate`);
    }
    
    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('\n' + '╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            📊 FINAL SUMMARY                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ AUDIT COMPLETE\n');
    console.log('📊 DATA INTEGRITY:');
    console.log(`   Transaction Match: ${((dbStats.success / sejoliStats.completed) * 100).toFixed(1)}%`);
    console.log(`   Affiliate Conversion Match: ${((dbAffiliateConversions.length / sejoliStats.withAffiliate) * 100).toFixed(1)}%`);
    console.log(`   Commission Accuracy: ${(100 - Math.abs((sejoliTotalCommission - dbTotalCommission) / sejoliTotalCommission * 100)).toFixed(1)}%`);
    
    console.log(`\n💰 FINANCIAL SUMMARY:`);
    console.log(`   Omset Kotor: Rp ${dbOmsetKotor.toLocaleString('id-ID')}`);
    console.log(`   Total Komisi: Rp ${dbTotalCommission.toLocaleString('id-ID')}`);
    console.log(`   Omset Bersih: Rp ${dbOmsetBersih.toLocaleString('id-ID')}`);
    
    console.log(`\n📝 ACTION ITEMS:`);
    if (missingOrders.length === 0 && txWithAffiliateNoConversion.length === 0) {
      console.log(`   ✅ No action needed - data is complete and accurate!`);
    } else {
      if (missingOrders.length > 0) console.log(`   • Import ${missingOrders.length} missing orders`);
      if (txWithAffiliateNoConversion.length > 0) console.log(`   • Fix ${txWithAffiliateNoConversion.length} missing conversions`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
comprehensiveAudit().catch(console.error);
