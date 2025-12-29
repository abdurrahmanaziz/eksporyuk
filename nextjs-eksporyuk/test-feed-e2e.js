const http = require('http');
const url = require('url');

// Simulate a user session
const userId = 'admin_test_1766965516934';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqUrl = new URL(path, 'http://localhost:3000');
    const reqOptions = {
      hostname: reqUrl.hostname,
      port: reqUrl.port || 3000,
      path: reqUrl.pathname + reqUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testFeedEndToEnd() {
  console.log('🧪 END-TO-END FEED TEST\n');
  
  try {
    console.log(`Test 1: Check if API returns unauthorized without session`);
    const noAuth = await makeRequest('/api/community/feed?filter=all&page=1&limit=5');
    console.log(`  Status: ${noAuth.status}`);
    if (noAuth.status === 401) {
      console.log('  ✓ Correctly returns 401 Unauthorized\n');
    } else {
      console.log(`  ❌ Expected 401, got ${noAuth.status}\n`);
    }

    console.log(`Test 2: Test with mock session (if server allows)\n`);
    // Create a mock JWT token (this won't work without actual session setup)
    const withAuth = await makeRequest('/api/community/feed?filter=all&page=1&limit=5', {
      headers: {
        'Cookie': `next-auth.session-token=fake-token`
      }
    });
    console.log(`  Status: ${withAuth.status}`);
    console.log(`  Response length: ${withAuth.body.length} bytes`);
    
    if (withAuth.status === 200) {
      try {
        const data = JSON.parse(withAuth.body);
        console.log(`  Posts returned: ${data.posts?.length || 0}`);
        if (data.posts && data.posts.length > 0) {
          console.log(`  ✓ Feed API returns posts correctly`);
          console.log(`  First post: "${data.posts[0].content?.substring(0, 50)}..."`);
          console.log(`  Author: ${data.posts[0].author?.name}`);
        }
      } catch (e) {
        console.log(`  Response preview: ${withAuth.body.substring(0, 100)}`);
      }
    } else {
      console.log(`  Response: ${withAuth.body}`);
    }

    console.log('\n✨ Test complete\n');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testFeedEndToEnd();
