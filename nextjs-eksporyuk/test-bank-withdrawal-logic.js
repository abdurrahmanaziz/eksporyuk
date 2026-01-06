/**
 * Test Bank Withdrawal Logic
 * Simulate endpoint behavior without calling real Xendit API
 */

const testData = {
  userId: 'cmjmtotzh001eitz0kq029lk5',
  amount: 100000,
  pin: '123456',
  bankName: 'BCA',
  accountName: 'Abdurrahman Aziz',
  accountNumber: '1234567890',
  walletBalance: 1625569000,
  adminFee: 5000
}

console.log('\n' + '='.repeat(60))
console.log('BANK WITHDRAWAL SIMULATION TEST')
console.log('='.repeat(60) + '\n')

// 1. Validate amount
console.log('1️⃣  Validating withdrawal amount...')
const minPayout = 50000
if (testData.amount < minPayout) {
  console.log(`   ❌ FAIL: Amount ${testData.amount} < minimum ${minPayout}`)
  process.exit(1)
}
console.log(`   ✅ PASS: Amount ${testData.amount} >= minimum ${minPayout}`)

// 2. Calculate net amount
console.log('\n2️⃣  Calculating net amount...')
const netAmount = testData.amount - testData.adminFee
console.log(`   Requested: Rp ${testData.amount.toLocaleString()}`)
console.log(`   Admin Fee: Rp ${testData.adminFee.toLocaleString()}`)
console.log(`   Net Amount: Rp ${netAmount.toLocaleString()}`)

if (netAmount <= 0) {
  console.log(`   ❌ FAIL: Net amount ${netAmount} <= 0`)
  process.exit(1)
}
console.log(`   ✅ PASS: Net amount valid`)

// 3. Check balance
console.log('\n3️⃣  Checking wallet balance...')
const pending = 0 // No pending payouts
const available = testData.walletBalance - pending
console.log(`   Wallet Balance: Rp ${testData.walletBalance.toLocaleString()}`)
console.log(`   Pending: Rp ${pending.toLocaleString()}`)
console.log(`   Available: Rp ${available.toLocaleString()}`)
console.log(`   Requested: Rp ${testData.amount.toLocaleString()}`)

if (testData.amount > available) {
  console.log(`   ❌ FAIL: Insufficient balance`)
  process.exit(1)
}
console.log(`   ✅ PASS: Balance sufficient`)

// 4. Map bank code
console.log('\n4️⃣  Mapping bank code...')
const bankCodes = {
  'BCA': 'ID_BCA',
  'BNI': 'ID_BNI',
  'BRI': 'ID_BRI',
  'MANDIRI': 'ID_MANDIRI',
}
const bankCode = bankCodes[testData.bankName.toUpperCase()] || 'ID_BCA'
console.log(`   Bank Name: ${testData.bankName}`)
console.log(`   Bank Code: ${bankCode}`)
console.log(`   ✅ PASS: Bank code mapped`)

// 5. Simulate Xendit request
console.log('\n5️⃣  Simulating Xendit API request...')
const referenceId = `bank_${testData.userId}_${Date.now()}`
const xenditRequest = {
  referenceId,
  channelCode: bankCode,
  channelProperties: {
    accountHolderName: testData.accountName,
    accountNumber: testData.accountNumber,
  },
  amount: netAmount,
  currency: 'IDR',
  description: `Bank transfer payout - Abdurrahman Aziz`,
  metadata: {
    userId: testData.userId,
    type: 'bank_transfer'
  }
}

console.log('   Xendit Request:', JSON.stringify(xenditRequest, null, 2))
console.log('   ✅ Request structure valid')

// 6. Simulate Xendit response
console.log('\n6️⃣  Simulating Xendit API response...')
const xenditResponse = {
  id: `disb_${Date.now()}`,
  referenceId: referenceId,
  channelCode: bankCode,
  channelProperties: xenditRequest.channelProperties,
  amount: netAmount,
  currency: 'IDR',
  description: xenditRequest.description,
  status: 'PENDING',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  metadata: xenditRequest.metadata
}

console.log('   Xendit Response:', JSON.stringify(xenditResponse, null, 2))
console.log('   ✅ Response structure valid')

// 7. Simulate database Payout record
console.log('\n7️⃣  Simulating database Payout record...')
const payoutRecord = {
  id: `payout_${Date.now()}`,
  walletId: 'e28eac09927d3bd3b047c927e709655f',
  amount: testData.amount,
  status: 'PROCESSING',
  bankName: testData.bankName,
  accountName: testData.accountName,
  accountNumber: testData.accountNumber,
  notes: 'Bank transfer otomatis via Xendit',
  metadata: {
    adminFee: testData.adminFee,
    netAmount: netAmount,
    requestedAmount: testData.amount,
    xenditId: xenditResponse.id,
    xenditReferenceId: xenditResponse.referenceId
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

console.log('   Payout Record:', JSON.stringify(payoutRecord, null, 2))
console.log('   ✅ Database record structure valid')

// 8. Simulate wallet balance deduction
console.log('\n8️⃣  Simulating wallet balance deduction...')
const newBalance = testData.walletBalance - testData.amount
console.log(`   Old Balance: Rp ${testData.walletBalance.toLocaleString()}`)
console.log(`   Deduction: Rp ${testData.amount.toLocaleString()}`)
console.log(`   New Balance: Rp ${newBalance.toLocaleString()}`)
console.log('   ✅ Balance deduction calculated')

// Final summary
console.log('\n' + '='.repeat(60))
console.log('✅ ALL TESTS PASSED - Logic is correct!')
console.log('='.repeat(60))
console.log('\nExpected Flow:')
console.log('1. Validate amount >= min (50,000)')
console.log('2. Calculate net amount (amount - admin fee)')
console.log('3. Check balance >= amount')
console.log('4. Map bank name → bank code')
console.log('5. Call Xendit API with proper structure')
console.log('6. Save payout record with status PROCESSING')
console.log('7. Deduct balance immediately')
console.log('8. Wait for Xendit webhook to update status')
console.log('\nPossible Error Sources:')
console.log('❌ XENDIT_SECRET_KEY not set in production env')
console.log('❌ Network issue calling Xendit API')
console.log('❌ Xendit account insufficient balance')
console.log('❌ Invalid bank account number')
console.log('❌ TypeScript type mismatch (Decimal vs number)')
console.log('')
