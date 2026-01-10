const fs = require('fs');

console.log('🔍 REVERSE ENGINEERING KOMISI DARI SCREENSHOT');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

const OWNER_USER_ID = 53;
const userMap = new Map();
sejoli.users.forEach(u => userMap.set(u.id, u));

const validOrders = sejoli.orders.filter(o => 
  o.status === 'completed' && 
  o.affiliate_id > 0 && 
  o.affiliate_id !== OWNER_USER_ID
);

// Expected from screenshot
const screenshotData = [
  { name: 'Rahmat Al Fianto', email: 'rahmatalfianto1997@gmail.com', commission: 169955000 },
  { name: 'Asep Abdurrahman Wahid', email: 'asep.abdurrahman.w@gmail.com', commission: 165150000 },
  { name: 'Sutisna', email: 'azzka42@gmail.com', commission: 132825000 },
  { name: 'Hamid Baidowi', email: 'hamidbaidowi03@gmail.com', commission: 131110000 },
  { name: 'Yoga Andrian', email: 'yogasoneo@gmail.com', commission: 93085000 },
  { name: 'NgobrolinEkspor', email: 'irmaprime01@gmail.com', commission: 83957000 },
  { name: 'eko wibowo', email: 'ekowibowo831@gmail.com', commission: 65777000 },
  { name: 'PintarEkspor', email: 'pintarekspor146@gmail.com', commission: 53909000 },
  { name: 'Muhamad safrizal', email: 'rsaf924@gmail.com', commission: 43800000 },
  { name: 'Brian', email: 'mentorpasukan@gmail.com', commission: 36500000 }
];

// Let's analyze each affiliate's orders to understand the commission structure
console.log('\n📊 ANALYSIS OF TOP 3 AFFILIATES FROM SCREENSHOT:');
console.log('═══════════════════════════════════════════════════════════════');

for (const expected of screenshotData.slice(0, 3)) {
  const user = sejoli.users.find(u => u.user_email === expected.email);
  if (!user) continue;
  
  const orders = validOrders.filter(o => o.affiliate_id === user.id);
  
  console.log(`\n👤 ${expected.name} (${expected.email})`);
  console.log(`   Screenshot Commission: Rp ${expected.commission.toLocaleString('id-ID')}`);
  console.log(`   Total Orders: ${orders.length}`);
  console.log(`   Avg Commission per Order: Rp ${Math.round(expected.commission / orders.length).toLocaleString('id-ID')}`);
  
  // Group by product
  const byProduct = {};
  orders.forEach(o => {
    if (!byProduct[o.product_id]) {
      byProduct[o.product_id] = { count: 0, totalAmount: 0, amounts: [] };
    }
    byProduct[o.product_id].count++;
    byProduct[o.product_id].totalAmount += o.grand_total;
    byProduct[o.product_id].amounts.push(o.grand_total);
  });
  
  console.log(`\n   Product breakdown:`);
  Object.entries(byProduct)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([pid, data]) => {
      const avgPrice = data.count > 0 ? data.totalAmount / data.count : 0;
      // Calculate what commission rate would be needed
      const totalOrders = orders.length;
      const expectedCommPerProduct = (expected.commission / totalOrders) * data.count;
      const impliedRatePerOrder = expectedCommPerProduct / data.count;
      
      console.log(`     Product ${pid}: ${data.count} orders, avg Rp ${Math.round(avgPrice).toLocaleString('id-ID')}`);
    });
}

// Now let's try percentage-based commission instead of flat rate
console.log('\n\n💡 TESTING PERCENTAGE-BASED COMMISSION:');
console.log('═══════════════════════════════════════════════════════════════');

// Maybe commission is 30% of price for paid products, 0 for free
function calculatePercentageCommission(orders, percentage) {
  let total = 0;
  orders.forEach(o => {
    if (o.grand_total > 0) {
      total += o.grand_total * percentage;
    }
  });
  return total;
}

// Test different percentages
[0.25, 0.30, 0.35, 0.40].forEach(pct => {
  console.log(`\nTesting ${pct * 100}% commission rate:`);
  
  screenshotData.slice(0, 5).forEach(expected => {
    const user = sejoli.users.find(u => u.user_email === expected.email);
    if (!user) return;
    
    const orders = validOrders.filter(o => o.affiliate_id === user.id);
    const calculated = calculatePercentageCommission(orders, pct);
    const diff = calculated - expected.commission;
    const diffPct = (diff / expected.commission * 100).toFixed(1);
    
    console.log(`  ${expected.name}: Calculated Rp ${Math.round(calculated).toLocaleString('id-ID')} vs Screenshot Rp ${expected.commission.toLocaleString('id-ID')} (${diffPct}%)`);
  });
});

// Try mixed approach: percentage for some products, 0 for free products
console.log('\n\n💡 TESTING 33% ON PAID PRODUCTS:');
console.log('═══════════════════════════════════════════════════════════════');

// Products with 0 revenue likely have commission calculated differently
// Let's analyze which products have 0 grand_total

const productsWithZeroPrice = new Set();
const productsWithPrice = new Set();

validOrders.forEach(o => {
  if (o.grand_total === 0) {
    productsWithZeroPrice.add(o.product_id);
  } else {
    productsWithPrice.add(o.product_id);
  }
});

console.log(`\nProducts with Rp 0 orders: ${[...productsWithZeroPrice].join(', ')}`);
console.log(`Products with paid orders: ${[...productsWithPrice].join(', ')}`);

// Count free vs paid orders per affiliate
console.log('\n\n📊 FREE vs PAID orders per affiliate:');
screenshotData.slice(0, 5).forEach(expected => {
  const user = sejoli.users.find(u => u.user_email === expected.email);
  if (!user) return;
  
  const orders = validOrders.filter(o => o.affiliate_id === user.id);
  const freeOrders = orders.filter(o => o.grand_total === 0);
  const paidOrders = orders.filter(o => o.grand_total > 0);
  const paidRevenue = paidOrders.reduce((sum, o) => sum + o.grand_total, 0);
  
  console.log(`\n${expected.name}:`);
  console.log(`  Free orders: ${freeOrders.length}`);
  console.log(`  Paid orders: ${paidOrders.length}`);
  console.log(`  Paid revenue: Rp ${paidRevenue.toLocaleString('id-ID')}`);
  console.log(`  Screenshot commission: Rp ${expected.commission.toLocaleString('id-ID')}`);
  console.log(`  Commission / Paid Revenue: ${(expected.commission / paidRevenue * 100).toFixed(1)}%`);
});

// Now calculate with 34% commission on paid products only
console.log('\n\n🎯 FINAL CALCULATION WITH 34% COMMISSION ON PAID PRODUCTS:');
console.log('═══════════════════════════════════════════════════════════════');

const COMMISSION_RATE = 0.34;

const affiliateResults = {};

validOrders.forEach(o => {
  const user = userMap.get(o.affiliate_id);
  if (!user) return;
  
  const email = user.user_email;
  const commission = o.grand_total > 0 ? Math.round(o.grand_total * COMMISSION_RATE) : 0;
  
  if (!affiliateResults[email]) {
    affiliateResults[email] = {
      name: user.display_name,
      email: email,
      orders: 0,
      paidOrders: 0,
      freeOrders: 0,
      commission: 0,
      revenue: 0
    };
  }
  
  affiliateResults[email].orders++;
  affiliateResults[email].revenue += o.grand_total;
  affiliateResults[email].commission += commission;
  
  if (o.grand_total > 0) {
    affiliateResults[email].paidOrders++;
  } else {
    affiliateResults[email].freeOrders++;
  }
});

const sortedResults = Object.values(affiliateResults)
  .sort((a, b) => b.commission - a.commission);

console.log('\n👥 TOP 15 AFFILIATES:');
sortedResults.slice(0, 15).forEach((aff, i) => {
  const expected = screenshotData.find(s => s.email === aff.email);
  
  console.log(`\n${i+1}. ${aff.name}`);
  console.log(`   Email: ${aff.email}`);
  console.log(`   Orders: ${aff.orders} (${aff.paidOrders} paid, ${aff.freeOrders} free)`);
  console.log(`   Revenue: Rp ${aff.revenue.toLocaleString('id-ID')}`);
  console.log(`   💰 Commission: Rp ${aff.commission.toLocaleString('id-ID')}`);
  
  if (expected) {
    const diff = aff.commission - expected.commission;
    const diffPct = (diff / expected.commission * 100).toFixed(1);
    console.log(`   📊 Screenshot: Rp ${expected.commission.toLocaleString('id-ID')}`);
    console.log(`   ${Math.abs(diff) < 5000000 ? '✅' : '❌'} Diff: Rp ${diff.toLocaleString('id-ID')} (${diffPct}%)`);
  }
});

// Grand totals
const totalCommission = sortedResults.reduce((sum, a) => sum + a.commission, 0);
const totalRevenue = sortedResults.reduce((sum, a) => sum + a.revenue, 0);
const totalOrders = sortedResults.reduce((sum, a) => sum + a.orders, 0);

console.log('\n\n💵 GRAND TOTAL:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Affiliates: ${sortedResults.length}`);
console.log(`Total Orders: ${totalOrders}`);
console.log(`Total Revenue (Omset Kotor): Rp ${totalRevenue.toLocaleString('id-ID')}`);
console.log(`💰 Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
console.log(`Commission Rate: ${(totalCommission / totalRevenue * 100).toFixed(1)}% of revenue`);

// Compare
const myTop10 = sortedResults.slice(0, 10).reduce((sum, a) => sum + a.commission, 0);
const screenshotTop10 = screenshotData.reduce((sum, s) => sum + s.commission, 0);
console.log(`\nTop 10 Comparison:`);
console.log(`  Calculated: Rp ${myTop10.toLocaleString('id-ID')}`);
console.log(`  Screenshot: Rp ${screenshotTop10.toLocaleString('id-ID')}`);
console.log(`  Difference: Rp ${(myTop10 - screenshotTop10).toLocaleString('id-ID')}`);
