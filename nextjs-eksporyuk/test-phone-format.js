// Test phone number formatting logic
function testPhoneFormatting() {
  const formatPhoneNumber = (value) => {
    let formatted = value.replace(/[^0-9]/g, '');
    if (formatted.startsWith('62')) {
      formatted = formatted.substring(2);
    }
    if (formatted.startsWith('0')) {
      formatted = '8' + formatted.substring(1);
    }
    return formatted;
  };

  const testCases = [
    '08118748177',    // Original problem case
    '0821234567',     // Another 0-prefix case
    '88118748177',    // Already correct format
    '+6281234567',    // With country code
    '6281234567',     // Country code without +
    '081-187-48177',  // With dashes
    '08 1187 48177'   // With spaces
  ];

  console.log('=== PHONE NUMBER FORMATTING TEST ===');
  testCases.forEach(test => {
    const result = formatPhoneNumber(test);
    const status = (test === '08118748177' && result === '88118748177') ? '✅' : 
                  (test.includes('0') && !result.startsWith('0')) ? '✅' : '📱';
    console.log(`${status} ${test.padEnd(15)} → ${result}`);
  });
  
  // Special test for the main issue
  const mainTest = formatPhoneNumber('08118748177');
  console.log(`\n🎯 MAIN TEST: 08118748177 → ${mainTest} ${mainTest === '88118748177' ? '✅ FIXED' : '❌ STILL BROKEN'}`);
}

testPhoneFormatting();