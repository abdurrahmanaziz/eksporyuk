const https = require('https');
const fs = require('fs');

function fetchJSON(url, timeout = 600000) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching: ${url}`);
    const startTime = Date.now();
    
    const req = https.get(url, (res) => {
      let data = '';
      let receivedBytes = 0;
      
      res.on('data', chunk => {
        data += chunk;
        receivedBytes += chunk.length;
        process.stdout.write(`\rReceived: ${(receivedBytes / 1024 / 1024).toFixed(2)} MB`);
      });
      
      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\nCompleted in ${elapsed}s`);
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  console.log('📡 Fetching ALL Sales Data from Sejoli API...\n');
  
  try {
    const sales = await fetchJSON('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales');
    
    // Save raw data
    fs.writeFileSync('sejoli-sales-raw.json', JSON.stringify(sales, null, 2));
    console.log('\n💾 Raw data saved to sejoli-sales-raw.json');
    
    // Get orders array
    let orders = [];
    if (Array.isArray(sales)) {
      orders = sales;
    } else if (sales && typeof sales === 'object') {
      // Response might have recordsTotal, data, etc
      console.log(`\nResponse keys: ${Object.keys(sales).join(', ')}`);
      if (sales.recordsTotal) console.log(`Records Total: ${sales.recordsTotal}`);
      
      // Try to find orders array
      if (Array.isArray(sales.data)) orders = sales.data;
      else {
        // The response itself might be the array with extra props
        orders = Object.values(sales).filter(v => typeof v === 'object' && v !== null && v.ID);
      }
    }
    
    console.log(`\nProcessing ${orders.length} orders...`);
    
    // Analyze
    const statusCount = {};
    let omsetKotor = 0;
    let omsetBersih = 0;
    const affiliates = {};
    const products = {};
    
    orders.forEach(order => {
      if (!order || typeof order !== 'object') return;
      
      const status = order.status || 'unknown';
      const grandTotal = parseFloat(order.grand_total) || 0;
      const productId = order.product_id;
      const productName = order.product_name || `Product ${productId}`;
      const affiliateId = order.affiliate_id;
      const affiliateName = order.affiliate_name;
      
      statusCount[status] = (statusCount[status] || 0) + 1;
      omsetKotor += grandTotal;
      
      if (status === 'completed') {
        omsetBersih += grandTotal;
        
        // Track products
        if (productId) {
          if (!products[productId]) {
            products[productId] = { id: productId, name: productName, revenue: 0, count: 0 };
          }
          products[productId].revenue += grandTotal;
          products[productId].count++;
        }
        
        // Track affiliates
        if (affiliateId && affiliateId > 0) {
          if (!affiliates[affiliateId]) {
            affiliates[affiliateId] = {
              id: affiliateId,
              name: affiliateName || `Affiliate ${affiliateId}`,
              omset: 0,
              count: 0
            };
          }
          affiliates[affiliateId].omset += grandTotal;
          affiliates[affiliateId].count++;
        }
      }
    });
    
    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('📈 STATUS BREAKDOWN');
    console.log('='.repeat(80));
    Object.entries(statusCount).sort((a,b) => b[1]-a[1]).forEach(([s, c]) => {
      console.log(`  ${s.padEnd(20)}: ${c.toLocaleString()}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💰 OMSET SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Omset Kotor:  Rp ${omsetKotor.toLocaleString()}`);
    console.log(`  Omset Bersih: Rp ${omsetBersih.toLocaleString()}`);
    
    // Top affiliates
    const sortedAff = Object.values(affiliates).sort((a,b) => b.omset - a.omset);
    console.log('\n' + '='.repeat(80));
    console.log('👥 TOP 20 AFFILIATES');
    console.log('='.repeat(80));
    sortedAff.slice(0, 20).forEach((a, i) => {
      console.log(`  ${(i+1).toString().padEnd(3)} ${(a.name || 'Unknown').substring(0,30).padEnd(32)} ${a.count.toString().padEnd(6)} orders  Rp ${a.omset.toLocaleString()}`);
    });
    
    // Save affiliate data
    fs.writeFileSync('sejoli-affiliates-full.json', JSON.stringify(sortedAff, null, 2));
    console.log('\n💾 Affiliates saved to sejoli-affiliates-full.json');
    
    // Top products
    const sortedProd = Object.values(products).sort((a,b) => b.revenue - a.revenue);
    console.log('\n' + '='.repeat(80));
    console.log('🛍️ TOP 15 PRODUCTS');
    console.log('='.repeat(80));
    sortedProd.slice(0, 15).forEach((p, i) => {
      console.log(`  ${(i+1).toString().padEnd(3)} ID:${p.id.toString().padEnd(6)} ${(p.name || 'Unknown').substring(0,35).padEnd(37)} ${p.count.toString().padEnd(6)} orders  Rp ${p.revenue.toLocaleString()}`);
    });
    
    // Save product summary
    fs.writeFileSync('sejoli-products-revenue.json', JSON.stringify(sortedProd, null, 2));
    console.log('\n�� Products saved to sejoli-products-revenue.json');
    
    console.log('\n✅ Done!');
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
}

main();
