/**
 * Check Browser Console Logs
 * Script ini untuk di-paste di browser console untuk cek data yang diterima frontend
 */

// Paste this in browser console when viewing /admin/sales page

console.clear();
console.log('=== Checking Frontend Data ===\n');

// Check if transactions are loaded in React state
// This will work if you have React DevTools
if (typeof $r !== 'undefined') {
  console.log('React component:', $r);
  console.log('State:', $r?.state);
  console.log('Props:', $r?.props);
}

// Check network requests
console.log('\n--- Check Network Tab ---');
console.log('1. Open Network tab');
console.log('2. Filter by "sales"');
console.log('3. Look for /api/admin/sales request');
console.log('4. Check Response data');

// Check local storage
console.log('\n--- Local Storage ---');
console.log(localStorage);

// Check session storage
console.log('\n--- Session Storage ---');
console.log(sessionStorage);

// Try to intercept fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (args[0].includes('/api/admin/sales')) {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    console.log('\n=== INTERCEPTED API RESPONSE ===');
    console.log('URL:', args[0]);
    console.log('Data:', data);
    console.log('Total transactions:', data.transactions?.length);
    
    if (data.transactions && data.transactions.length > 0) {
      const firstTx = data.transactions[0];
      console.log('\nFirst transaction:');
      console.log('- Invoice:', firstTx.invoiceNumber);
      console.log('- User:', firstTx.user?.name);
      console.log('- Has affiliateConversion:', !!firstTx.affiliateConversion);
      
      if (firstTx.affiliateConversion) {
        console.log('- Affiliate:', firstTx.affiliateConversion.affiliate?.user?.name);
        console.log('- Commission:', firstTx.affiliateConversion.commissionAmount);
      }
    }
  }
  return response;
};

console.log('\n✅ Fetch interceptor installed. Reload the page to see API responses.\n');
