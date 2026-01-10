const fs = require('fs');

const data = JSON.parse(fs.readFileSync('affiliate-commissions-calculated.json', 'utf8'));
let total = 0;
data.affiliates.forEach(a => { 
  if (typeof a.totalKomisi === 'number' && !Number.isNaN(a.totalKomisi)) {
    total += a.totalKomisi; 
  }
});

console.log('Total Komisi dari Affiliates:', total.toLocaleString());
console.log('Total Affiliates:', data.affiliates.length);
console.log('Dashboard:', (1248871000).toLocaleString());
console.log('Selisih:', (1248871000 - total).toLocaleString());

// Top 5
console.log('\nTop 5 Affiliates:');
data.affiliates.slice(0, 5).forEach((a, i) => {
  console.log(`${i+1}. ${a.name}: Rp ${a.totalKomisi.toLocaleString()} (${a.totalSales} sales)`);
});
