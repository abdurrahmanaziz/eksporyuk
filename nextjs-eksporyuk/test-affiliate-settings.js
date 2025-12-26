/**
 * Test Affiliate Settings Page
 */

const testAffiliateSettings = async () => {
  const API_BASE = 'http://localhost:3000'
  
  console.log('�� TESTING AFFILIATE SETTINGS\n')
  
  // Test 1: GET current settings
  console.log('1️⃣  Fetching current settings...')
  const getResponse = await fetch(`${API_BASE}/api/admin/settings`)
  const getData = await getResponse.json()
  
  console.log('Response:', {
    success: getData.success,
    affiliateAutoApprove: getData.settings?.affiliateAutoApprove,
    affiliateCommissionEnabled: getData.settings?.affiliateCommissionEnabled,
    defaultAffiliateCommission: getData.settings?.defaultAffiliateCommission || getData.settings?.CourseSettings?.defaultAffiliateCommission,
    minWithdrawalAmount: getData.settings?.minWithdrawalAmount || getData.settings?.withdrawalMinAmount || getData.settings?.CourseSettings?.minWithdrawalAmount
  })
  
  console.log('\n📋 Affiliate Settings Analysis:')
  console.log('   Settings model has:', getData.settings?.affiliateAutoApprove !== undefined ? '✅ affiliateAutoApprove' : '❌ affiliateAutoApprove')
  console.log('   Settings model has:', getData.settings?.affiliateCommissionEnabled !== undefined ? '✅ affiliateCommissionEnabled' : '❌ affiliateCommissionEnabled')
  console.log('   CourseSettings model has:', getData.settings?.CourseSettings ? '✅ CourseSettings' : '❌ CourseSettings')
  
  console.log('\n✅ Test completed')
}

testAffiliateSettings().catch(console.error)
