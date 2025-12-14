const fs = require('fs');

console.log('🔍 INVESTIGASI: SIAPA AZIZBIASA@GMAIL.COM?');
console.log('═══════════════════════════════════════════════════════════════');

const sejoli = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));

// Find azizbiasa in users
const azizUser = sejoli.users.find(u => u.user_email === 'azizbiasa@gmail.com');
console.log('\n📧 User azizbiasa@gmail.com:');
console.log(JSON.stringify(azizUser, null, 2));

// Find in affiliates
const azizAffiliate = sejoli.affiliates.find(a => a.user_email === 'azizbiasa@gmail.com');
console.log('\n👥 Affiliate azizbiasa@gmail.com:');
console.log(JSON.stringify(azizAffiliate, null, 2));

// Check orders where aziz is the affiliate_id
const ordersWithAzizAsAffiliate = sejoli.orders.filter(o => o.affiliate_id === azizUser?.id);
console.log(`\n📦 Orders where aziz (user_id: ${azizUser?.id}) is affiliate: ${ordersWithAzizAsAffiliate.length}`);

// Check what affiliate_ids are used for aziz's referrals
console.log('\n🔍 Sample orders with aziz as affiliate:');
ordersWithAzizAsAffiliate.slice(0, 5).forEach(o => {
  console.log(`  Order ${o.id}: buyer=${o.user_id}, affiliate_id=${o.affiliate_id}, amount=${o.grand_total}, status=${o.status}`);
});

// Now let's check who is ACTUALLY the top affiliates
// Check orders by affiliate_id frequency
const affiliateIdCounts = {};
sejoli.orders
  .filter(o => o.status === 'completed' && o.affiliate_id > 0)
  .forEach(o => {
    if (!affiliateIdCounts[o.affiliate_id]) {
      affiliateIdCounts[o.affiliate_id] = 0;
    }
    affiliateIdCounts[o.affiliate_id]++;
  });

const sortedAffiliateIds = Object.entries(affiliateIdCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('\n\n📊 TOP 20 AFFILIATE_IDs BY ORDER COUNT:');
console.log('═══════════════════════════════════════════════════════════════');

const userMap = new Map();
sejoli.users.forEach(u => userMap.set(u.id, u));

sortedAffiliateIds.forEach(([affiliateId, count], i) => {
  const user = userMap.get(parseInt(affiliateId));
  console.log(`${i+1}. affiliate_id: ${affiliateId} (${count} orders)`);
  console.log(`   User: ${user?.display_name || 'NOT FOUND'} - ${user?.user_email || 'N/A'}`);
});

// Check if affiliate_id 1 is special (owner/admin)
console.log('\n\n🔍 CHECKING affiliate_id = 1:');
const user1 = userMap.get(1);
console.log('User ID 1:', JSON.stringify(user1, null, 2));

const ordersWithAff1 = sejoli.orders.filter(o => o.affiliate_id === 1 && o.status === 'completed');
console.log(`Orders with affiliate_id=1: ${ordersWithAff1.length}`);

// Let's check Rahmat Al Fianto - should be #1 per screenshot
console.log('\n\n🔍 CHECKING RAHMAT AL FIANTO:');
const rahmat = sejoli.users.find(u => u.display_name?.toLowerCase().includes('rahmat') && u.display_name?.toLowerCase().includes('fianto'));
console.log('Rahmat user:', JSON.stringify(rahmat, null, 2));

if (rahmat) {
  const rahmatOrders = sejoli.orders.filter(o => o.affiliate_id === rahmat.id && o.status === 'completed');
  console.log(`Orders with Rahmat as affiliate: ${rahmatOrders.length}`);
  
  // Calculate his commission
  const productCommissions = {
    18528: 20000, 20130: 20000, 19042: 20000, 21476: 20000,
    488: 200000,
    3764: 200000, 8686: 200000, 13039: 200000, 5932: 200000, 16587: 200000,
    179: 250000, 8914: 250000, 6068: 250000, 13400: 250000, 8684: 250000, 
    11207: 250000, 15234: 250000, 20852: 250000, 4684: 250000,
    16956: 250000, 6810: 250000, 19296: 250000, 13045: 250000,
    3840: 325000, 13401: 325000, 8915: 325000, 8683: 325000, 13399: 325000,
    17920: 325000, 20336: 325000, 5935: 325000, 8910: 325000,
    16963: 0, 17322: 0, 16130: 0, 17767: 0, 18358: 0, 16826: 0
  };
  
  let rahmatCommission = 0;
  rahmatOrders.forEach(o => {
    const comm = productCommissions[o.product_id] || 0;
    rahmatCommission += comm;
  });
  console.log(`Rahmat's calculated commission: Rp ${rahmatCommission.toLocaleString('id-ID')}`);
  console.log(`Screenshot shows: Rp 169,955,000`);
}
