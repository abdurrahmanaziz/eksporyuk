/**
 * FIX: affiliate_id in orders = user_id in affiliates array
 */

const fs = require('fs');
const path = require('path');

async function checkAffiliateMapping() {
  console.log('\n=== CHECK AFFILIATE MAPPING ===\n');
  
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const raw = fs.readFileSync(sejoliPath, 'utf-8');
  const data = JSON.parse(raw);
  
  // affiliate_id in orders should match user_id in affiliates
  const affiliateByUserId = new Map();
  data.affiliates?.forEach(a => {
    affiliateByUserId.set(String(a.user_id), a);
  });
  
  console.log('Affiliates indexed by user_id:', affiliateByUserId.size);
  
  // Check if affiliate_id 53 exists in affiliates by user_id
  const aff53 = affiliateByUserId.get('53');
  console.log('\nAffiliate with user_id=53:', aff53);
  
  // Get unique affiliate_ids from completed orders
  const ordersWithAff = data.orders.filter(o => 
    o.affiliate_id && 
    o.affiliate_id !== '0' && 
    o.affiliate_id !== 0 &&
    o.status === 'completed'
  );
  
  const uniqueAffIds = new Set(ordersWithAff.map(o => String(o.affiliate_id)));
  console.log('\nUnique affiliate_ids in completed orders:', uniqueAffIds.size);
  
  // Check how many match
  let matched = 0;
  let notMatched = 0;
  const notMatchedSamples = [];
  
  for (const affId of uniqueAffIds) {
    if (affiliateByUserId.has(affId)) {
      matched++;
    } else {
      notMatched++;
      if (notMatchedSamples.length < 5) {
        notMatchedSamples.push(affId);
      }
    }
  }
  
  console.log('Matched (affiliate_id found in affiliates.user_id):', matched);
  console.log('Not matched:', notMatched);
  if (notMatchedSamples.length > 0) {
    console.log('Sample not matched:', notMatchedSamples);
  }
  
  // Show top 10 affiliates with their info
  console.log('\n--- TOP 10 AFFILIATES (by completed order count) ---\n');
  
  const countByAffId = new Map();
  ordersWithAff.forEach(o => {
    const id = String(o.affiliate_id);
    countByAffId.set(id, (countByAffId.get(id) || 0) + 1);
  });
  
  const sorted = [...countByAffId.entries()].sort((a, b) => b[1] - a[1]);
  
  for (const [affId, count] of sorted.slice(0, 10)) {
    const affiliate = affiliateByUserId.get(affId);
    console.log('Affiliate ID (user_id):', affId);
    console.log('  Orders:', count);
    if (affiliate) {
      console.log('  Name:', affiliate.display_name);
      console.log('  Email:', affiliate.user_email);
      console.log('  Affiliate Code:', affiliate.affiliate_code);
    } else {
      console.log('  NOT FOUND in affiliates array');
    }
    console.log('');
  }
  
  // Calculate total commission from commissions array
  console.log('\n--- COMMISSIONS DATA ---');
  console.log('Total commissions records:', data.commissions?.length || 0);
  if (data.commissions?.[0]) {
    console.log('Sample commission keys:', Object.keys(data.commissions[0]));
    console.log('Sample:', JSON.stringify(data.commissions[0], null, 2));
  }
}

checkAffiliateMapping();
