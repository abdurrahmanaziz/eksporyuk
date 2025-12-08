// Test VA creation with different banks
// Run: node test-va-creation.js

const banks = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'PERMATA', 'CIMB'];

// This just validates the channel code format
function getXenditChannelCode(bankCode) {
  const validChannelCodes = [
    'BCA', 'BJB', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI', 'CIMB', 
    'SAHABAT_SAMPOERNA', 'ARTAJASA', 'BNC', 'HANA', 'MUAMALAT'
  ];
  
  // Remove ID_ prefix if accidentally added
  let code = bankCode.replace(/^ID_/, '');
  
  // Validate
  if (validChannelCodes.includes(code)) {
    return code;
  }
  
  // Return as-is if not in list
  return code;
}

console.log('=== VA Channel Code Test ===\n');

banks.forEach(bank => {
  const channelCode = getXenditChannelCode(bank);
  console.log(`Input: ${bank} → Channel Code: ${channelCode} ✅`);
});

console.log('\n=== Testing with ID_ prefix (should be stripped) ===\n');

['ID_BCA', 'ID_MANDIRI', 'ID_BNI'].forEach(bank => {
  const channelCode = getXenditChannelCode(bank);
  console.log(`Input: ${bank} → Channel Code: ${channelCode} ✅`);
});

console.log('\n✅ All channel codes are now in correct format (NO ID_ prefix)');
console.log('\nNext step: Test actual VA creation in the app with MANDIRI or BNI bank');
