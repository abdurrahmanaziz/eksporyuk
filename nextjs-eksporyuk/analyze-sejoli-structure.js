/**
 * ANALYZE SEJOLI DATA STRUCTURE
 * Find the correct affiliate data
 */

const fs = require('fs');
const path = require('path');

async function analyzeSejoli() {
  console.log('\n=== ANALYZE SEJOLI DATA ===\n');
  
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const raw = fs.readFileSync(sejoliPath, 'utf-8');
  const data = JSON.parse(raw);
  
  console.log('Keys in Sejoli data:', Object.keys(data));
  console.log('');
  
  // Check affiliates structure
  console.log('--- AFFILIATES ---');
  console.log('Total affiliates:', data.affiliates?.length || 0);
  if (data.affiliates?.[0]) {
    console.log('Sample affiliate keys:', Object.keys(data.affiliates[0]));
    console.log('Sample affiliate:', JSON.stringify(data.affiliates[0], null, 2));
  }
  
  // Check users structure  
  console.log('\n--- USERS ---');
  console.log('Total users:', data.users?.length || 0);
  if (data.users?.[0]) {
    console.log('Sample user keys:', Object.keys(data.users[0]));
  }
  
  // Check orders structure
  console.log('\n--- ORDERS ---');
  console.log('Total orders:', data.orders?.length || 0);
  if (data.orders?.[0]) {
    console.log('Sample order keys:', Object.keys(data.orders[0]));
    
    // Find orders with affiliate_id
    const ordersWithAffiliate = data.orders.filter(o => o.affiliate_id && o.affiliate_id !== '0' && o.affiliate_id !== 0);
    console.log('Orders with affiliate_id:', ordersWithAffiliate.length);
    
    // Sample order with affiliate
    const sampleWithAff = ordersWithAffiliate[0];
    if (sampleWithAff) {
      console.log('\nSample order with affiliate:');
      console.log('  Order ID:', sampleWithAff.ID);
      console.log('  affiliate_id:', sampleWithAff.affiliate_id);
      console.log('  user_id:', sampleWithAff.user_id);
      console.log('  grand_total:', sampleWithAff.grand_total);
    }
    
    // Get unique affiliate_ids from orders
    const uniqueAffIds = new Set(ordersWithAffiliate.map(o => String(o.affiliate_id)));
    console.log('\nUnique affiliate_ids in orders:', uniqueAffIds.size);
    console.log('Sample IDs:', [...uniqueAffIds].slice(0, 10));
  }
  
  // Look for affiliate_id 53 in users
  console.log('\n--- SEARCHING FOR AFFILIATE ID 53 ---');
  const user53 = data.users?.find(u => u.ID === 53 || u.ID === '53');
  if (user53) {
    console.log('Found user with ID 53:');
    console.log('  ID:', user53.ID);
    console.log('  display_name:', user53.display_name);
    console.log('  user_email:', user53.user_email);
    console.log('  user_login:', user53.user_login);
  }
  
  // Check if affiliate_id matches user ID
  console.log('\n--- MAPPING AFFILIATE_ID TO USERS ---');
  const userById = new Map();
  data.users?.forEach(u => userById.set(String(u.ID), u));
  
  // Top 10 affiliate IDs
  const affIdCount = new Map();
  data.orders?.forEach(o => {
    if (o.affiliate_id && o.affiliate_id !== '0' && o.affiliate_id !== 0 && o.status === 'completed') {
      const id = String(o.affiliate_id);
      affIdCount.set(id, (affIdCount.get(id) || 0) + 1);
    }
  });
  
  const sorted = [...affIdCount.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nTop 10 affiliates (by order count):');
  
  for (const [affId, count] of sorted.slice(0, 10)) {
    const user = userById.get(affId);
    console.log(`\nAffiliate ID ${affId}: ${count} orders`);
    if (user) {
      console.log(`  User: ${user.display_name} (${user.user_email})`);
    } else {
      console.log(`  User: NOT FOUND in users array`);
    }
  }
}

analyzeSejoli();
