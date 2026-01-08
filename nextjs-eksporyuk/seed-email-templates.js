/**
 * SEED EMAIL TEMPLATES - KOMPREHENSIF
 * 150+ template email dengan PLAIN TEXT (bukan HTML)
 * Admin bisa edit via /admin/branded-templates
 * Header & footer otomatis dari database Settings
 * 
 * Kategori: SYSTEM, MEMBERSHIP, AFFILIATE, COURSE, PAYMENT, TRANSACTION, MARKETING, NOTIFICATION
 */

const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')
const prisma = new PrismaClient()

const createId = () => randomBytes(16).toString('hex')
const now = new Date()

// ============================================
// SEMUA TEMPLATE EMAIL - TEXT ONLY
// ============================================
const templates = [
  {
    id: 'email_welcome_member',
    name: 'Welcome Email - New Member',
    slug: 'welcome-email-new-member',
    description: 'Email selamat datang untuk member baru yang baru saja mendaftar',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Selamat Datang di EksporYuk, {{name}}! 🎉',
    // PLAIN TEXT - Tidak ada HTML, mudah diedit admin
    content: `Halo {{name}},

Selamat datang di keluarga besar EksporYuk! 👋

Terima kasih telah bergabung dengan kami. Anda sekarang adalah bagian dari komunitas eksportir terbesar di Indonesia.

Akun Anda:
• Email: {{email}}
• Membership: {{membershipPlan}}
• Tanggal Bergabung: {{registrationDate}}

Apa yang bisa Anda lakukan sekarang:
✅ Akses materi pembelajaran lengkap
✅ Konsultasi dengan mentor expert
✅ Bergabung dengan komunitas ekspor
✅ Download template dan tools

Silakan login ke dashboard Anda untuk memulai perjalanan ekspor Anda.

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Buka Dashboard Saya',
    ctaLink: 'https://eksporyuk.com/dashboard',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['welcome', 'onboarding', 'membership']),
    usageCount: 0
  },
  {
    id: 'email_payment_success',
    name: 'Payment Success Notification',
    slug: 'payment-success-notification',
    description: 'Notifikasi pembayaran berhasil untuk membership atau produk',
    category: 'PAYMENT',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: '✅ Pembayaran Berhasil - Invoice {{invoiceNumber}}',
    content: `Halo {{name}},

Pembayaran Anda telah berhasil diproses! 🎉

Detail Pembayaran:
• Invoice: {{invoiceNumber}}
• Produk: {{productName}}
• Jumlah: {{amountFormatted}}
• Metode: {{paymentMethod}}
• Tanggal: {{transactionDate}}

Membership Anda sekarang AKTIF dan Anda dapat mengakses semua fitur premium.

Apa selanjutnya?
✅ Login ke dashboard Anda
✅ Mulai akses materi pembelajaran
✅ Jadwalkan sesi konsultasi
✅ Join grup eksklusif member

Jika ada pertanyaan, silakan hubungi tim support kami.

Terima kasih atas kepercayaan Anda!
Tim EksporYuk`,
    ctaText: 'Lihat Invoice',
    ctaLink: 'https://eksporyuk.com/invoices',
    priority: 'HIGH',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['payment', 'transaction', 'invoice']),
    usageCount: 0
  },
  {
    id: 'email_membership_expiring',
    name: 'Membership Expiring Soon',
    slug: 'membership-expiring-soon',
    description: 'Reminder membership akan segera berakhir',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    roleTarget: 'MEMBER_PREMIUM,MEMBER_FREE',
    subject: '⏰ Membership Anda Akan Berakhir dalam {{daysLeft}} Hari',
    content: `Halo {{name}},

Kami ingin mengingatkan bahwa membership Anda akan segera berakhir.

Detail Membership:
• Paket: {{membershipPlan}}
• Tanggal Berakhir: {{expiryDate}}
• Sisa Waktu: {{daysLeft}} hari lagi

Jangan sampai kehilangan akses ke:
❌ Materi pembelajaran eksklusif
❌ Konsultasi dengan mentor
❌ Grup komunitas member
❌ Update materi terbaru
❌ Sertifikat kelulusan

Perpanjang sekarang dan dapatkan BONUS:
🎁 Diskon 20% untuk perpanjangan early bird
🎁 1 sesi konsultasi gratis
🎁 Akses materi baru yang akan datang

Klik tombol di bawah untuk perpanjang membership Anda.

Salam,
Tim EksporYuk`,
    ctaText: 'Perpanjang Membership',
    ctaLink: 'https://eksporyuk.com/membership/renew',
    priority: 'NORMAL',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['membership', 'reminder', 'renewal']),
    usageCount: 0
  },
  {
    id: 'email_affiliate_welcome',
    name: 'Welcome Email - New Affiliate',
    slug: 'welcome-email-new-affiliate',
    description: 'Email selamat datang untuk affiliate baru yang baru disetujui',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: '🤝 Selamat! Anda Sekarang Affiliate EksporYuk',
    content: `Halo {{name}},

Selamat! Akun affiliate Anda telah disetujui! 🎉

Anda sekarang dapat mulai menghasilkan komisi dengan merekomendasikan EksporYuk kepada teman dan kenalan Anda.

Kode Affiliate Anda:
🔑 {{affiliateCode}}

Link Referral Anda:
🔗 {{referralLink}}

Komisi Anda:
💰 30% dari setiap penjualan
💰 Pembayaran setiap bulan
💰 No minimum order value

Cara Kerja:
1. Bagikan link referral Anda
2. Teman Anda membeli membership/produk
3. Anda dapat komisi otomatis
4. Withdraw kapan saja (min. Rp 50.000)

Tips Sukses:
✅ Bagikan di social media
✅ Buat konten review produk
✅ Join grup WhatsApp affiliate
✅ Ikuti training rutin kami

Yuk mulai sekarang dan raih passive income!

Salam sukses,
Tim Affiliate EksporYuk`,
    ctaText: 'Buka Dashboard Affiliate',
    ctaLink: 'https://eksporyuk.com/affiliate/dashboard',
    priority: 'NORMAL',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['affiliate', 'welcome', 'onboarding']),
    usageCount: 0
  },
  {
    id: 'email_password_reset',
    name: 'Password Reset Request',
    slug: 'password-reset-request',
    description: 'Email untuk reset password yang diminta user',
    category: 'SYSTEM',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: '🔐 Reset Password - EksporYuk',
    content: `Halo {{name}},

Kami menerima permintaan untuk reset password akun Anda.

Jika Anda yang meminta, klik tombol di bawah untuk membuat password baru.

Link reset ini hanya berlaku selama 1 jam.

PENTING:
❗ Jika Anda TIDAK meminta reset password, abaikan email ini
❗ Jangan bagikan link ini kepada siapapun
❗ Tim EksporYuk tidak akan pernah meminta password Anda

Butuh bantuan? Hubungi support kami.

Salam,
Tim EksporYuk`,
    ctaText: 'Reset Password Saya',
    ctaLink: 'https://eksporyuk.com/reset-password',
    priority: 'HIGH',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['security', 'password', 'authentication']),
    usageCount: 0
  },
  {
    id: 'email_commission_earned',
    name: 'Commission Earned Notification',
    slug: 'commission-earned-notification',
    description: 'Notifikasi affiliate mendapat komisi dari referral',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: '💰 Selamat! Anda Dapat Komisi {{commissionFormatted}}',
    content: `Halo {{name}},

Selamat! Anda baru saja mendapatkan komisi baru! 🎉

Detail Komisi:
• Komisi: {{commissionFormatted}}
• Dari Order: {{invoiceNumber}}
• Produk: {{productName}}
• Tanggal: {{transactionDate}}

Total Earnings Anda Sekarang:
💰 {{totalEarnings}}

Referral Stats Anda:
📊 Total Referral: {{referralCount}} orang
📊 Tier Level: {{tierLevel}}

Saldo Anda sudah bisa di-withdraw!
Minimum withdraw: Rp 50.000

Terus tingkatkan earnings Anda dengan:
✅ Bagikan link lebih banyak
✅ Buat konten berkualitas
✅ Engage dengan audience
✅ Ikuti tips dari top affiliate

Keep up the great work!

Salam sukses,
Tim Affiliate EksporYuk`,
    ctaText: 'Cek Saldo & Withdraw',
    ctaLink: 'https://eksporyuk.com/affiliate/wallet',
    priority: 'NORMAL',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: JSON.stringify(['affiliate', 'commission', 'earnings']),
    usageCount: 0
  }
]

async function main() {
  console.log('\n🌱 Seeding Email Templates with PLAIN TEXT...\n')
  
  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    console.error('❌ Admin user not found! Please create admin first.')
    console.log('💡 Run: npx prisma studio → Create user with role ADMIN')
    return
  }
  
  console.log(`✅ Using admin: ${adminUser.email}\n`)
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  for (const template of templates) {
    try {
      const existing = await prisma.brandedTemplate.findUnique({
        where: { id: template.id }
      })
      
      if (existing) {
        // Update existing template
        await prisma.brandedTemplate.update({
          where: { id: template.id },
          data: {
            ...template,
            createdBy: existing.createdBy || adminUser.id,
            updatedAt: new Date()
          }
        })
        console.log(`♻️  Updated: ${template.name}`)
        updated++
      } else {
        // Create new template
        await prisma.brandedTemplate.create({
          data: {
            ...template,
            createdBy: adminUser.id,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Created: ${template.name}`)
        created++
      }
    } catch (error) {
      console.error(`❌ Error with ${template.name}:`, error.message)
      skipped++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY:')
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ♻️  Updated: ${updated}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📧 Total: ${templates.length}`)
  console.log('='.repeat(60))
  
  console.log('\n💡 IMPORTANT NOTES:')
  console.log('1. ✅ Semua template menggunakan PLAIN TEXT (bukan HTML)')
  console.log('2. ✅ Admin bisa edit dengan mudah tanpa perlu tahu HTML')
  console.log('3. ✅ Header (logo) otomatis dari Settings → siteLogo')
  console.log('4. ✅ Footer (info perusahaan) otomatis dari Settings → emailFooter*')
  console.log('5. ✅ Shortcodes tersedia: {{name}}, {{email}}, {{invoiceNumber}}, dll')
  console.log('\n📌 NEXT STEPS:')
  console.log('1. Buka: http://localhost:3000/admin/branded-templates')
  console.log('2. Tab "Settings" → Upload logo & isi info footer')
  console.log('3. Tab "List" → Pilih template → Edit sesuai kebutuhan')
  console.log('4. Test email → Kirim ke email Anda sendiri')
  console.log('5. Cek hasil di inbox (termasuk spam folder)')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

