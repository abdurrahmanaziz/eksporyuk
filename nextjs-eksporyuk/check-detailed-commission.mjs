import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkDetailedCommission() {
  console.log('🔍 CEK DETAIL KOMISI FLAT MEMBERSHIP\n')
  
  try {
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('💰 DETAIL LENGKAP KOMISI MEMBERSHIP:')
    console.log('=' .repeat(80))
    
    memberships.forEach((m, index) => {
      const price = parseFloat(m.price.toString())
      const commissionRate = parseFloat(m.affiliateCommissionRate.toString())
      
      console.log(`${index + 1}. ${m.name}`)
      console.log(`   ID: ${m.id}`)
      console.log(`   Slug: ${m.slug}`)
      console.log(`   Harga: Rp ${price.toLocaleString('id-ID')}`)
      console.log(`   Tipe Komisi: ${m.commissionType}`)
      console.log(`   Rate Komisi: ${commissionRate}`)
      console.log(`   Status: ${m.isActive ? 'Aktif' : 'Tidak Aktif'}`)
      
      if (m.commissionType === 'FLAT') {
        console.log(`   💰 Komisi FLAT: Rp ${commissionRate.toLocaleString('id-ID')}`)
        const percentage = ((commissionRate / price) * 100).toFixed(2)
        console.log(`   📊 Setara dengan: ${percentage}% dari harga`)
      } else {
        const commission = (price * commissionRate / 100)
        console.log(`   💰 Komisi ${commissionRate}%: Rp ${commission.toLocaleString('id-ID')}`)
      }
      
      console.log('')
    })
    
    // Analisis apakah nilai flat commission masuk akal
    console.log('🔎 ANALISIS KOMISI FLAT:')
    console.log('=' .repeat(50))
    
    const flatMemberships = memberships.filter(m => m.commissionType === 'FLAT')
    
    if (flatMemberships.length > 0) {
      console.log('📈 Membership dengan FLAT Commission:')
      flatMemberships.forEach(m => {
        const price = parseFloat(m.price.toString())
        const commissionRate = parseFloat(m.affiliateCommissionRate.toString())
        const percentage = ((commissionRate / price) * 100).toFixed(2)
        
        console.log(`   ${m.name}:`)
        console.log(`      Flat Rp ${commissionRate.toLocaleString('id-ID')} dari harga Rp ${price.toLocaleString('id-ID')}`)
        console.log(`      = ${percentage}% dari harga jual`)
        
        // Warning jika komisi terlalu kecil atau besar
        if (commissionRate < 100000) {
          console.log(`      ⚠️  PERINGATAN: Komisi mungkin terlalu kecil?`)
        }
        if (percentage > 50) {
          console.log(`      ⚠️  PERINGATAN: Komisi > 50% dari harga`)
        }
        console.log('')
      })
      
      // Cek apakah nilainya dalam ribuan (kemungkinan salah format)
      const suspiciousValues = flatMemberships.filter(m => 
        parseFloat(m.affiliateCommissionRate.toString()) < 1000
      )
      
      if (suspiciousValues.length > 0) {
        console.log('🚨 KEMUNGKINAN MASALAH FORMAT:')
        console.log('   Nilai komisi flat di bawah Rp 1.000 terdeteksi.')
        console.log('   Mungkin nilai seharusnya dalam ribuan?')
        console.log('')
        
        suspiciousValues.forEach(m => {
          const current = parseFloat(m.affiliateCommissionRate.toString())
          const suggested = current * 1000
          console.log(`   ${m.name}:`)
          console.log(`      Saat ini: Rp ${current}`)
          console.log(`      Mungkin maksud: Rp ${suggested.toLocaleString('id-ID')} ?`)
        })
      }
    }
    
    console.log('\n📝 KESIMPULAN:')
    console.log(`   Total Membership: ${memberships.length}`)
    console.log(`   Menggunakan FLAT: ${flatMemberships.length}`)
    console.log(`   Menggunakan PERCENTAGE: ${memberships.length - flatMemberships.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDetailedCommission()