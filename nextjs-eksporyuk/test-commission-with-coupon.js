const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCommissionWithCoupon() {
  console.log('🧪 Testing Commission Calculation with Coupon\n')
  console.log('=' .repeat(70))
  
  try {
    // Scenario: Membership dengan harga 1.998.000, ada kupon 50%, jadi bayar 999.000
    
    const testData = {
      membershipPrice: 1998000,
      couponDiscount: 50, // 50%
      finalPrice: 999000, // Setelah kupon
      commissionType: 'PERCENTAGE',
      commissionRate: 30
    }
    
    console.log('\n📋 SCENARIO:')
    console.log('  Membership Harga Normal: Rp', testData.membershipPrice.toLocaleString('id-ID'))
    console.log('  Kupon Diskon: ', testData.couponDiscount + '%')
    console.log('  Harga Final (dibayar): Rp', testData.finalPrice.toLocaleString('id-ID'))
    console.log('  Commission Type:', testData.commissionType)
    console.log('  Commission Rate:', testData.commissionRate + '%')
    
    console.log('\n' + '━'.repeat(70))
    console.log('💰 REVENUE SPLIT CALCULATION:')
    console.log('━'.repeat(70))
    
    const amount = testData.finalPrice
    let remaining = amount
    
    // 1. Affiliate Commission (dari harga yang dibayar!)
    const affiliateCommission = amount * (testData.commissionRate / 100)
    remaining -= affiliateCommission
    console.log(`\n1️⃣  Affiliate (${testData.commissionRate}%):`)
    console.log(`    Formula: Rp ${amount.toLocaleString('id-ID')} × ${testData.commissionRate}%`)
    console.log(`    ✅ Dapat: Rp ${affiliateCommission.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    
    // 2. Admin/Company (15% dari sisa)
    const adminCommission = remaining * 0.15
    remaining -= adminCommission
    console.log(`\n2️⃣  Admin/Company (15%):`)
    console.log(`    Formula: Rp ${(amount - affiliateCommission).toLocaleString('id-ID')} × 15%`)
    console.log(`    ✅ Dapat: Rp ${adminCommission.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    
    // 3. Founder (60% dari sisa)
    const founderShare = remaining * 0.60
    console.log(`\n3️⃣  Founder (60% dari sisa):`)
    console.log(`    Formula: Rp ${remaining.toLocaleString('id-ID')} × 60%`)
    console.log(`    ✅ Dapat: Rp ${founderShare.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    
    // 4. Co-Founder (40% dari sisa)
    const coFounderShare = remaining * 0.40
    console.log(`\n4️⃣  Co-Founder (40% dari sisa):`)
    console.log(`    Formula: Rp ${remaining.toLocaleString('id-ID')} × 40%`)
    console.log(`    ✅ Dapat: Rp ${coFounderShare.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    
    // Verify total
    const total = affiliateCommission + adminCommission + founderShare + coFounderShare
    console.log('\n' + '━'.repeat(70))
    console.log('📊 SUMMARY:')
    console.log('━'.repeat(70))
    console.log(`  Total Distributed: Rp ${total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    console.log(`  Original Amount:   Rp ${amount.toLocaleString('id-ID')}`)
    console.log(`  ✅ Match: ${Math.abs(total - amount) < 1 ? 'YES' : 'NO'}`)
    
    console.log('\n' + '━'.repeat(70))
    console.log('⚠️  IMPORTANT NOTES:')
    console.log('━'.repeat(70))
    console.log('  ❌ SALAH: Komisi dari Rp', testData.membershipPrice.toLocaleString('id-ID'), '(harga membership)')
    console.log('  ✅ BENAR: Komisi dari Rp', testData.finalPrice.toLocaleString('id-ID'), '(harga yang dibayar)')
    console.log('\n  📝 Kenapa?')
    console.log('     - Customer bayar: Rp', testData.finalPrice.toLocaleString('id-ID'))
    console.log('     - Komisi dihitung: dari uang yang masuk (Rp', testData.finalPrice.toLocaleString('id-ID') + ')')
    console.log('     - BUKAN dari harga asli package!')
    
    // Test FLAT commission
    console.log('\n\n' + '='.repeat(70))
    console.log('🧪 Testing FLAT Commission\n')
    console.log('=' .repeat(70))
    
    const flatData = {
      membershipPrice: 1998000,
      couponDiscount: 50,
      finalPrice: 999000,
      commissionType: 'FLAT',
      flatAmount: 100000
    }
    
    console.log('\n📋 SCENARIO:')
    console.log('  Membership Harga Normal: Rp', flatData.membershipPrice.toLocaleString('id-ID'))
    console.log('  Kupon Diskon: ', flatData.couponDiscount + '%')
    console.log('  Harga Final (dibayar): Rp', flatData.finalPrice.toLocaleString('id-ID'))
    console.log('  Commission Type:', flatData.commissionType)
    console.log('  Flat Amount: Rp', flatData.flatAmount.toLocaleString('id-ID'))
    
    console.log('\n' + '━'.repeat(70))
    console.log('💰 REVENUE SPLIT CALCULATION (FLAT):')
    console.log('━'.repeat(70))
    
    let remainingFlat = flatData.finalPrice
    
    // 1. Affiliate - FLAT
    const affiliateFlat = flatData.flatAmount
    remainingFlat -= affiliateFlat
    console.log(`\n1️⃣  Affiliate (FLAT):`)
    console.log(`    ✅ Dapat: Rp ${affiliateFlat.toLocaleString('id-ID')} (tetap, tidak terpengaruh kupon)`)
    
    // 2-4. Same as before
    const adminFlat = remainingFlat * 0.15
    remainingFlat -= adminFlat
    const founderFlat = remainingFlat * 0.60
    const coFounderFlat = remainingFlat * 0.40
    
    console.log(`\n2️⃣  Admin: Rp ${adminFlat.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    console.log(`3️⃣  Founder: Rp ${founderFlat.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    console.log(`4️⃣  Co-Founder: Rp ${coFounderFlat.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    
    const totalFlat = affiliateFlat + adminFlat + founderFlat + coFounderFlat
    console.log('\n' + '━'.repeat(70))
    console.log('📊 SUMMARY:')
    console.log('━'.repeat(70))
    console.log(`  Total Distributed: Rp ${totalFlat.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`)
    console.log(`  Original Amount:   Rp ${flatData.finalPrice.toLocaleString('id-ID')}`)
    console.log(`  ✅ Match: ${Math.abs(totalFlat - flatData.finalPrice) < 1 ? 'YES' : 'NO'}`)
    
    console.log('\n\n✅ ALL TESTS COMPLETED!\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCommissionWithCoupon()
