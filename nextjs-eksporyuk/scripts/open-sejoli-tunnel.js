#!/usr/bin/env node
/**
 * Open SSH tunnel to Sejoli server for MySQL access.
 *
 * Reads credentials from `nextjs-eksporyuk/.env.sejoli`:
 * - SEJOLI_SSH_HOST, SEJOLI_SSH_USER, SEJOLI_SSH_PASSWORD
 * - SEJOLI_DB_PORT (local listen port; default 3307)
 *
 * Keeps running while tunnel is open.
 */

const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.sejoli') });

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function main() {
  const sshHost = process.env.SEJOLI_SSH_HOST;
  const sshUser = process.env.SEJOLI_SSH_USER;
  const sshPassword = process.env.SEJOLI_SSH_PASSWORD;
  const localPort = parseInt(process.env.SEJOLI_DB_PORT || '3307', 10);

  if (!sshHost || !sshUser || !sshPassword) {
    throw new Error('Missing SSH env. Need SEJOLI_SSH_HOST, SEJOLI_SSH_USER, SEJOLI_SSH_PASSWORD in nextjs-eksporyuk/.env.sejoli');
  }

  const already = await isPortOpen(localPort);
  if (already) {
    console.log(`✅ Tunnel already available on 127.0.0.1:${localPort}`);
    return;
  }

  console.log(`🔐 Opening SSH tunnel: 127.0.0.1:${localPort} -> ${sshHost}:3306`);

  const expect = spawn('expect', ['-'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    env: process.env,
  });

  const sshCmd = [
    'ssh',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    '-N',
    '-L', `${localPort}:127.0.0.1:3306`,
    `${sshUser}@${sshHost}`,
  ].join(' ');

  const expectScript = `
set timeout -1
set password $env(SEJOLI_SSH_PASSWORD)
log_user 1
spawn ${sshCmd}
expect {
  -re {Are you sure you want to continue connecting.*} {
    send "yes\r"
    exp_continue
  }
  -re {(?i).*password:.*} {
    log_user 0
    send -- "$password\r"
    log_user 1
    exp_continue
  }
  -re {(?i).*permission denied.*} {
    exit 2
  }
  eof {
    exit 1
  }
}
`;

  expect.stdin.write(expectScript);
  expect.stdin.end();

  expect.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Tunnel process exited (code ${code}).`);
      process.exit(code || 1);
    }
  });
}

main().catch((err) => {
  console.error('❌ Failed to open tunnel:', err.message);
  process.exit(1);
});
