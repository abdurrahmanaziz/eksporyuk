const fs = require('fs');

console.log('📊 KALKULASI KOMISI AFFILIATE - 17 Desember 2025\n');

// Load data
const salesData = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const productsData = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));

// Build product commission map
const productCommissionMap = {};
productsData.forEach(p => {
  let commission = 0;
  if (p.affiliate && p.affiliate['1']) {
    const affData = p.affiliate['1'];
    if (affData.type === 'fixed') {
      commission = parseInt(affData.fee) || 0;
    } else if (affData.type === 'percentage') {
      commission = (parseInt(affData.fee) / 100) * p.price;
    }
  }
  productCommissionMap[p.id] = {
    title: p.title,
    price: p.price,
    commission: commission
  };
});

// Calculate affiliate commissions from completed orders
const affiliateStats = {};
let totalKomisi = 0;
let ordersWithAffiliate = 0;
let ordersWithoutAffiliate = 0;

const completedOrders = salesData.orders.filter(o => o.status === 'completed');

completedOrders.forEach(order => {
  const productId = order.product_id;
  const productInfo = productCommissionMap[productId];
  
  // Check if order has affiliate
  if (order.affiliate_id && order.affiliate_id > 0) {
    ordersWithAffiliate++;
    
    const affId = order.affiliate_id;
    const affName = order.affiliate_name || `Affiliate #${affId}`;
    
    // Get commission from product
    let commission = productInfo ? productInfo.commission : 0;
    
    // But also check if order has affiliate_fee (actual commission recorded)
    if (order.affiliate_fee && parseInt(order.affiliate_fee) > 0) {
      commission = parseInt(order.affiliate_fee);
    }
    
    if (!affiliateStats[affId]) {
      affiliateStats[affId] = {
        id: affId,
        name: affName,
        totalSales: 0,
        totalOmset: 0,
        totalKomisi: 0,
        orders: []
      };
    }
    
    affiliateStats[affId].totalSales++;
    affiliateStats[affId].totalOmset += parseInt(order.grand_total) || 0;
    affiliateStats[affId].totalKomisi += commission;
    affiliateStats[affId].orders.push({
      orderId: order.ID,
      productId: productId,
      grandTotal: order.grand_total,
      commission: commission
    });
    
    totalKomisi += commission;
  } else {
    ordersWithoutAffiliate++;
  }
});

// Sort affiliates by total komisi
const sortedAffiliates = Object.values(affiliateStats)
  .sort((a, b) => b.totalKomisi - a.totalKomisi);

console.log('====================================================================');
console.log('  📈 RINGKASAN KOMISI AFFILIATE');
console.log('====================================================================\n');

console.log(`  Total Completed Orders: ${completedOrders.length.toLocaleString()}`);
console.log(`  Orders dengan Affiliate: ${ordersWithAffiliate.toLocaleString()}`);
console.log(`  Orders tanpa Affiliate: ${ordersWithoutAffiliate.toLocaleString()}`);
console.log(`  Persentase via Affiliate: ${((ordersWithAffiliate / completedOrders.length) * 100).toFixed(1)}%`);
console.log(`\n  💰 TOTAL KOMISI AFFILIATE: Rp ${totalKomisi.toLocaleString()}`);

console.log('\n====================================================================');
console.log('  🏆 TOP 20 AFFILIATE BERDASARKAN KOMISI');
console.log('====================================================================\n');

sortedAffiliates.slice(0, 20).forEach((aff, idx) => {
  console.log(`  ${(idx + 1).toString().padStart(2)}. ${aff.name.substring(0, 30).padEnd(30)} | Sales: ${aff.totalSales.toString().padStart(4)} | Komisi: Rp ${aff.totalKomisi.toLocaleString().padStart(15)}`);
});

console.log('\n====================================================================');
console.log('  📊 PERBANDINGAN DENGAN DASHBOARD');
console.log('====================================================================\n');

const dashboardKomisi = 1248871000;
console.log(`  Dashboard Total Komisi: Rp ${dashboardKomisi.toLocaleString()}`);
console.log(`  Calculated Total Komisi: Rp ${totalKomisi.toLocaleString()}`);
console.log(`  Selisih: Rp ${(dashboardKomisi - totalKomisi).toLocaleString()}`);

// Check if there's affiliate_fee in orders
console.log('\n====================================================================');
console.log('  🔍 ANALISIS FIELD AFFILIATE_FEE DI ORDERS');
console.log('====================================================================\n');

let ordersWithFee = 0;
let totalFromFeeField = 0;
completedOrders.forEach(order => {
  if (order.affiliate_fee && parseInt(order.affiliate_fee) > 0) {
    ordersWithFee++;
    totalFromFeeField += parseInt(order.affiliate_fee);
  }
});

console.log(`  Orders dengan affiliate_fee > 0: ${ordersWithFee.toLocaleString()}`);
console.log(`  Total dari affiliate_fee field: Rp ${totalFromFeeField.toLocaleString()}`);

// Save affiliate data for import
const exportData = {
  summary: {
    totalCompletedOrders: completedOrders.length,
    ordersWithAffiliate: ordersWithAffiliate,
    ordersWithoutAffiliate: ordersWithoutAffiliate,
    totalKomisi: totalKomisi,
    dashboardKomisi: dashboardKomisi,
    totalFromFeeField: totalFromFeeField,
    generatedAt: new Date().toISOString()
  },
  affiliates: sortedAffiliates,
  topAffiliates: sortedAffiliates.slice(0, 50)
};

fs.writeFileSync('affiliate-commissions-calculated.json', JSON.stringify(exportData, null, 2));
console.log('\n✅ Data komisi affiliate disimpan ke: affiliate-commissions-calculated.json');

// Also save order detail for each affiliate (for verification)
const affiliateOrderDetails = {};
sortedAffiliates.slice(0, 10).forEach(aff => {
  affiliateOrderDetails[aff.id] = {
    name: aff.name,
    totalKomisi: aff.totalKomisi,
    totalSales: aff.totalSales,
    sampleOrders: aff.orders.slice(0, 5)
  };
});

fs.writeFileSync('top-affiliate-order-samples.json', JSON.stringify(affiliateOrderDetails, null, 2));
console.log('✅ Sample orders top affiliate disimpan ke: top-affiliate-order-samples.json');
