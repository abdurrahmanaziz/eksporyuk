const https = require('https');

// Fetch all sales data from Sejoli API
async function fetchSejoliSales() {
  return new Promise((resolve, reject) => {
    const url = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales';
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 Fetching data from Sejoli API...\n');
  
  const response = await fetchSejoliSales();
  const sales = response;  // response is array of sales
  
  console.log(`📊 Total Records: ${response.recordsTotal || 'Unknown'}`);
  console.log(`📊 Total Filtered: ${response.recordsFiltered || 'Unknown'}\n`);
  
  // Status breakdown
  const statusCounts = {};
  let totalGrandTotal = 0;
  let completedGrandTotal = 0;
  const affiliateEarnings = {};
  const productSales = {};
  
  for (const sale of sales) {
    // Skip if not a valid sale object
    if (!sale || !sale.ID) continue;
    
    const status = sale.status || 'unknown';
    const grandTotal = parseFloat(sale.grand_total) || 0;
    const affiliateId = sale.affiliate_id;
    const affiliateName = sale.affiliate_name || 'Unknown';
    const productId = sale.product_id;
    const productName = sale.product_name || 'Unknown';
    
    // Count statuses
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    // Sum totals
    totalGrandTotal += grandTotal;
    
    if (status === 'completed') {
      completedGrandTotal += grandTotal;
      
      // Track affiliate earnings (for completed orders)
      if (affiliateId && affiliateId > 0) {
        const key = `${affiliateId}-${affiliateName}`;
        if (!affiliateEarnings[key]) {
          affiliateEarnings[key] = {
            id: affiliateId,
            name: affiliateName,
            totalSales: 0,
            orderCount: 0
          };
        }
        affiliateEarnings[key].totalSales += grandTotal;
        affiliateEarnings[key].orderCount++;
      }
      
      // Track product sales
      if (productId) {
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: productName,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        productSales[productId].totalRevenue += grandTotal;
        productSales[productId].orderCount++;
      }
    }
  }
  
  console.log('='.repeat(60));
  console.log('📈 STATUS BREAKDOWN');
  console.log('='.repeat(60));
  for (const [status, count] of Object.entries(statusCounts).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${status.padEnd(20)}: ${count.toLocaleString()} orders`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💰 OMSET / REVENUE SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Omset Kotor (All):      Rp ${totalGrandTotal.toLocaleString()}`);
  console.log(`  Omset Bersih (Completed): Rp ${completedGrandTotal.toLocaleString()}`);
  
  // Sort affiliates by total sales
  const sortedAffiliates = Object.values(affiliateEarnings)
    .sort((a, b) => b.totalSales - a.totalSales);
  
  console.log('\n' + '='.repeat(60));
  console.log('👥 TOP 20 AFFILIATES (by Total Sales Completed)');
  console.log('='.repeat(60));
  console.log(`  ${'No'.padEnd(4)} ${'Affiliate'.padEnd(30)} ${'Orders'.padEnd(10)} ${'Total Sales (Rp)'.padStart(20)}`);
  console.log('-'.repeat(70));
  
  const top20 = sortedAffiliates.slice(0, 20);
  top20.forEach((aff, i) => {
    console.log(`  ${(i+1).toString().padEnd(4)} ${aff.name.substring(0,28).padEnd(30)} ${aff.orderCount.toString().padEnd(10)} ${aff.totalSales.toLocaleString().padStart(20)}`);
  });
  
  // Summary stats
  const totalAffiliates = sortedAffiliates.length;
  const totalAffiliatedSales = sortedAffiliates.reduce((sum, a) => sum + a.totalSales, 0);
  const totalAffiliatedOrders = sortedAffiliates.reduce((sum, a) => sum + a.orderCount, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 AFFILIATE SUMMARY (Completed Orders Only)');
  console.log('='.repeat(60));
  console.log(`  Total Affiliates with Sales: ${totalAffiliates}`);
  console.log(`  Total Orders via Affiliate:  ${totalAffiliatedOrders.toLocaleString()}`);
  console.log(`  Total Sales via Affiliate:   Rp ${totalAffiliatedSales.toLocaleString()}`);
  console.log(`  % of Total Completed:        ${((totalAffiliatedSales/completedGrandTotal)*100).toFixed(2)}%`);
  
  // Product summary
  const sortedProducts = Object.values(productSales)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  console.log('\n' + '='.repeat(60));
  console.log('🛍️ TOP 15 PRODUCTS (by Revenue Completed)');
  console.log('='.repeat(60));
  sortedProducts.slice(0, 15).forEach((prod, i) => {
    console.log(`  ${(i+1).toString().padEnd(3)} ID:${prod.id.toString().padEnd(6)} ${prod.name.substring(0,25).padEnd(25)} ${prod.orderCount.toString().padEnd(6)} orders  Rp ${prod.totalRevenue.toLocaleString()}`);
  });
  
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
