/**
 * Test Helper: Manually trigger cron jobs for testing
 * 
 * Usage:
 *   node test-cron.cjs check-expiring
 *   node test-cron.cjs expire
 *   node test-cron.cjs both
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

// Helper function to make HTTP request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test check-expiring-memberships
async function testCheckExpiring() {
  console.log('\n🔍 Testing: Check Expiring Memberships');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/cron/check-expiring-memberships');
    
    console.log('✅ Status:', result.status);
    console.log('📊 Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('\n✅ SUCCESS');
      console.log(`   Total: ${result.data.results.total}`);
      console.log(`   Success: ${result.data.results.success}`);
      console.log(`   Failed: ${result.data.results.failed}`);
      
      if (result.data.results.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        result.data.results.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.log('\n❌ FAILED:', result.data.error);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Test expire-memberships
async function testExpire() {
  console.log('\n🔍 Testing: Auto-Expire Memberships');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/cron/expire-memberships');
    
    console.log('✅ Status:', result.status);
    console.log('📊 Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('\n✅ SUCCESS');
      console.log(`   Total: ${result.data.results.total}`);
      console.log(`   Success: ${result.data.results.success}`);
      console.log(`   Failed: ${result.data.results.failed}`);
      
      if (result.data.details && result.data.details.length > 0) {
        console.log('\n📋 Details:');
        result.data.details.forEach(detail => {
          if (detail.status === 'success') {
            console.log(`   ✅ ${detail.userEmail}`);
            console.log(`      Groups removed: ${detail.groupsRemoved}`);
            console.log(`      Courses removed: ${detail.coursesRemoved}`);
          } else {
            console.log(`   ❌ ${detail.userEmail}: ${detail.error}`);
          }
        });
      }
      
      if (result.data.results.errors && result.data.results.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        result.data.results.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.log('\n❌ FAILED:', result.data.error);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  console.log('\n🚀 Cron Job Test Helper');
  console.log('═'.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cron Secret: ${CRON_SECRET.substring(0, 10)}...`);
  console.log('═'.repeat(60));

  if (!command || command === 'help') {
    console.log('\nUsage:');
    console.log('  node test-cron.cjs check-expiring  - Test expiry warnings');
    console.log('  node test-cron.cjs expire          - Test auto-expire');
    console.log('  node test-cron.cjs both            - Test both jobs');
    console.log('\nEnvironment Variables:');
    console.log('  TEST_URL      - Base URL (default: http://localhost:3000)');
    console.log('  CRON_SECRET   - Cron secret key');
    console.log('\nExamples:');
    console.log('  node test-cron.cjs check-expiring');
    console.log('  TEST_URL=https://yoursite.com node test-cron.cjs expire');
    return;
  }

  try {
    if (command === 'check-expiring') {
      await testCheckExpiring();
    } else if (command === 'expire') {
      await testExpire();
    } else if (command === 'both') {
      await testCheckExpiring();
      await testExpire();
    } else {
      console.error(`\n❌ Unknown command: ${command}`);
      console.log('Run "node test-cron.cjs help" for usage');
      process.exit(1);
    }
    
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
