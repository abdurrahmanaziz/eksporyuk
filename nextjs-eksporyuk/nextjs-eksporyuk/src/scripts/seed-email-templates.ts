import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_TEMPLATES = [
  {
    name: 'Email Verifikasi User',
    slug: 'email-verification-user',
    description: 'Template untuk verifikasi email user baru',
    category: 'verification',
    type: 'email_verification',
    roleTarget: null,
    subject: '🎉 Verifikasi Email Anda - EksporYuk',
    content: `Halo {{name}}! 👋

Terima kasih telah mendaftar di EksporYuk - Platform pembelajaran ekspor terpercaya di Indonesia!

Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini.

Jika Anda tidak merasa mendaftar di EksporYuk, abaikan email ini.

Salam hangat,
Tim EksporYuk`,
    ctaText: 'Verifikasi Email Sekarang',
    ctaLink: '{{verification_url}}',
    isDefault: true,
    isActive: true,
    isSystem: true,
    tags: ['verification', 'onboarding'],
    variables: {
      'name': 'Nama user',
      'email': 'Email user',
      'verification_url': 'Link verifikasi email',
      'company_name': 'Nama perusahaan',
      'app_url': 'URL aplikasi'
    }
  },
  {
    name: 'Welcome Email Member Baru',
    slug: 'welcome-email-member',
    description: 'Email selamat datang untuk member baru',
    category: 'welcome',
    type: 'welcome_email',
    roleTarget: 'MEMBER_FREE',
    subject: '🎊 Selamat Datang di EksporYuk, {{name}}!',
    content: `Selamat datang di EksporYuk, {{name}}! 🎉

Terima kasih telah bergabung dengan komunitas eksportir terbesar di Indonesia. Anda sekarang dapat mengakses:

✅ Kursus ekspor dari mentor berpengalaman
✅ Database buyer dan supplier global
✅ Komunitas eksportir aktif
✅ Template dokumen ekspor lengkap

Mari mulai perjalanan ekspor Anda bersama kami!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Mulai Belajar Sekarang',
    ctaLink: '{{app_url}}/dashboard',
    isDefault: true,
    isActive: true,
    isSystem: true,
    tags: ['welcome', 'onboarding'],
    variables: {
      'name': 'Nama user',
      'email': 'Email user',
      'membership_name': 'Nama membership',
      'app_url': 'URL aplikasi'
    }
  },
  {
    name: 'Konfirmasi Pembayaran',
    slug: 'payment-confirmation',
    description: 'Email konfirmasi pembayaran berhasil',
    category: 'payment',
    type: 'payment_confirmation',
    roleTarget: null,
    subject: '✅ Pembayaran Berhasil - Invoice {{invoice_number}}',
    content: `Halo {{name}},

Pembayaran Anda telah berhasil diproses! 🎉

Detail Pembayaran:
• Invoice: {{invoice_number}}
• Paket: {{membership_name}}
• Total: Rp {{amount}}
• Tanggal: {{payment_date}}

Akun Anda sudah diaktifkan dan siap digunakan. Selamat belajar!

Terima kasih telah memilih EksporYuk.

Salam,
Tim EksporYuk`,
    ctaText: 'Akses Dashboard Anda',
    ctaLink: '{{app_url}}/dashboard',
    isDefault: true,
    isActive: true,
    isSystem: true,
    tags: ['payment', 'confirmation'],
    variables: {
      'name': 'Nama user',
      'invoice_number': 'Nomor invoice',
      'membership_name': 'Nama paket membership',
      'amount': 'Total pembayaran',
      'payment_date': 'Tanggal pembayaran',
      'app_url': 'URL aplikasi'
    }
  },
  {
    name: 'Reset Password',
    slug: 'password-reset',
    description: 'Email reset password user',
    category: 'system',
    type: 'password_reset',
    roleTarget: null,
    subject: '🔐 Reset Password - EksporYuk',
    content: `Halo {{name}},

Anda telah meminta untuk reset password akun EksporYuk Anda.

Klik tombol di bawah ini untuk membuat password baru:

Link ini akan kadaluarsa dalam 1 jam untuk keamanan akun Anda.

Jika Anda tidak merasa meminta reset password, abaikan email ini.

Salam,
Tim EksporYuk`,
    ctaText: 'Reset Password Sekarang',
    ctaLink: '{{reset_url}}',
    isDefault: true,
    isActive: true,
    isSystem: true,
    tags: ['password', 'security'],
    variables: {
      'name': 'Nama user',
      'email': 'Email user',
      'reset_url': 'Link reset password',
      'app_url': 'URL aplikasi'
    }
  },
  {
    name: 'Newsletter Mingguan',
    slug: 'newsletter-weekly',
    description: 'Newsletter mingguan untuk member',
    category: 'marketing',
    type: 'newsletter',
    roleTarget: null,
    subject: '📰 Newsletter EksporYuk - {{week_date}}',
    content: `Halo {{name}},

Berikut update mingguan dari EksporYuk:

📚 Kursus Baru:
{{new_courses}}

📊 Tips Ekspor Minggu Ini:
{{weekly_tips}}

🏆 Sukses Story Member:
{{success_stories}}

💡 Event Mendatang:
{{upcoming_events}}

Tetap semangat belajar dan jangan lupa praktik!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Lihat Update Lengkap',
    ctaLink: '{{app_url}}/newsletter',
    isDefault: true,
    isActive: true,
    isSystem: false,
    tags: ['newsletter', 'marketing'],
    variables: {
      'name': 'Nama user',
      'week_date': 'Tanggal minggu',
      'new_courses': 'Daftar kursus baru',
      'weekly_tips': 'Tips ekspor mingguan',
      'success_stories': 'Cerita sukses member',
      'upcoming_events': 'Event yang akan datang',
      'app_url': 'URL aplikasi'
    }
  },
  {
    name: 'Notifikasi Kursus Baru',
    slug: 'course-enrollment-notification',
    description: 'Notifikasi saat user mendaftar kursus',
    category: 'notification',
    type: 'course_enrollment',
    roleTarget: null,
    subject: '📚 Selamat! Anda Terdaftar di {{course_name}}',
    content: `Halo {{name}},

Selamat! Anda telah berhasil mendaftar di kursus:

📚 {{course_name}}
👨‍🏫 Mentor: {{mentor_name}}
📅 Mulai: {{start_date}}
⏰ Durasi: {{duration}}

Kursus akan dimulai sesuai jadwal. Pastikan Anda login untuk mengakses materi pembelajaran.

Semangat belajar!

Salam,
Tim EksporYuk`,
    ctaText: 'Mulai Belajar Sekarang',
    ctaLink: '{{app_url}}/courses/{{course_id}}',
    isDefault: true,
    isActive: true,
    isSystem: true,
    tags: ['course', 'enrollment'],
    variables: {
      'name': 'Nama user',
      'course_name': 'Nama kursus',
      'mentor_name': 'Nama mentor',
      'start_date': 'Tanggal mulai',
      'duration': 'Durasi kursus',
      'course_id': 'ID kursus',
      'app_url': 'URL aplikasi'
    }
  }
]

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...')

  for (const templateData of DEFAULT_TEMPLATES) {
    try {
      // Check if template already exists
      const existing = await prisma.brandedTemplate.findFirst({
        where: { type: templateData.type }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${templateData.name} - already exists`)
        continue
      }

      // Create new template
      await prisma.brandedTemplate.create({
        data: templateData
      })

      console.log(`✅ Created template: ${templateData.name}`)
    } catch (error) {
      console.error(`❌ Failed to create template ${templateData.name}:`, error)
    }
  }

  console.log('🎉 Email templates seeding completed!')
}

async function main() {
  try {
    await seedEmailTemplates()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export default main