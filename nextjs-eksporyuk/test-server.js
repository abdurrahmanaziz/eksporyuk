const http = require('http');

console.log('🔍 Testing server endpoints...');

const testEndpoints = [
  '/api/admin/integrations',
  '/api/health',
  '/'
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    console.log(`Testing ${path}...`);
    
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      timeout: 5000
    }, (res) => {
      console.log(`✅ ${path} - Status: ${res.statusCode}`);
      resolve({ path, status: res.statusCode, success: true });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${path} - Error: ${err.message}`);
      resolve({ path, status: null, success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      console.log(`⏰ ${path} - Timeout`);
      req.destroy();
      resolve({ path, status: null, success: false, error: 'timeout' });
    });
  });
}

async function runTests() {
  console.log('Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const results = [];
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n📊 Test Results:');
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.path}: ${r.status}`);
    } else {
      console.log(`❌ ${r.path}: ${r.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 ${successCount}/${results.length} endpoints working`);
  
  if (successCount === results.length) {
    console.log('🎉 All systems operational!');
  } else {
    console.log('⚠️  Some issues detected');
  }
}

runTests().catch(console.error);