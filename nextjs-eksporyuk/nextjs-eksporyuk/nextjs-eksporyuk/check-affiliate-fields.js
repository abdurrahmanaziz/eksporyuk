const https = require('https');

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching sales data...');
  const data = await fetchData('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales');
  
  // Cari order yang punya affiliate
  const ordersWithAffiliate = data.orders.filter(o => o.affiliate && o.affiliate.name && o.affiliate.name !== '');
  
  console.log(`\nTotal orders: ${data.orders.length}`);
  console.log(`Orders dengan affiliate: ${ordersWithAffiliate.length}`);
  
  if (ordersWithAffiliate.length > 0) {
    console.log('\n=== Sample Order dengan Affiliate (SEMUA field) ===');
    console.log(JSON.stringify(ordersWithAffiliate[0], null, 2));
    
    console.log('\n=== 20 Orders dengan Affiliate ===');
    ordersWithAffiliate.slice(0, 20).forEach((o, i) => {
      console.log(`${i+1}. Order #${o.ID} | Aff: ${o.affiliate?.name || 'N/A'} | AffID: ${o.affiliate?.ID || 'N/A'} | AffFee: ${o.affiliate?.fee || 'N/A'} | Product: ${o.product?.ID || 'N/A'}`);
    });
    
    // Cek unique affiliate
    const affiliateMap = new Map();
    ordersWithAffiliate.forEach(o => {
      const affId = o.affiliate?.ID;
      const affName = o.affiliate?.name;
      const affFee = o.affiliate?.fee || 0;
      if (affId && !affiliateMap.has(affId)) {
        affiliateMap.set(affId, { name: affName, totalFee: 0, count: 0 });
      }
      if (affId) {
        affiliateMap.get(affId).totalFee += Number(affFee) || 0;
        affiliateMap.get(affId).count++;
      }
    });
    
    console.log(`\n=== Unique Affiliates: ${affiliateMap.size} ===`);
    const sorted = [...affiliateMap.entries()].sort((a, b) => b[1].totalFee - a[1].totalFee);
    sorted.slice(0, 20).forEach(([id, aff], i) => {
      console.log(`${i+1}. ID=${id} | ${aff.name} | Orders: ${aff.count} | Total Fee: Rp ${aff.totalFee.toLocaleString('id-ID')}`);
    });
  }
}

main().catch(console.error);
