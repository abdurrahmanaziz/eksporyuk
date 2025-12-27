// Test new checkout logic

console.log('🧪 Testing Checkout Logic\n')

const testCases = [
  {
    url: '/checkout/6bulan-ekspor',
    slug: '6bulan-ekspor',
    membershipCheckoutSlug: '6bulan-ekspor',
    membershipSlug: '6bulan-ekspor',
    expected: 'SINGLE (only 6 months package)'
  },
  {
    url: '/checkout/12bulan-ekspor',
    slug: '12bulan-ekspor',
    membershipCheckoutSlug: '12bulan-ekspor',
    membershipSlug: '12bulan-ekspor',
    expected: 'SINGLE (only 12 months package)'
  },
  {
    url: '/checkout/lifetime',
    slug: 'lifetime',
    membershipCheckoutSlug: 'lifetime',
    membershipSlug: 'lifetime',
    expected: 'SINGLE (only lifetime package)'
  },
  {
    url: '/checkout/pro',
    slug: 'pro',
    membershipCheckoutSlug: 'pro',
    membershipSlug: 'pro',
    expected: 'GENERAL (show all packages)'
  }
]

testCases.forEach(test => {
  const isSingleCheckout = (test.membershipCheckoutSlug === test.slug || test.membershipSlug === test.slug) && 
                           test.membershipCheckoutSlug !== 'pro' && 
                           test.membershipSlug !== 'pro'
  
  const result = isSingleCheckout ? 'SINGLE' : 'GENERAL'
  const status = (isSingleCheckout && test.expected.includes('SINGLE')) || 
                 (!isSingleCheckout && test.expected.includes('GENERAL')) ? '✅' : '❌'
  
  console.log(`${status} ${test.url}`)
  console.log(`   Expected: ${test.expected}`)
  console.log(`   Got: ${result}`)
  console.log(`   Logic: checkoutSlug="${test.membershipCheckoutSlug}" === slug="${test.slug}" && not "pro"`)
  console.log('')
})
