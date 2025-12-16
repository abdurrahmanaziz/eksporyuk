#!/usr/bin/env node
/**
 * Tutor LMS Importer via SSH with embedded password
 * Automatically handles SSH tunnel and MySQL import
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const SSH_HOST = '103.125.181.47'
const SSH_USER = 'aziz'
const SSH_PASS = 'Bismillah.2022'
const LOCAL_PORT = 3307
const REMOTE_MYSQL_PORT = 3306

console.log('🚀 Starting Tutor LMS import via SSH...\n')

// Create expect script for automated SSH
const expectScript = `#!/usr/bin/expect -f
set timeout 20
spawn ssh -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_MYSQL_PORT} ${SSH_USER}@${SSH_HOST} -N
expect {
    "password:" {
        send "${SSH_PASS}\\r"
        expect eof
    }
    "Password:" {
        send "${SSH_PASS}\\r"
        expect eof
    }
    "(yes/no" {
        send "yes\\r"
        expect "password:"
        send "${SSH_PASS}\\r"
        expect eof
    }
    timeout {
        puts "Connection timeout"
        exit 1
    }
}
`

const expectPath = path.join(__dirname, 'ssh-tunnel.expect')
fs.writeFileSync(expectPath, expectScript)
fs.chmodSync(expectPath, '755')

// Start SSH tunnel
console.log('📡 Opening SSH tunnel...')
const tunnel = spawn(expectPath, [], {
  stdio: ['pipe', 'pipe', 'pipe']
})

let tunnelReady = false

tunnel.stdout.on('data', (data) => {
  console.log(`[SSH] ${data}`)
})

tunnel.stderr.on('data', (data) => {
  const output = data.toString()
  if (output.includes('Local forwarding') || output.includes('Entering interactive session')) {
    tunnelReady = true
  }
})

// Wait for tunnel then run importer
setTimeout(() => {
  console.log('✅ SSH tunnel should be ready, running MySQL importer...\n')
  
  const importer = spawn('node', [path.join(__dirname, 'import-tutor-lms-mysql.js')], {
    stdio: 'inherit',
    env: { ...process.env }
  })
  
  importer.on('close', (code) => {
    console.log(`\n✅ Importer finished with code ${code}`)
    console.log('🔒 Closing SSH tunnel...')
    tunnel.kill()
    process.exit(code)
  })
}, 3000)

tunnel.on('close', (code) => {
  if (code !== 0 && !tunnelReady) {
    console.error(`❌ SSH tunnel failed with code ${code}`)
    process.exit(1)
  }
})
