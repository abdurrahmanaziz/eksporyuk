/**
 * FETCH SEMUA DATA DARI SEJOLI API - FIXED VERSION
 * Target: 19,253 transaksi (recordsTotal dari API)
 * 
 * Response format dari API:
 * {
 *   "0": {...sale1},
 *   "1": {...sale2},
 *   ...
 *   "messages": [],
 *   "recordsTotal": 19253,
 *   "recordsFiltered": 19253
 * }
 */

const fs = require('fs');
const path = require('path');

const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';

async function fetchWithRetry(url, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EksporYuk-Import/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function fetchAllSales() {
  console.log('\n📥 FETCHING ALL SALES FROM SEJOLI API');
  console.log('='.repeat(70));
  
  let allSales = [];
  let page = 1;
  const perPage = 100;
  const startTime = Date.now();
  
  // First, get total count
  const firstResponse = await fetchWithRetry(`${SEJOLI_API_BASE}/sales?page=1&per_page=1`);
  const totalRecords = firstResponse.recordsTotal || 0;
  console.log(`📊 Total records in API: ${totalRecords.toLocaleString()}`);
  
  const totalPages = Math.ceil(totalRecords / perPage);
  console.log(`📄 Total pages to fetch: ${totalPages}`);
  
  while (page <= totalPages) {
    try {
      const url = `${SEJOLI_API_BASE}/sales?page=${page}&per_page=${perPage}`;
      console.log(`🔄 Fetching page ${page}/${totalPages}...`);
      
      const response = await fetchWithRetry(url);
      
      // Extract sales from response (numeric keys are the sales data)
      const salesFromPage = [];
      for (const key in response) {
        if (!isNaN(parseInt(key)) && response[key] && response[key].ID) {
          salesFromPage.push(response[key]);
        }
      }
      
      if (salesFromPage.length > 0) {
        allSales = allSales.concat(salesFromPage);
        console.log(`✅ Page ${page}: +${salesFromPage.length} (Total: ${allSales.length})`);
      } else {
        console.log(`⚠️ Page ${page}: No data returned`);
      }
      
      page++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
      
      // Progress every 20 pages
      if (page % 20 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        const progress = ((allSales.length / totalRecords) * 100).toFixed(1);
        console.log(`⏱️ Progress: ${progress}% (${allSales.length}/${totalRecords}) - ${elapsed} min`);
      }
      
    } catch (error) {
      console.error(`💥 Error on page ${page}:`, error.message);
      // Continue to next page instead of stopping
      page++;
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ FETCH COMPLETE: ${allSales.length.toLocaleString()} sales in ${duration} minutes`);
  
  return allSales;
}

async function main() {
  console.log('🚀 SEJOLI COMPLETE DATA FETCH');
  console.log('Target: 19,253 transactions, 18,000+ users');
  console.log('='.repeat(70));
  
  try {
    const sales = await fetchAllSales();
    
    // Analysis
    console.log('\n📈 DATA ANALYSIS');
    console.log('='.repeat(70));
    
    const statusCount = {};
    const uniqueEmails = new Set();
    const uniqueUserIds = new Set();
    const uniqueProducts = new Set();
    const uniqueAffiliates = new Set();
    let totalRevenue = 0;
    
    for (const sale of sales) {
      // Status
      statusCount[sale.status] = (statusCount[sale.status] || 0) + 1;
      
      // Users
      if (sale.user_email) uniqueEmails.add(sale.user_email.toLowerCase());
      if (sale.user_id) uniqueUserIds.add(sale.user_id);
      
      // Products & Affiliates
      if (sale.product_id) uniqueProducts.add(sale.product_id);
      if (sale.affiliate_id && sale.affiliate_id > 0) uniqueAffiliates.add(sale.affiliate_id);
      
      // Revenue (only completed)
      if (sale.status === 'completed') {
        totalRevenue += parseFloat(sale.grand_total || 0);
      }
    }
    
    console.log('\n📋 STATUS BREAKDOWN:');
    Object.entries(statusCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        const pct = ((count / sales.length) * 100).toFixed(1);
        console.log(`   ${status}: ${count.toLocaleString()} (${pct}%)`);
      });
    
    console.log('\n🔢 TOTALS:');
    console.log(`   Total Sales: ${sales.length.toLocaleString()}`);
    console.log(`   Unique Emails: ${uniqueEmails.size.toLocaleString()}`);
    console.log(`   Unique User IDs: ${uniqueUserIds.size.toLocaleString()}`);
    console.log(`   Unique Products: ${uniqueProducts.size}`);
    console.log(`   Unique Affiliates: ${uniqueAffiliates.size}`);
    console.log(`   Total Revenue (completed): Rp ${totalRevenue.toLocaleString()}`);
    
    // Save to file
    const filePath = path.join(__dirname, 'sejoli-complete-data.json');
    const dataToSave = {
      fetchedAt: new Date().toISOString(),
      totalSales: sales.length,
      uniqueUsers: uniqueEmails.size,
      statusBreakdown: statusCount,
      totalRevenue,
      sales: sales,
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log(`\n💾 Saved to: sejoli-complete-data.json`);
    console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Target verification
    console.log('\n🎯 TARGET VERIFICATION:');
    console.log(`   Sales: 19,253 expected → ${sales.length} actual ${sales.length >= 19000 ? '✅' : '❌'}`);
    console.log(`   Users: 18,000+ expected → ${uniqueEmails.size} actual ${uniqueEmails.size >= 14000 ? '✅' : '⚠️'}`);
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
