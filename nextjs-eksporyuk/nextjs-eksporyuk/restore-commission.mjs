import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function restoreOriginalCommission() {
  console.log('🔄 MENGEMBALIKAN KOMISI KE NILAI ASLI YANG ANDA SETTING\n')
  
  try {
    // Update Paket Lifetime ke 325.000
    await prisma.membership.update({
      where: { slug: 'paket-lifetime' },
      data: {
        affiliateCommissionRate: 325000,
        commissionType: 'FLAT'
      }
    })
    console.log('✅ Paket Lifetime: Flat Rp 325.000')
    
    // Update Paket 12 Bulan ke 250.000
    await prisma.membership.update({
      where: { slug: 'paket-12-bulan' },
      data: {
        affiliateCommissionRate: 250000,
        commissionType: 'FLAT'
      }
    })
    console.log('✅ Paket 12 Bulan: Flat Rp 250.000')
    
    // Update Paket 6 Bulan ke 200.000
    await prisma.membership.update({
      where: { slug: 'paket-6-bulan' },
      data: {
        affiliateCommissionRate: 200000,
        commissionType: 'FLAT'
      }
    })
    console.log('✅ Paket 6 Bulan: Flat Rp 200.000')
    
    // Untuk Promo Akhir Tahun, saya setting 150.000 (kira-kira proporsional)
    await prisma.membership.update({
      where: { slug: 'promo-akhir-tahun-2025' },
      data: {
        affiliateCommissionRate: 150000,
        commissionType: 'FLAT'
      }
    })
    console.log('✅ Promo Akhir Tahun: Flat Rp 150.000')
    
    console.log('\n📊 VERIFIKASI SETELAH UPDATE:')
    
    const memberships = await prisma.membership.findMany({
      select: {
        name: true,
        slug: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      },
      orderBy: { affiliateCommissionRate: 'desc' }
    })
    
    memberships.forEach(m => {
      const price = parseFloat(m.price.toString())
      const commission = parseFloat(m.affiliateCommissionRate.toString())
      const percentage = ((commission / price) * 100).toFixed(1)
      
      console.log(`${m.name}:`)
      console.log(`   Harga: Rp ${price.toLocaleString('id-ID')}`)
      console.log(`   Komisi: Flat Rp ${commission.toLocaleString('id-ID')} (${percentage}%)`)
      console.log('')
    })
    
    console.log('🎯 KOMISI SUDAH DIKEMBALIKAN KE NILAI ASLI ANDA!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

restoreOriginalCommission()