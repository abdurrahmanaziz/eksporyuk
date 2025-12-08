const http = require('http');

const url = 'http://localhost:3000/go/3BEC0Z/checkout';

const options = new URL(url);
options.method = 'GET';

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Location Header: ${res.headers.location}`);
  console.log('\nFull Headers:');
  console.log(JSON.stringify(res.headers, null, 2));
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
