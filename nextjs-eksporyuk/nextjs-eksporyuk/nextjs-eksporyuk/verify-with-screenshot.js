const fs = require('fs');

console.log('🔍 CEK ULANG DATA SEJOLI - VERIFIKASI DENGAN SCREENSHOT');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Create user lookup map (user_id -> user data)
const userMap = new Map();
for (const user of sejoli.users) {
  userMap.set(user.id, user);
}

// Create affiliate lookup map (user_id -> affiliate data)
const affiliateMap = new Map();
for (const aff of sejoli.affiliates) {
  affiliateMap.set(aff.user_id, aff);
}

console.log(`\n📊 Data Sejoli:`);
console.log(`  Users: ${sejoli.users.length}`);
console.log(`  Orders: ${sejoli.orders.length}`);
console.log(`  Affiliates: ${sejoli.affiliates.length}`);

// Check sample orders with affiliate
console.log('\n\n🔍 SAMPLE ORDERS WITH AFFILIATE (First 10):');
console.log('═══════════════════════════════════════════════════════════════');

const ordersWithAffiliate = sejoli.orders.filter(o => o.affiliate_id > 0 && o.status === 'completed');
console.log(`\nTotal completed orders with affiliate: ${ordersWithAffiliate.length}`);

ordersWithAffiliate.slice(0, 10).forEach((order, i) => {
  const buyer = userMap.get(order.user_id);
  const affiliate = affiliateMap.get(order.affiliate_id);
  const affiliateUser = userMap.get(order.affiliate_id);
  
  console.log(`\n${i+1}. Order ID: ${order.id}`);
  console.log(`   Buyer user_id: ${order.user_id} -> ${buyer?.user_email || 'NOT FOUND'}`);
  console.log(`   Affiliate_id: ${order.affiliate_id}`);
  console.log(`   Affiliate from affiliates array: ${affiliate?.user_email || 'NOT IN AFFILIATES'}`);
  console.log(`   Affiliate from users array: ${affiliateUser?.user_email || 'NOT IN USERS'}`);
  console.log(`   Amount: Rp ${order.grand_total.toLocaleString('id-ID')}`);
  console.log(`   Product ID: ${order.product_id}`);
});

// Now let's calculate commissions correctly
// affiliate_id in order refers to the AFFILIATE's user_id (who referred the sale)
console.log('\n\n💰 KALKULASI KOMISI YANG BENAR:');
console.log('═══════════════════════════════════════════════════════════════');

// Product commission map (from previous analysis)
const productCommissions = {
  // Rp 35K products -> 20K commission
  18528: 20000, 20130: 20000, 19042: 20000, 21476: 20000,
  // Rp 249K products -> 200K commission  
  488: 200000,
  // Rp 300-399K products -> 200K commission
  3764: 200000, 8686: 200000, 13039: 200000, 5932: 200000, 16587: 200000,
  // Rp 649-699K products -> 250K commission
  179: 250000, 8914: 250000, 6068: 250000, 13400: 250000, 8684: 250000, 
  11207: 250000, 15234: 250000, 20852: 250000, 4684: 250000,
  // Rp 749-799K products -> 250K commission
  16956: 250000, 6810: 250000, 19296: 250000, 13045: 250000,
  // Rp 899K+ products -> 325K commission
  3840: 325000, 13401: 325000, 8915: 325000, 8683: 325000, 13399: 325000,
  17920: 325000, 20336: 325000, 5935: 325000, 8910: 325000,
  // Products with 0 grand_total - NO COMMISSION
  16963: 0, 17322: 0, 16130: 0, 17767: 0, 18358: 0, 16826: 0
};

const affiliateCommissions = new Map();
let totalCommission = 0;
let ordersWithCommission = 0;
let ordersNoCommission = 0;
let ordersUnknownProduct = 0;

ordersWithAffiliate.forEach(order => {
  // Get affiliate info - affiliate_id is the user_id of the affiliate
  const affiliateInfo = affiliateMap.get(order.affiliate_id);
  const affiliateUser = userMap.get(order.affiliate_id);
  
  // Get email - prefer from affiliates array, fallback to users array
  const affiliateEmail = affiliateInfo?.user_email || affiliateUser?.user_email;
  const affiliateName = affiliateInfo?.display_name || affiliateUser?.display_name;
  
  if (!affiliateEmail) {
    // Skip if no affiliate email found
    return;
  }
  
  // Get commission from product
  const commission = productCommissions[order.product_id];
  
  if (commission === undefined) {
    ordersUnknownProduct++;
    return;
  }
  
  if (commission === 0) {
    ordersNoCommission++;
    return;
  }
  
  ordersWithCommission++;
  totalCommission += commission;
  
  // Track by affiliate
  if (!affiliateCommissions.has(affiliateEmail)) {
    affiliateCommissions.set(affiliateEmail, {
      email: affiliateEmail,
      name: affiliateName,
      userId: order.affiliate_id,
      totalOrders: 0,
      totalCommission: 0,
      totalRevenue: 0
    });
  }
  
  const aff = affiliateCommissions.get(affiliateEmail);
  aff.totalOrders++;
  aff.totalCommission += commission;
  aff.totalRevenue += order.grand_total;
});

console.log(`\n📊 STATISTIK:`);
console.log(`  Total completed affiliate orders: ${ordersWithAffiliate.length}`);
console.log(`  Orders dengan komisi: ${ordersWithCommission}`);
console.log(`  Orders tanpa komisi (produk gratis): ${ordersNoCommission}`);
console.log(`  Orders produk unknown: ${ordersUnknownProduct}`);
console.log(`  💰 TOTAL KOMISI: Rp ${totalCommission.toLocaleString('id-ID')}`);

// Sort by commission
const sortedAffiliates = Array.from(affiliateCommissions.values())
  .sort((a, b) => b.totalCommission - a.totalCommission);

console.log(`\n\n👥 TOP 10 AFFILIATES (VERIFIKASI DENGAN SCREENSHOT):`);
console.log('═══════════════════════════════════════════════════════════════');

console.log('\n📋 Perbandingan dengan Screenshot:');
console.log('─────────────────────────────────────────────────────────────');

const expectedTop10 = [
  { name: 'Rahmat Al Fianto', commission: 169955000 },
  { name: 'Asep Abdurrahman Wahid', commission: 165150000 },
  { name: 'Sutisna', commission: 132825000 },
  { name: 'Hamid Baidowi', commission: 131110000 },
  { name: 'Yoga Andrian', commission: 93085000 },
  { name: 'NgobrolinEkspor', commission: 83957000 },
  { name: 'eko wibowo', commission: 65777000 },
  { name: 'PintarEkspor', commission: 53909000 },
  { name: 'Muhamad safrizal', commission: 43800000 },
  { name: 'Brian', commission: 36500000 }
];

sortedAffiliates.slice(0, 15).forEach((aff, i) => {
  const expected = expectedTop10[i];
  const match = expected && (
    aff.name?.toLowerCase().includes(expected.name.toLowerCase().split(' ')[0]) ||
    expected.name.toLowerCase().includes(aff.name?.toLowerCase().split(' ')[0] || '')
  );
  
  console.log(`\n${i+1}. ${aff.name || aff.email}`);
  console.log(`   Email: ${aff.email}`);
  console.log(`   Total Orders: ${aff.totalOrders}`);
  console.log(`   Omset: Rp ${aff.totalRevenue.toLocaleString('id-ID')}`);
  console.log(`   💰 Komisi: Rp ${aff.totalCommission.toLocaleString('id-ID')}`);
  
  if (expected) {
    console.log(`   📊 Screenshot: ${expected.name} = Rp ${expected.commission.toLocaleString('id-ID')}`);
    const diff = aff.totalCommission - expected.commission;
    console.log(`   ${match ? '✅' : '❌'} Selisih: Rp ${diff.toLocaleString('id-ID')}`);
  }
});

// Calculate grand totals
const totalOmsetKotor = ordersWithAffiliate.reduce((sum, o) => sum + o.grand_total, 0);
const totalOmsetBersih = ordersWithAffiliate
  .filter(o => productCommissions[o.product_id] > 0)
  .reduce((sum, o) => sum + o.grand_total, 0);

console.log('\n\n💵 GRAND TOTAL:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total Affiliates: ${affiliateCommissions.size}`);
console.log(`Total Orders with Commission: ${ordersWithCommission}`);
console.log(`Omset Kotor (semua affiliate orders): Rp ${totalOmsetKotor.toLocaleString('id-ID')}`);
console.log(`Omset Bersih (orders dengan komisi): Rp ${totalOmsetBersih.toLocaleString('id-ID')}`);
console.log(`💰 TOTAL KOMISI: Rp ${totalCommission.toLocaleString('id-ID')}`);

// Sum from screenshot for comparison
const screenshotTotal = expectedTop10.reduce((sum, e) => sum + e.commission, 0);
console.log(`\n📊 Total komisi TOP 10 di screenshot: Rp ${screenshotTotal.toLocaleString('id-ID')}`);
const myTop10Total = sortedAffiliates.slice(0, 10).reduce((sum, a) => sum + a.totalCommission, 0);
console.log(`📊 Total komisi TOP 10 hasil kalkulasi: Rp ${myTop10Total.toLocaleString('id-ID')}`);
