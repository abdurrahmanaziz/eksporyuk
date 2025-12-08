const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/membership-plans',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Membership plans page loaded successfully!');
      console.log(`Page size: ${data.length} bytes`);
    } else {
      console.log('❌ Failed to load page');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
