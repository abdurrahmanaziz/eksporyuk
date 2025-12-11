// Keep database alive - prevent Neon auto-suspend
const https = require('https');

const PING_URL = 'https://app.eksporyuk.com/api/auth/providers';
const INTERVAL = 5 * 60 * 1000; // 5 minutes

function ping() {
  const start = Date.now();
  https.get(PING_URL, (res) => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Ping OK - ${duration}ms (Status: ${res.statusCode})`);
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Ping failed:`, err.message);
  });
}

console.log(`Starting keep-alive ping every ${INTERVAL/1000}s...`);
ping(); // Initial ping
setInterval(ping, INTERVAL);
