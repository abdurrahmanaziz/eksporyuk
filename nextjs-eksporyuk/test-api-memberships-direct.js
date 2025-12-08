// Direct API test - bypassing Next.js server
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing API endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/memberships/packages?includeInactive=true');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.packages && data.packages.length > 0) {
      console.log(`\n✅ Found ${data.packages.length} packages`);
      data.packages.forEach((pkg, i) => {
        console.log(`\n${i + 1}. ${pkg.name}`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Slug: ${pkg.slug || 'null'}`);
        console.log(`   Price: Rp ${pkg.price.toLocaleString()}`);
        console.log(`   Duration: ${pkg.duration}`);
      });
    } else {
      console.log('\n❌ No packages found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
