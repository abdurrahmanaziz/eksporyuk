// Test API /api/affiliate/coupons/all
// Buka di browser console saat sudah login sebagai affiliate

fetch('/api/affiliate/coupons/all')
  .then(res => res.json())
  .then(data => {
    console.log('=== RESPONSE FROM /api/affiliate/coupons/all ===')
    console.log('Total coupons:', data.coupons?.length || 0)
    console.log('Data:', data)
    
    if (data.coupons) {
      data.coupons.forEach((coupon, idx) => {
        console.log(`\n${idx + 1}. ${coupon.code}`)
        console.log(`   Source: ${coupon.source}`)
        console.log(`   Discount: ${coupon.discountType} - ${coupon.discountValue}`)
        console.log(`   Own Coupon: ${coupon.isOwnCoupon}`)
      })
    }
  })
  .catch(err => console.error('Error:', err))
