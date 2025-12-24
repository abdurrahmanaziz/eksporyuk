/**
 * Test Sejoli Database Connection
 * Tests multiple connection methods to find working one
 */

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.sejoli') });

async function testDirectConnection() {
  console.log('1️⃣ Testing Direct Connection...');
  console.log('   Host: 103.125.181.47:3306\n');

  try {
    const connection = await mysql.createConnection({
      host: '103.125.181.47',
      port: 3306,
      user: process.env.SEJOLI_DB_USER,
      password: process.env.SEJOLI_DB_PASSWORD,
      database: process.env.SEJOLI_DB_NAME,
      connectTimeout: 10000,
    });

    const [result] = await connection.query('SELECT DATABASE() as db');
    console.log('   ✅ Direct connection SUCCESS!');
    console.log(`   Connected to: ${result[0].db}\n`);
    
    await connection.end();
    return 'direct';

  } catch (error) {
    console.log(`   ❌ Direct connection FAILED`);
    console.log(`   Error: ${error.message}\n`);
    return null;
  }
}

async function testTunnelConnection() {
  console.log('2️⃣ Testing SSH Tunnel Connection...');
  console.log('   Host: 127.0.0.1:13306 (via tunnel)\n');

  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 13306,
      user: process.env.SEJOLI_DB_USER,
      password: process.env.SEJOLI_DB_PASSWORD,
      database: process.env.SEJOLI_DB_NAME,
      connectTimeout: 5000,
    });

    const [result] = await connection.query('SELECT DATABASE() as db');
    console.log('   ✅ Tunnel connection SUCCESS!');
    console.log(`   Connected to: ${result[0].db}\n`);
    
    await connection.end();
    return 'tunnel';

  } catch (error) {
    console.log(`   ❌ Tunnel connection FAILED`);
    console.log(`   Error: ${error.message}`);
    console.log('   Note: You need to run create-ssh-tunnel.sh first!\n');
    return null;
  }
}

async function testSSHCommand() {
  console.log('3️⃣ Testing SSH Command Execution...');
  
  try {
    const command = `ssh aziz@103.125.181.47 "mysql -u ${process.env.SEJOLI_DB_USER} -p'${process.env.SEJOLI_DB_PASSWORD}' ${process.env.SEJOLI_DB_NAME} -e 'SELECT DATABASE();'" 2>&1`;
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout.includes(process.env.SEJOLI_DB_NAME)) {
      console.log('   ✅ SSH command execution SUCCESS!\n');
      return 'ssh';
    } else {
      console.log('   ❌ SSH command FAILED');
      console.log(`   Output: ${stdout}\n`);
      return null;
    }

  } catch (error) {
    console.log(`   ❌ SSH command FAILED`);
    console.log(`   Error: ${error.message}\n`);
    return null;
  }
}

async function testConnection() {
  console.log('🔍 SEJOLI DATABASE CONNECTION TEST');
  console.log('===================================\n');

  console.log('Database Configuration:');
  console.log(`  Host: ${process.env.SEJOLI_DB_HOST}`);
  console.log(`  Database: ${process.env.SEJOLI_DB_NAME}`);
  console.log(`  User: ${process.env.SEJOLI_DB_USER}\n`);
  console.log('Testing multiple connection methods...\n');

  // Test all methods
  const methods = {
    direct: await testDirectConnection(),
    tunnel: await testTunnelConnection(),
    ssh: await testSSHCommand(),
  };

  // Summary
  console.log('📊 CONNECTION TEST SUMMARY');
  console.log('===========================\n');

  const workingMethods = Object.entries(methods)
    .filter(([_, result]) => result !== null)
    .map(([method]) => method);

  if (workingMethods.length > 0) {
    console.log('✅ Working connection methods:');
    workingMethods.forEach(method => {
      console.log(`   • ${method.toUpperCase()}`);
    });
    console.log('');

    if (methods.direct) {
      console.log('💡 RECOMMENDED: Use direct connection');
      console.log('   No additional setup needed!\n');
      console.log('   Run: npm run inspect');
    } else if (methods.tunnel) {
      console.log('💡 RECOMMENDED: Use SSH tunnel');
      console.log('   1. Keep tunnel running: ./create-ssh-tunnel.sh');
      console.log('   2. Update .env.sejoli to use tunnel config');
      console.log('   3. Run: npm run inspect\n');
    } else if (methods.ssh) {
      console.log('💡 RECOMMENDED: Use SSH-based export');
      console.log('   We can export data via SSH commands instead.\n');
    }

  } else {
    console.log('❌ No working connection methods found!\n');
    console.log('🔧 Troubleshooting Steps:\n');
    console.log('1. Check database firewall rules');
    console.log('   - Is port 3306 open to external connections?');
    console.log('   - Check cPanel → Remote MySQL settings\n');
    
    console.log('2. Try SSH tunnel:');
    console.log('   chmod +x create-ssh-tunnel.sh');
    console.log('   ./create-ssh-tunnel.sh');
    console.log('   (in another terminal) npm run inspect\n');
    
    console.log('3. Alternative: Export from server');
    console.log('   ssh aziz@103.125.181.47');
    console.log('   mysqldump -u USER -p DATABASE > backup.sql');
    console.log('   (then import to local MySQL)\n');
    
    console.log('4. Contact hosting provider');
    console.log('   Ask to whitelist your IP: [your IP here]');
    console.log('   Or enable remote MySQL access\n');
  }

  console.log('📧 Need help? Check README.md for detailed instructions.\n');
}

testConnection().catch(console.error);
