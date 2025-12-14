const fs=require('fs');
const d=JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json','utf8'));

console.log('=== Analisa Data Sejoli ===\n');

// Sample order dengan affiliate
const withAff=d.orders.find(o=>o.affiliate_id>0);
console.log('Sample order dengan affiliate:');
console.log(JSON.stringify(withAff,null,2));

// Analisa per product
console.log('\n=== Top 15 Products by Orders ===');
const prods={};
d.orders.forEach(o=>{
  if(!prods[o.product_id]){
    prods[o.product_id]={
      count:0,
      completed:0,
      prices:new Set(),
      hasAff:0,
      totalAffComm:0
    };
  }
  prods[o.product_id].count++;
  if(o.status==='completed') prods[o.product_id].completed++;
  prods[o.product_id].prices.add(o.grand_total);
  if(o.affiliate_id>0) prods[o.product_id].hasAff++;
  if(o.affiliate_commission) prods[o.product_id].totalAffComm+=parseFloat(o.affiliate_commission);
});

Object.keys(prods)
  .sort((a,b)=>prods[b].count-prods[a].count)
  .slice(0,15)
  .forEach(pid=>{
    const p=prods[pid];
    const avgPrice=Array.from(p.prices)[0];
    console.log(`Product ${pid}:`);
    console.log(`  Orders: ${p.count} (${p.completed} completed)`);
    console.log(`  Price: Rp ${avgPrice.toLocaleString()}`);
    console.log(`  With Affiliate: ${p.hasAff} orders, Total Commission: Rp ${p.totalAffComm.toLocaleString()}`);
  });
