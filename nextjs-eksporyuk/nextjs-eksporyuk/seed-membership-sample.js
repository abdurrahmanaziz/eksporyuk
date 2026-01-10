const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding sample membership data...')

  // Create sample membership plan
  const membership = await prisma.membership.create({
    data: {
      name: 'Pro Membership',
      slug: 'pro',
      description: 'Paket lengkap untuk eksportir profesional dengan akses premium ke semua fitur',
      duration: 'SIX_MONTHS', // Required field
      price: 688333, // Base price (6 bulan)
      originalPrice: 1074000,
      discount: 35,
      formLogo: 'https://placehold.co/200x200/6366f1/white?text=PRO',
      formBanner: 'https://placehold.co/1200x400/6366f1/white?text=Pro+Membership',
      salesPageUrl: 'https://eksporyuk.com/membership/pro',
      affiliateCommissionRate: 0.30,
      isActive: true,
      isPopular: true,
      features: JSON.stringify([
        {
          duration: 'ONE_MONTH',
          label: '1 Bulan',
          price: 179000,
          pricePerMonth: 179000,
          benefits: [
            'Akses grup VIP Eksportir',
            'Akses 5 kelas premium',
            'Email support',
            'Database buyer (20 akses/bulan)',
            'Database supplier (20 akses/bulan)'
          ],
          badge: '',
          isPopular: false
        },
        {
          duration: 'THREE_MONTHS',
          label: '3 Bulan',
          price: 456333,
          pricePerMonth: 152111,
          benefits: [
            'Akses semua grup komunitas',
            'Akses 15 kelas premium',
            'WhatsApp support',
            'Database buyer (50 akses/bulan)',
            'Database supplier (50 akses/bulan)',
            'Database forwarder (20 akses)',
            'Download CSV'
          ],
          badge: 'Hemat 15%',
          isPopular: false
        },
        {
          duration: 'SIX_MONTHS',
          label: '6 Bulan',
          price: 688333,
          pricePerMonth: 114722,
          benefits: [
            'Akses semua grup VIP',
            'Akses semua kelas & webinar',
            'Priority WhatsApp support',
            'Database buyer (100 akses/bulan)',
            'Database supplier (100 akses/bulan)',
            'Database forwarder (unlimited)',
            'Download CSV + API access',
            'Template dokumen ekspor',
            'Bonus ebook ekspor',
            'Member directory access'
          ],
          badge: 'Hemat 35%',
          isPopular: true
        },
        {
          duration: 'TWELVE_MONTHS',
          label: '12 Bulan',
          price: 980000,
          pricePerMonth: 81667,
          benefits: [
            'Semua benefit 6 bulan',
            'Unlimited database access',
            'Priority listing di member directory',
            'Verified badge',
            'Free 1 konsultasi ekspor',
            'Free 1 webinar eksklusif',
            'Bonus 2 kelas baru setiap bulan',
            'Akses early bird produk baru',
            'Diskon 20% untuk event berbayar',
            'Certificate of completion',
            'LinkedIn recommendation'
          ],
          badge: 'Hemat 54% - Best Value!',
          isPopular: false
        }
      ]),
      reminders: JSON.stringify([
        {
          title: 'Selamat Datang di Pro Membership',
          message: `Halo {user_name}! 🎉

Selamat bergabung di {membership_name}!

Berikut akses lengkap Anda:
✅ Semua grup VIP
✅ Semua kelas premium
✅ Database buyer & supplier
✅ WhatsApp support: {support_wa}

Membership aktif hingga: {expiry_date}

Butuh bantuan? Hubungi kami di {support_wa}

Salam sukses,
Tim EksporYuk`
        },
        {
          title: 'Reminder: Membership Akan Berakhir',
          message: `Halo {user_name},

Membership {membership_name} Anda akan berakhir dalam {days_left} hari.

📅 Tanggal berakhir: {expiry_date}

Jangan sampai kehilangan akses premium Anda!

Perpanjang sekarang dengan diskon khusus:
{renewal_link}

Ada pertanyaan? Chat kami: {support_wa}

Salam,
Tim EksporYuk`
        },
        {
          title: 'Terima Kasih Telah Menjadi Member',
          message: `Halo {user_name},

Terima kasih sudah menjadi bagian dari {membership_name}.

Kami senang bisa membantu perjalanan ekspor Anda! 🚀

Ingin upgrade atau perpanjang membership?
{renewal_link}

Tetap terhubung dengan kami:
📱 WhatsApp: {support_wa}

Sukses selalu,
Tim EksporYuk`
        }
      ])
    }
  })

  console.log('✅ Sample membership created:', membership.slug)

  // Create sample coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: 'WELCOME20',
      description: 'Diskon 20% untuk member baru',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      isActive: true,
      usageLimit: 100,
      usageCount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      membershipIds: JSON.stringify([membership.id])
    }
  })

  console.log('✅ Sample coupon created:', coupon.code)

  console.log('\n📋 SAMPLE LINKS GENERATED:\n')
  
  console.log('🔗 MEMBERSHIP LINKS:')
  console.log('-------------------')
  console.log(`Admin Panel:        http://localhost:3000/admin/membership-plans`)
  console.log(`Checkout Page:      http://localhost:3000/checkout/${membership.slug}`)
  console.log(`Salespage (Public): ${membership.salesPageUrl}`)
  
  console.log('\n🔗 API ENDPOINTS:')
  console.log('-------------------')
  console.log(`Get Plan Detail:    GET  http://localhost:3000/api/membership-plans/${membership.slug}`)
  console.log(`Validate Coupon:    POST http://localhost:3000/api/coupons/validate`)
  console.log(`Process Checkout:   POST http://localhost:3000/api/checkout/membership`)
  
  console.log('\n💳 TEST CHECKOUT FLOW:')
  console.log('-------------------')
  console.log('1. Buka checkout page:')
  console.log(`   http://localhost:3000/checkout/${membership.slug}`)
  console.log('\n2. Pilih paket (misal: 6 Bulan - Paling Laris)')
  console.log('\n3. Masukkan kupon: WELCOME20 (diskon 20%)')
  console.log('\n4. Isi data:')
  console.log('   - Nama: Test User')
  console.log('   - Email: test@example.com')
  console.log('   - WhatsApp: 081234567890')
  console.log('   - Password: testpass123')
  console.log('\n5. Klik "Beli" untuk checkout')
  
  console.log('\n📊 PRICING EXAMPLES:')
  console.log('-------------------')
  const prices = JSON.parse(membership.features)
  prices.forEach((price, index) => {
    console.log(`\n${index + 1}. ${price.label}${price.isPopular ? ' ⭐ PALING LARIS' : ''}`)
    console.log(`   Harga: Rp ${price.price.toLocaleString('id-ID')}`)
    if (price.pricePerMonth) {
      console.log(`   Per bulan: Rp ${price.pricePerMonth.toLocaleString('id-ID')}`)
    }
    if (price.badge) {
      console.log(`   Badge: ${price.badge}`)
    }
    console.log(`   Benefits: ${price.benefits.length} items`)
    price.benefits.forEach(benefit => {
      console.log(`   ✓ ${benefit}`)
    })
  })
  
  console.log('\n🎟️ AVAILABLE COUPONS:')
  console.log('-------------------')
  console.log(`Code: ${coupon.code}`)
  console.log(`Discount: ${coupon.discountValue}%`)
  console.log(`Valid until: ${coupon.validUntil.toLocaleDateString('id-ID')}`)
  console.log(`Usage: ${coupon.usageCount}/${coupon.usageLimit}`)
  
  console.log('\n💰 PRICE CALCULATION WITH COUPON:')
  console.log('-------------------')
  const selectedPrice = prices[2] // 6 bulan
  const originalPrice = selectedPrice.price
  const discountAmount = (originalPrice * coupon.discountValue) / 100
  const finalPrice = originalPrice - discountAmount
  
  console.log(`Original: Rp ${originalPrice.toLocaleString('id-ID')}`)
  console.log(`Discount (${coupon.discountValue}%): -Rp ${discountAmount.toLocaleString('id-ID')}`)
  console.log(`Final Price: Rp ${finalPrice.toLocaleString('id-ID')}`)
  
  console.log('\n✅ Seeding completed!')
  console.log('\n🚀 Next Steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Login as admin')
  console.log('3. Visit: http://localhost:3000/admin/membership-plans')
  console.log('4. Test checkout: http://localhost:3000/checkout/pro')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
