import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkCommissionSystem() {
  console.log('🔍 SISTEM KOMISI SAAT INI\n')
  
  try {
    // Cek membership commission
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      }
    })
    
    console.log('💰 KOMISI MEMBERSHIP:')
    memberships.forEach(m => {
      const rate = parseFloat(m.affiliateCommissionRate.toString())
      const price = parseFloat(m.price.toString())
      
      const commission = m.commissionType === 'PERCENTAGE' 
        ? `${rate}% (Rp ${(price * rate / 100).toLocaleString('id-ID')})`
        : `Flat Rp ${rate.toLocaleString('id-ID')}`
      console.log(`   ${m.name}: ${commission}`)
    })
    
    // Cek product commission
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      },
      take: 5
    })
    
    if (products.length > 0) {
      console.log('\n📦 KOMISI PRODUK:')
      products.forEach(p => {
        const rate = parseFloat(p.affiliateCommissionRate.toString())
        const price = parseFloat(p.price.toString())
        
        const commission = p.commissionType === 'PERCENTAGE'
          ? `${rate}% (Rp ${(price * rate / 100).toLocaleString('id-ID')})`
          : `Flat Rp ${rate.toLocaleString('id-ID')}`
        console.log(`   ${p.name}: ${commission}`)
      })
    }
    
    // Cek course commission
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      },
      take: 3
    })
    
    if (courses.length > 0) {
      console.log('\n📚 KOMISI KURSUS:')
      courses.forEach(c => {
        const rate = parseFloat(c.affiliateCommissionRate.toString())
        const price = parseFloat(c.price.toString())
        
        const commission = c.commissionType === 'PERCENTAGE'
          ? `${rate}% (Rp ${(price * rate / 100).toLocaleString('id-ID')})`
          : `Flat Rp ${rate.toLocaleString('id-ID')}`
        console.log(`   ${c.title}: ${commission}`)
      })
    }
    
    console.log('\n📊 SISTEM KOMISI YANG DIDUKUNG:')
    console.log('   ✅ PERCENTAGE - Komisi berdasarkan persentase dari harga')
    console.log('   ✅ FLAT - Komisi dengan nominal tetap (fixed amount)')
    console.log('')
    console.log('🎯 CONTOH PENGGUNAAN FLAT COMMISSION:')
    console.log('   - Membership Paket A: Flat Rp 500.000 per penjualan')
    console.log('   - Membership Paket B: Flat Rp 300.000 per penjualan')
    console.log('   - Produk Premium: Flat Rp 150.000 per penjualan')
    console.log('')
    console.log('📝 CARA KERJA:')
    console.log('   1. Admin set commissionType = "FLAT"')
    console.log('   2. Admin set affiliateCommissionRate = nominal tetap (misal 500000)')
    console.log('   3. Affiliate dapat komisi tetap tidak peduli harga berapa')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkCommissionSystem()