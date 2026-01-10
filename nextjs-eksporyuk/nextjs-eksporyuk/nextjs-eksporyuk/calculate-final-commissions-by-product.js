const fs = require('fs');

console.log('💰 KALKULASI KOMISI FINAL BERDASARKAN MEDIAN HARGA PRODUK');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Step 1: Analyze each product to find median price
const products = {};

sejoli.orders.forEach(order => {
  const pid = order.product_id;
  if (!products[pid]) {
    products[pid] = {
      id: pid,
      allPrices: []
    };
  }
  
  if (order.grand_total > 0) {
    products[pid].allPrices.push(order.grand_total);
  }
});

// Calculate median for each product and determine commission
const productCommissions = {};

Object.entries(products).forEach(([pid, data]) => {
  if (data.allPrices.length > 0) {
    const sorted = data.allPrices.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    let commission = 0;
    
    // Tentukan komisi berdasarkan median price
    if (median >= 35000 && median < 300000) {
      commission = 200000; // Rp 200K untuk harga 35K-300K
    } else if (median >= 300000 && median < 600000) {
      commission = 200000; // Rp 200K untuk harga 300K-600K
    } else if (median >= 600000 && median < 800000) {
      commission = 250000; // Rp 250K untuk harga 600K-800K
    } else if (median >= 800000) {
      commission = 325000; // Rp 325K untuk harga 800K+
    }
    
    productCommissions[pid] = {
      medianPrice: median,
      commission: commission
    };
  } else {
    productCommissions[pid] = {
      medianPrice: 0,
      commission: 0
    };
  }
});

console.log(`\n✅ Product commission mapping created: ${Object.keys(productCommissions).length} products`);

// Step 2: Calculate commissions per affiliate
const affiliateCommissions = {};
let totalOrders = 0;
let totalOrdersWithCommission = 0;
let totalOrdersNoCommission = 0;
let grandTotalCommission = 0;

const ordersByCommissionRate = {
  0: { count: 0, revenue: 0 },
  200000: { count: 0, revenue: 0 },
  250000: { count: 0, revenue: 0 },
  325000: { count: 0, revenue: 0 }
};

sejoli.orders.forEach(order => {
  // Only process completed orders with affiliate
  if (order.status !== 'completed' || order.affiliate_id <= 0) {
    return;
  }
  
  totalOrders++;
  
  const productComm = productCommissions[order.product_id];
  if (!productComm) {
    console.log(`⚠️  Warning: Product ${order.product_id} not found in mapping`);
    return;
  }
  
  const commissionAmount = productComm.commission;
  
  // Track by commission rate
  if (!ordersByCommissionRate[commissionAmount]) {
    ordersByCommissionRate[commissionAmount] = { count: 0, revenue: 0 };
  }
  ordersByCommissionRate[commissionAmount].count++;
  ordersByCommissionRate[commissionAmount].revenue += order.grand_total;
  
  if (commissionAmount > 0) {
    totalOrdersWithCommission++;
    grandTotalCommission += commissionAmount;
    
    // Find affiliate email
    const affiliate = sejoli.affiliates.find(a => a.user_id === order.affiliate_id);
    if (!affiliate) {
      console.log(`⚠️  Warning: Affiliate ID ${order.affiliate_id} not found`);
      return;
    }
    
    if (!affiliateCommissions[affiliate.user_email]) {
      affiliateCommissions[affiliate.user_email] = {
        name: affiliate.display_name,
        totalOrders: 0,
        totalCommission: 0,
        ordersByRate: {
          200000: 0,
          250000: 0,
          325000: 0
        }
      };
    }
    
    affiliateCommissions[affiliate.user_email].totalOrders++;
    affiliateCommissions[affiliate.user_email].totalCommission += commissionAmount;
    if (commissionAmount > 0) {
      affiliateCommissions[affiliate.user_email].ordersByRate[commissionAmount]++;
    }
  } else {
    totalOrdersNoCommission++;
  }
});

console.log('\n📊 STATISTIK ORDER:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Orders Completed with Affiliate: ${totalOrders}`);
console.log(`Orders DAPAT Komisi: ${totalOrdersWithCommission}`);
console.log(`Orders TIDAK DAPAT Komisi (harga < 35K): ${totalOrdersNoCommission}`);

console.log('\n📦 BREAKDOWN BY COMMISSION RATE:');
console.log('═══════════════════════════════════════════════════════════════');
Object.entries(ordersByCommissionRate)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([rate, data]) => {
    const rateNum = parseInt(rate);
    console.log(`\n💰 Komisi Rp ${rateNum.toLocaleString('id-ID')} per sale:`);
    console.log(`   Orders: ${data.count}`);
    console.log(`   Revenue: Rp ${data.revenue.toLocaleString('id-ID')}`);
    console.log(`   Total Commission: Rp ${(rateNum * data.count).toLocaleString('id-ID')}`);
  });

console.log('\n\n👥 TOP 20 AFFILIATES:');
console.log('═══════════════════════════════════════════════════════════════');

const sortedAffiliates = Object.entries(affiliateCommissions)
  .sort((a, b) => b[1].totalCommission - a[1].totalCommission)
  .slice(0, 20);

sortedAffiliates.forEach(([email, data], index) => {
  console.log(`\n${index + 1}. ${email}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Total Orders: ${data.totalOrders}`);
  console.log(`   Breakdown:`);
  console.log(`     - Rp 200K: ${data.ordersByRate[200000]} orders = Rp ${(data.ordersByRate[200000] * 200000).toLocaleString('id-ID')}`);
  console.log(`     - Rp 250K: ${data.ordersByRate[250000]} orders = Rp ${(data.ordersByRate[250000] * 250000).toLocaleString('id-ID')}`);
  console.log(`     - Rp 325K: ${data.ordersByRate[325000]} orders = Rp ${(data.ordersByRate[325000] * 325000).toLocaleString('id-ID')}`);
  console.log(`   💰 Total Commission: Rp ${data.totalCommission.toLocaleString('id-ID')}`);
});

console.log('\n\n💵 GRAND TOTAL:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Affiliates: ${Object.keys(affiliateCommissions).length}`);
console.log(`Total Orders with Commission: ${totalOrdersWithCommission}`);
console.log(`💰 TOTAL COMMISSION: Rp ${grandTotalCommission.toLocaleString('id-ID')}`);

// Save to JSON for distribution script
const distributionData = {
  timestamp: new Date().toISOString(),
  stats: {
    totalAffiliates: Object.keys(affiliateCommissions).length,
    totalOrders: totalOrdersWithCommission,
    totalOrdersNoCommission: totalOrdersNoCommission,
    totalCommission: grandTotalCommission
  },
  commissionBreakdown: ordersByCommissionRate,
  affiliates: Object.entries(affiliateCommissions).map(([email, data]) => ({
    email,
    name: data.name,
    totalOrders: data.totalOrders,
    totalCommission: data.totalCommission,
    breakdown: data.ordersByRate
  }))
};

fs.writeFileSync('commission-distribution-data.json', JSON.stringify(distributionData, null, 2));
console.log('\n✅ Data disimpan ke commission-distribution-data.json');

console.log('\n\n📋 PRODUCT COMMISSION MAP (Sample 20):');
console.log('═══════════════════════════════════════════════════════════════');
Object.entries(productCommissions)
  .sort((a, b) => b[1].commission - a[1].commission)
  .slice(0, 20)
  .forEach(([pid, data]) => {
    console.log(`Product ${pid}: Median Rp ${data.medianPrice.toLocaleString('id-ID')} → Commission Rp ${data.commission.toLocaleString('id-ID')}`);
  });
