const bcrypt = require('bcryptjs')

const hash = '$2a$10$XWyhtGO0Iy72nPV/0zvdhugKVGuKN4CnUwI3ZpnO.F6fjiqTr2hTq'

const passwords = [
  'password123',
  'admin123',
  'Password123',
  'Admin123'
]

console.log('Testing password hash from database...\n')
console.log('Hash:', hash)
console.log('-'.repeat(60))

passwords.forEach(pwd => {
  const match = bcrypt.compareSync(pwd, hash)
  console.log(`${pwd.padEnd(20)} => ${match ? '✅ MATCH' : '❌ NO MATCH'}`)
})
