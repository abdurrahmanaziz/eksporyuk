import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ESSENTIAL_TEMPLATES = [
  {
    name: 'Password Reset Request',
    slug: 'password-reset-request',
    description: 'Email untuk reset password dengan link',
    category: 'AUTHENTICATION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Reset Password Anda - {site.name}',
    content: `Halo {user.name},

Kami menerima permintaan untuk mereset password akun Anda.

Jika Anda yang meminta reset password, klik tombol di bawah ini:

Link ini berlaku selama 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.`,
    ctaText: 'Reset Password',
    ctaLink: '{reset.link}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["password", "reset", "security"],
    variables: {
      security_level: 'high',
      expiry_time: '1_hour'
    }
  },
  {
    name: 'Email Verification',
    slug: 'email-verification',
    description: 'Email verifikasi untuk user baru',
    category: 'AUTHENTICATION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Verifikasi Email Anda - {site.name}',
    content: `Halo {user.name},

Terima kasih telah mendaftar di {site.name}!

Untuk mengaktifkan akun Anda, silakan klik tombol verifikasi di bawah ini:

Link verifikasi ini berlaku selama 24 jam.`,
    ctaText: 'Verifikasi Email',
    ctaLink: '{verification.link}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["verification", "onboarding", "email"],
    variables: {
      verification_required: true,
      expiry_time: '24_hours'
    }
  },
  {
    name: 'Membership Upgrade Success',
    slug: 'membership-upgrade-success',
    description: 'Konfirmasi upgrade membership berhasil',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    roleTarget: 'MEMBER',
    subject: 'Selamat! Upgrade ke {membership.newPlan} Berhasil 🎉',
    content: `Halo {user.name},

Selamat! Membership Anda telah berhasil diupgrade.

Detail Upgrade:
• Plan Lama: {membership.oldPlan}
• Plan Baru: {membership.newPlan}
• Biaya: {membership.amount}
• Berlaku Hingga: {membership.expiryDate}

Fitur Baru yang Tersedia:
• Akses penuh ke semua kursus premium
• Konsultasi 1-on-1 dengan mentor
• Sertifikat resmi
• Akses grup eksklusif

Terima kasih atas kepercayaan Anda!`,
    ctaText: 'Lihat Dashboard',
    ctaLink: '{links.dashboard}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["membership", "upgrade", "premium"],
    variables: {
      notification_type: 'upgrade_success'
    }
  },
  {
    name: 'Membership Expiry Reminder',
    slug: 'membership-expiry-reminder',
    description: 'Pengingat membership akan segera expired',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    roleTarget: 'MEMBER',
    subject: 'Reminder: Membership Anda Akan Berakhir dalam {expiry.days} Hari',
    content: `Halo {user.name},

Membership {membership.plan} Anda akan berakhir dalam {expiry.days} hari.

Detail Membership:
• Plan: {membership.plan}
• Tanggal Berakhir: {membership.expiryDate}
• Status: {membership.status}

Perpanjang sekarang untuk terus menikmati:
• Akses penuh ke semua kursus
• Konsultasi dengan mentor
• Sertifikat resmi
• Dukungan prioritas

Jangan lewatkan kesempatan ini!`,
    ctaText: 'Perpanjang Sekarang',
    ctaLink: '{links.renew}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["membership", "expiry", "reminder"],
    variables: {
      reminder_days: 'dynamic',
      auto_send: true
    }
  },
  {
    name: 'Affiliate Registration Approved',
    slug: 'affiliate-registration-approved',
    description: 'Notifikasi pendaftaran affiliate disetujui',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: 'Selamat! Anda Telah Menjadi Affiliate Partner Kami 🎉',
    content: `Halo {user.name},

Selamat! Pendaftaran Anda sebagai affiliate partner telah disetujui.

Detail Affiliate:
• Kode Affiliate: {affiliate.code}
• Komisi: {affiliate.commissionRate}%
• Link Referral: {affiliate.referralLink}

Cara Kerja:
1. Bagikan link referral Anda
2. Dapatkan komisi setiap ada pembelian
3. Withdraw kapan saja (min. Rp 100.000)

Mulai share link Anda sekarang dan raih penghasilan!`,
    ctaText: 'Mulai Promosi',
    ctaLink: '{links.affiliate}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["affiliate", "approval", "registration"],
    variables: {
      approval_status: 'approved'
    }
  },
  {
    name: 'Withdrawal Request Approved',
    slug: 'withdrawal-request-approved',
    description: 'Konfirmasi penarikan saldo disetujui',
    category: 'WALLET',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: 'Penarikan Saldo Rp {withdrawal.amount} Diproses ✅',
    content: `Halo {user.name},

Permintaan penarikan saldo Anda telah disetujui dan sedang diproses.

Detail Penarikan:
• Jumlah: {withdrawal.amount}
• Metode: {withdrawal.method}
• Nomor Rekening: {withdrawal.accountNumber}
• Nama Penerima: {withdrawal.accountName}
• Tanggal Request: {withdrawal.requestDate}
• Status: {withdrawal.status}

Dana akan masuk ke rekening Anda dalam 1-3 hari kerja.

Sisa Saldo: {wallet.balance}`,
    ctaText: 'Lihat History',
    ctaLink: '{links.wallet}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["withdrawal", "wallet", "payment"],
    variables: {
      payment_status: 'processing'
    }
  },
  {
    name: 'New Course Enrollment',
    slug: 'new-course-enrollment',
    description: 'Konfirmasi pendaftaran kursus baru',
    category: 'COURSE',
    type: 'EMAIL',
    roleTarget: 'MEMBER',
    subject: 'Selamat! Anda Terdaftar di Kursus "{course.title}" 📚',
    content: `Halo {user.name},

Selamat! Anda telah berhasil mendaftar di kursus:

"{course.title}"

Detail Kursus:
• Instruktur: {course.instructor}
• Durasi: {course.duration}
• Level: {course.level}
• Total Materi: {course.totalLessons} lessons
• Sertifikat: {course.certificate}

Mulai belajar sekarang dan raih tujuan Anda!`,
    ctaText: 'Mulai Belajar',
    ctaLink: '{course.link}',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["course", "enrollment", "learning"],
    variables: {
      enrollment_type: 'new'
    }
  },
  {
    name: 'Payment Failed Notification',
    slug: 'payment-failed-notification',
    description: 'Notifikasi pembayaran gagal',
    category: 'PAYMENT',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Pembayaran Gagal - {payment.invoiceNumber}',
    content: `Halo {user.name},

Pembayaran Anda tidak dapat diproses.

Detail Transaksi:
• Invoice: {payment.invoiceNumber}
• Jumlah: {payment.amount}
• Metode: {payment.method}
• Status: Gagal
• Alasan: {payment.failureReason}

Silakan coba lagi dengan metode pembayaran lain atau hubungi customer support kami.`,
    ctaText: 'Coba Lagi',
    ctaLink: '{payment.retryLink}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["payment", "failed", "transaction"],
    variables: {
      payment_status: 'failed',
      auto_retry: true
    }
  },
  {
    name: 'Support Ticket Created',
    slug: 'support-ticket-created',
    description: 'Konfirmasi tiket support dibuat',
    category: 'SUPPORT',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Tiket Support #{ticket.number} Telah Dibuat',
    content: `Halo {user.name},

Terima kasih telah menghubungi kami. Tiket support Anda telah dibuat.

Detail Tiket:
• Nomor Tiket: #{ticket.number}
• Kategori: {ticket.category}
• Prioritas: {ticket.priority}
• Status: {ticket.status}
• Dibuat: {ticket.createdAt}

Tim kami akan merespon dalam 1x24 jam.

Pertanyaan Anda:
"{ticket.message}"`,
    ctaText: 'Lihat Tiket',
    ctaLink: '{ticket.link}',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["support", "ticket", "helpdesk"],
    variables: {
      response_time: '24_hours'
    }
  },
  {
    name: 'Invoice Receipt',
    slug: 'invoice-receipt',
    description: 'Tanda terima pembayaran/invoice',
    category: 'PAYMENT',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Invoice #{invoice.number} - {site.name}',
    content: `Halo {user.name},

Terima kasih atas pembayaran Anda.

INVOICE #{invoice.number}

Tanggal: {invoice.date}
Status: {invoice.status}

Detail Pembelian:
• Item: {invoice.items}
• Subtotal: {invoice.subtotal}
• Diskon: {invoice.discount}
• Total: {invoice.total}

Metode Pembayaran: {invoice.paymentMethod}

Jika ada pertanyaan, hubungi tim support kami.`,
    ctaText: 'Download Invoice',
    ctaLink: '{invoice.downloadLink}',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["invoice", "receipt", "payment"],
    variables: {
      auto_send: true,
      include_pdf: true
    }
  }
]

async function createEssentialTemplates() {
  console.log('🌱 Creating essential email templates...\n')

  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }

    console.log(`👤 Using admin user: ${adminUser.email}\n`)

    let created = 0
    let skipped = 0

    for (const template of ESSENTIAL_TEMPLATES) {
      // Check if template already exists
      const existing = await prisma.brandedTemplate.findFirst({
        where: { slug: template.slug }
      })

      if (existing) {
        console.log(`⏭️  Template "${template.name}" already exists, skipping...`)
        skipped++
        continue
      }

      // Create the template
      await prisma.brandedTemplate.create({
        data: {
          ...template,
          createdBy: adminUser.id
        }
      })

      console.log(`✅ Created: "${template.name}" (${template.category}/${template.type})`)
      created++
    }

    console.log(`\n🎉 Done! Created ${created} new templates, skipped ${skipped} existing templates.`)

    // Show summary
    const total = await prisma.brandedTemplate.count()
    console.log(`\n📊 Total templates in database: ${total}`)

  } catch (error) {
    console.error('❌ Error creating templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createEssentialTemplates()
