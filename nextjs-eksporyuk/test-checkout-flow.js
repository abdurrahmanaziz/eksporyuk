/**
 * Test Checkout Flow dengan Bank Selection
 * 
 * Test ini akan mensimulasikan flow checkout:
 * 1. User pilih bank (BCA)
 * 2. Submit checkout
 * 3. API create VA
 * 4. Redirect ke payment page
 * 5. Display VA number
 */

const API_URL = 'http://localhost:3001'

async function testCheckoutFlow() {
  console.log('🧪 Starting Checkout Flow Test...\n')

  // Step 1: Get membership packages
  console.log('📦 Step 1: Fetching membership packages...')
  const packagesRes = await fetch(`${API_URL}/api/memberships/packages`)
  const packagesData = await packagesRes.json()
  
  if (!packagesData.success || !packagesData.packages.length) {
    console.error('❌ Failed to fetch packages')
    return
  }
  
  const testPackage = packagesData.packages[0]
  console.log(`✅ Found package: ${testPackage.name} - Rp ${testPackage.price.toLocaleString('id-ID')}\n`)

  // Step 2: Create checkout with bank selection
  console.log('💳 Step 2: Creating checkout with BCA Virtual Account...')
  const checkoutData = {
    type: 'MEMBERSHIP',
    membershipId: testPackage.id,
    amount: testPackage.price,
    customerData: {
      name: 'Test User Bank Selection',
      email: `test-${Date.now()}@example.com`,
      phone: '081234567890',
      whatsapp: '081234567890'
    },
    paymentChannel: 'BCA', // Selected bank
    notes: 'Test checkout with bank selection'
  }

  console.log('Request Data:', JSON.stringify(checkoutData, null, 2))

  const checkoutRes = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutData)
  })

  const checkoutResult = await checkoutRes.json()
  
  if (!checkoutResult.success) {
    console.error('❌ Checkout failed:', checkoutResult.error)
    return
  }

  console.log('✅ Checkout created successfully!')
  console.log('Transaction ID:', checkoutResult.transactionId)
  console.log('Payment URL:', checkoutResult.paymentUrl)
  
  if (checkoutResult.xenditData) {
    console.log('\n💰 Xendit Data:')
    console.log('- VA ID:', checkoutResult.xenditData.id)
    console.log('- VA Number:', checkoutResult.xenditData.accountNumber || 'N/A')
    console.log('- Bank Code:', checkoutResult.xenditData.bankCode || 'N/A')
  }

  // Step 3: Fetch transaction details
  console.log('\n📋 Step 3: Fetching transaction details...')
  const txRes = await fetch(`${API_URL}/api/transactions/${checkoutResult.transactionId}`)
  const txData = await txRes.json()

  if (txData.success) {
    console.log('✅ Transaction details:')
    console.log('- Status:', txData.transaction.status)
    console.log('- Amount:', txData.transaction.amount)
    console.log('- Type:', txData.transaction.type)
    
    if (txData.transaction.metadata?.xenditVANumber) {
      console.log('\n🏦 Virtual Account Details:')
      console.log('- Bank:', txData.transaction.metadata.xenditBankCode)
      console.log('- VA Number:', txData.transaction.metadata.xenditVANumber)
      console.log('- Status: Waiting for payment')
      
      console.log('\n✅ TEST PASSED! VA Number generated successfully!')
      console.log(`\n👉 You can now open: ${API_URL}${checkoutResult.paymentUrl}`)
      console.log('   to see the payment page with VA number display')
    } else {
      console.log('\n⚠️ VA Number not found in transaction metadata')
      console.log('Metadata:', JSON.stringify(txData.transaction.metadata, null, 2))
    }
  } else {
    console.error('❌ Failed to fetch transaction:', txData.error)
  }

  console.log('\n🎉 Test completed!')
}

// Run test
testCheckoutFlow().catch(error => {
  console.error('❌ Test failed:', error)
})
