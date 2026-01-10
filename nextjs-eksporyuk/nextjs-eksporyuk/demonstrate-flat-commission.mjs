import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function demonstrateFlatCommission() {
  console.log('💡 DEMONSTRASI SISTEM KOMISI FLAT YANG DITENTUKAN ADMIN\n')
  
  try {
    console.log('📋 KONSEP KOMISI FLAT:')
    console.log('   Komisi FLAT = Nominal tetap untuk setiap penjualan')
    console.log('   Tidak bergantung pada harga produk/membership')
    console.log('   Admin bisa set berbeda-beda untuk setiap item')
    console.log('')
    
    console.log('🎯 CONTOH PENGATURAN KOMISI FLAT OLEH ADMIN:')
    console.log('   1. Membership Premium: Flat Rp 500.000 (40% dari harga Rp 1.250.000)')
    console.log('   2. Membership Standard: Flat Rp 400.000 (25% dari harga Rp 1.600.000)')
    console.log('   3. Membership Basic: Flat Rp 300.000 (20% dari harga Rp 1.500.000)')
    console.log('')
    
    // Ambil data membership saat ini
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        affiliateCommissionRate: true,
        commissionType: true
      }
    })
    
    console.log('💰 REKOMENDASI KOMISI FLAT UNTUK MEMBERSHIP SAAT INI:')
    memberships.forEach((m, index) => {
      const price = parseFloat(m.price.toString())
      const suggestedFlat40 = Math.round(price * 0.40)
      const suggestedFlat25 = Math.round(price * 0.25)
      const suggestedFlat20 = Math.round(price * 0.20)
      
      console.log(`   ${index + 1}. ${m.name}:`)
      console.log(`      Harga: Rp ${price.toLocaleString('id-ID')}`)
      console.log(`      📈 Opsi Komisi FLAT:`)
      console.log(`         - 40%: Flat Rp ${suggestedFlat40.toLocaleString('id-ID')}`)
      console.log(`         - 25%: Flat Rp ${suggestedFlat25.toLocaleString('id-ID')}`)
      console.log(`         - 20%: Flat Rp ${suggestedFlat20.toLocaleString('id-ID')}`)
      console.log('')
    })
    
    console.log('⚙️  CARA ADMIN MENGATUR KOMISI FLAT:')
    console.log('   1. Login sebagai Admin')
    console.log('   2. Masuk ke Management > Membership/Product')
    console.log('   3. Edit item yang mau diatur komisi')
    console.log('   4. Set commissionType = "FLAT"')
    console.log('   5. Set affiliateCommissionRate = nominal dalam rupiah')
    console.log('')
    
    console.log('💡 KEUNTUNGAN KOMISI FLAT:')
    console.log('   ✅ Affiliate tahu pasti berapa komisi yang didapat')
    console.log('   ✅ Admin kontrol penuh atas biaya komisi')
    console.log('   ✅ Mudah perhitungan dan pelaporan')
    console.log('   ✅ Bisa disesuaikan per produk/membership')
    console.log('')
    
    console.log('🔄 CONTOH UPDATE DATA UNTUK KOMISI FLAT:')
    console.log('   SQL Query untuk set komisi flat:')
    console.log('   UPDATE "Membership" SET ')
    console.log('     "commissionType" = \'FLAT\',')
    console.log('     "affiliateCommissionRate" = 500000')
    console.log('   WHERE name = \'Paket Lifetime\';')
    console.log('')
    
    // Cek apakah ada admin panel atau API untuk update
    console.log('🎮 IMPLEMENTASI YANG SUDAH ADA:')
    console.log('   ✅ Database schema mendukung FLAT & PERCENTAGE')
    console.log('   ✅ Enum CommissionType: FLAT, PERCENTAGE')
    console.log('   ✅ Field affiliateCommissionRate di semua model')
    console.log('   ✅ API affiliate links sudah support kedua tipe')
    console.log('')
    
    console.log('📝 YANG PERLU DITAMBAH (OPSIONAL):')
    console.log('   - Admin panel untuk edit komisi secara visual')
    console.log('   - Bulk update komisi untuk banyak item sekaligus')
    console.log('   - History log perubahan komisi')
    console.log('   - Preview perhitungan komisi sebelum disimpan')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

demonstrateFlatCommission()