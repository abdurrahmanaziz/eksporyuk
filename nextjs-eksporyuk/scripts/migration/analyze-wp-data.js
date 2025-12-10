/**
 * Analyze WordPress Sejoli Data Export
 * Check missing data, affiliate commissions, etc.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

async function main() {
  console.log('Loading data from:', DATA_FILE);
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // 1. TOTAL OMSET
  const allOrders = data.orders || [];
  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const totalOmset = completedOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);

  console.log('\n========================================');
  console.log('=== OMSET ANALYSIS ===');
  console.log('========================================');
  console.log('Total Orders:', allOrders.length);
  console.log('Completed Orders:', completedOrders.length);
  console.log('Cancelled/Pending:', allOrders.length - completedOrders.length);
  console.log('Total Omset (Completed): Rp', totalOmset.toLocaleString('id-ID'));

  // Status breakdown
  const statusCounts = {};
  allOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  console.log('\nOrder Status Breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // 2. FIND ASEP ABDURRAHMAN WAHID
  console.log('\n========================================');
  console.log('=== ASEP ABDURRAHMAN WAHID ===');
  console.log('========================================');
  
  const asepUser = data.users.find(u => 
    u.user_email === 'asep.abdurrahman.w@gmail.com' ||
    (u.display_name && u.display_name.toLowerCase().includes('asep abdurrahman'))
  );

  if (asepUser) {
    console.log('User ID:', asepUser.id);
    console.log('Name:', asepUser.display_name);
    console.log('Email:', asepUser.user_email);
    console.log('Affiliate Code:', asepUser.affiliate_code);
    
    // Find his affiliate profile
    const asepAff = data.affiliates.find(a => a.user_id === asepUser.id);
    console.log('Affiliate Profile:', asepAff ? 'Found' : 'NOT FOUND');
    if (asepAff) {
      console.log('  Code:', asepAff.affiliate_code);
    }
    
    // Find orders where he is affiliate
    const asepOrders = completedOrders.filter(o => o.affiliate_id === asepUser.id);
    const asepSales = asepOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
    console.log('Orders as Affiliate:', asepOrders.length);
    console.log('Total Sales via him: Rp', asepSales.toLocaleString('id-ID'));
    
    // Check commissions for him
    if (data.commissions) {
      const asepComms = data.commissions.filter(c => c.affiliate_id === asepUser.id);
      const asepCommTotal = asepComms.reduce((sum, c) => sum + parseFloat(c.total || c.amount || 0), 0);
      console.log('Commission records:', asepComms.length);
      console.log('Total Commissions: Rp', asepCommTotal.toLocaleString('id-ID'));
    }
  } else {
    console.log('User NOT FOUND in export!');
  }

  // 3. COMMISSIONS DATA
  console.log('\n========================================');
  console.log('=== COMMISSIONS DATA ===');
  console.log('========================================');
  console.log('Total commission records:', data.commissions?.length || 0);
  
  if (data.commissions && data.commissions[0]) {
    console.log('Commission structure:', Object.keys(data.commissions[0]));
    console.log('First commission:', JSON.stringify(data.commissions[0], null, 2));
    
    // Total commissions
    const totalComm = data.commissions.reduce((sum, c) => sum + parseFloat(c.total || c.amount || 0), 0);
    console.log('\nTotal All Commissions: Rp', totalComm.toLocaleString('id-ID'));
  }

  // 4. TOP AFFILIATES by sales (from orders)
  console.log('\n========================================');
  console.log('=== TOP 20 AFFILIATES BY SALES ===');
  console.log('========================================');
  
  const affSales = {};
  completedOrders.forEach(o => {
    if (o.affiliate_id && o.affiliate_id > 0) {
      if (!affSales[o.affiliate_id]) {
        affSales[o.affiliate_id] = { total: 0, count: 0 };
      }
      affSales[o.affiliate_id].total += parseFloat(o.grand_total || 0);
      affSales[o.affiliate_id].count++;
    }
  });
  
  const topAff = Object.entries(affSales)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20);
  
  topAff.forEach(([affId, stats], i) => {
    const user = data.users.find(u => u.id == affId);
    console.log(`${(i+1).toString().padStart(2)}. ${(user?.display_name || 'Unknown').padEnd(30)} - Rp ${stats.total.toLocaleString('id-ID').padStart(15)} (${stats.count} sales)`);
  });

  // 5. AFFILIATES WITH COMMISSIONS
  console.log('\n========================================');
  console.log('=== AFFILIATES WITH COMMISSIONS ===');
  console.log('========================================');
  
  if (data.commissions) {
    const affWithComm = new Set();
    data.commissions.forEach(c => affWithComm.add(c.affiliate_id));
    console.log('Unique affiliates with commission records:', affWithComm.size);
    
    // All affiliates in system
    console.log('Total affiliates in system:', data.affiliates?.length || 0);
    
    // Orders with affiliate
    const ordersWithAff = completedOrders.filter(o => o.affiliate_id && o.affiliate_id > 0);
    console.log('Completed orders WITH affiliate:', ordersWithAff.length);
    console.log('Completed orders WITHOUT affiliate:', completedOrders.length - ordersWithAff.length);
  }

  // 6. PRODUCT ANALYSIS (from orders)
  console.log('\n========================================');
  console.log('=== PRODUCT ANALYSIS ===');
  console.log('========================================');
  
  const productSales = {};
  completedOrders.forEach(o => {
    if (!productSales[o.product_id]) {
      productSales[o.product_id] = { total: 0, count: 0 };
    }
    productSales[o.product_id].total += parseFloat(o.grand_total || 0);
    productSales[o.product_id].count++;
  });
  
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15);
  
  console.log('Top 15 Products by Sales:');
  topProducts.forEach(([prodId, stats], i) => {
    console.log(`${(i+1).toString().padStart(2)}. Product #${prodId.padEnd(5)} - Rp ${stats.total.toLocaleString('id-ID').padStart(15)} (${stats.count} orders)`);
  });

  // 7. STATS from export
  console.log('\n========================================');
  console.log('=== STATS FROM EXPORT ===');
  console.log('========================================');
  if (data.stats) {
    console.log(JSON.stringify(data.stats, null, 2));
  }

  // 8. CHECK MISSING DATA
  console.log('\n========================================');
  console.log('=== DATA COMPLETENESS CHECK ===');
  console.log('========================================');
  
  // Users without email
  const usersNoEmail = data.users.filter(u => !u.user_email);
  console.log('Users without email:', usersNoEmail.length);
  
  // Orders without user_id
  const ordersNoUser = allOrders.filter(o => !o.user_id);
  console.log('Orders without user_id:', ordersNoUser.length);
  
  // Affiliates without user match
  let affNoUser = 0;
  data.affiliates?.forEach(a => {
    const user = data.users.find(u => u.id === a.user_id);
    if (!user) affNoUser++;
  });
  console.log('Affiliates without matching user:', affNoUser);

  console.log('\n========================================');
  console.log('Export Date:', data.exportDate);
  console.log('========================================');
}

main().catch(console.error);
