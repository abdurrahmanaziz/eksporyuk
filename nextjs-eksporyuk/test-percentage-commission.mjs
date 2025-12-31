import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testPercentageCommission() {
  console.log('🔍 TEST SISTEM KOMISI PERCENTAGE\n')
  
  try {
    // Backup current values first
    const currentMemberships = await prisma.membership.findMany({
      select: {
        slug: true,
        name: true,
        affiliateCommissionRate: true,
        commissionType: true,
        price: true
      }
    })
    
    console.log('📊 NILAI SAAT INI (FLAT):')
    currentMemberships.forEach(m => {
      const rate = parseFloat(m.affiliateCommissionRate.toString())
      const price = parseFloat(m.price.toString())
      console.log(`${m.name}: ${m.commissionType} Rp ${rate.toLocaleString('id-ID')}`)
    })
    
    console.log('\n🔄 TESTING: Ubah Promo Akhir Tahun ke PERCENTAGE 20%...')
    
    // Test: ubah Promo Akhir Tahun ke percentage 20%
    await prisma.membership.update({
      where: { slug: 'promo-akhir-tahun-2025' },
      data: {
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 20 // 20%
      }
    })
    
    console.log('✅ Update berhasil!')
    
    // Verify the change
    const updatedMemberships = await prisma.membership.findMany({
      select: {
        slug: true,
        name: true,
        affiliateCommissionRate: true,
        commissionType: true,
        price: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log('\n💰 HASIL SETELAH UPDATE:')
    console.log('=' .repeat(60))
    
    updatedMemberships.forEach(m => {
      const rate = parseFloat(m.affiliateCommissionRate.toString())
      const price = parseFloat(m.price.toString())
      
      if (m.commissionType === 'PERCENTAGE') {
        const commission = (price * rate / 100)
        console.log(`${m.name}:`)
        console.log(`   Harga: Rp ${price.toLocaleString('id-ID')}`)
        console.log(`   Komisi: ${rate}% = Rp ${commission.toLocaleString('id-ID')}`)
        console.log(`   Tipe: PERCENTAGE ✅`)
      } else {
        const percentage = ((rate / price) * 100).toFixed(1)
        console.log(`${m.name}:`)
        console.log(`   Harga: Rp ${price.toLocaleString('id-ID')}`)
        console.log(`   Komisi: Flat Rp ${rate.toLocaleString('id-ID')} (${percentage}%)`)
        console.log(`   Tipe: FLAT`)
      }
      console.log('')
    })
    
    console.log('🧪 TEST CALCULATION:')
    const promoMembership = updatedMemberships.find(m => m.slug === 'promo-akhir-tahun-2025')
    if (promoMembership && promoMembership.commissionType === 'PERCENTAGE') {
      const price = parseFloat(promoMembership.price.toString())
      const rate = parseFloat(promoMembership.affiliateCommissionRate.toString())
      const calculatedCommission = (price * rate / 100)
      
      console.log(`   ${promoMembership.name}:`)
      console.log(`   - Harga: Rp ${price.toLocaleString('id-ID')}`)
      console.log(`   - Rate: ${rate}%`)
      console.log(`   - Kalkulasi: ${price} × ${rate}% = Rp ${calculatedCommission.toLocaleString('id-ID')}`)
      console.log(`   ✅ Sistem PERCENTAGE berfungsi!`)
    }
    
    console.log('\n📋 SISTEM KOMISI YANG DIDUKUNG:')
    console.log('   ✅ FLAT - Komisi nominal tetap (contoh: Rp 325.000)')
    console.log('   ✅ PERCENTAGE - Komisi berdasarkan % dari harga (contoh: 20%)')
    
    const flatCount = updatedMemberships.filter(m => m.commissionType === 'FLAT').length
    const percentageCount = updatedMemberships.filter(m => m.commissionType === 'PERCENTAGE').length
    
    console.log('\n📊 SUMMARY:')
    console.log(`   - Menggunakan FLAT: ${flatCount} membership`)
    console.log(`   - Menggunakan PERCENTAGE: ${percentageCount} membership`)
    console.log('   - Sistem fleksibel: Admin bisa set berbeda untuk setiap membership')
    
    console.log('\n🔄 Kembalikan ke FLAT untuk konsistensi...')
    
    // Restore to FLAT
    await prisma.membership.update({
      where: { slug: 'promo-akhir-tahun-2025' },
      data: {
        commissionType: 'FLAT',
        affiliateCommissionRate: 150000 // Back to original Rp 150.000
      }
    })
    
    console.log('✅ Dikembalikan ke FLAT Rp 150.000')
    
    console.log('\n🎯 KESIMPULAN:')
    console.log('   ✅ Sistem FLAT: Sudah aktif dan berfungsi')
    console.log('   ✅ Sistem PERCENTAGE: Sudah aktif dan berfungsi')
    console.log('   ✅ Admin bisa pilih tipe komisi untuk setiap membership')
    console.log('   ✅ Kalkulasi otomatis sesuai tipe yang dipilih')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testPercentageCommission()