import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SAMPLE_TEMPLATES = [
  {
    name: 'Welcome Email - New Member',
    slug: 'welcome-email-new-member',
    description: 'Email selamat datang untuk member baru yang mendaftar',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    roleTarget: 'MEMBER',
    subject: 'Selamat Datang di EksporYuk, {user.name}! 🎉',
    content: `Halo {user.name},

Selamat datang di komunitas EksporYuk! Terima kasih telah bergabung dengan platform ekspor terdepan di Indonesia.

Sebagai member baru, Anda akan mendapatkan:
• Akses ke ribuan produk ekspor berkualitas
• Tutorial lengkap cara memulai bisnis ekspor
• Komunitas eksportir Indonesia yang solid
• Dukungan penuh dari mentor berpengalaman

Membership Level Anda: {user.membershipLevel}
Tanggal Bergabung: {user.joinDate}

Ayo mulai perjalanan ekspor Anda hari ini!`,
    ctaText: 'Mulai Eksplorasi',
    ctaLink: '{links.dashboard}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["welcome", "onboarding", "member"],
    variables: {
      targetAudience: 'new_members',
      timing: 'immediate_after_registration'
    }
  },
  {
    name: 'Affiliate Commission Notification',
    slug: 'affiliate-commission-notification',
    description: 'Notifikasi komisi baru untuk affiliate',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: 'Komisi Baru Masuk! Rp {transaction.amount} 💰',
    content: `Halo {user.name},

Selamat! Anda baru saja mendapatkan komisi dari affiliate program EksporYuk.

Detail Komisi:
• ID Transaksi: {transaction.id}
• Jumlah Komisi: {transaction.amount}
• Tanggal: {transaction.date}
• Status: {transaction.status}

Total Earnings Anda: {user.totalEarnings}
Kode Affiliate: {user.affiliateCode}

Terima kasih telah menjadi bagian dari tim affiliate EksporYuk!`,
    ctaText: 'Lihat Dashboard',
    ctaLink: '{links.affiliate}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["commission", "earnings", "affiliate"],
    variables: {
      commission_type: 'sale_commission',
      notification_trigger: 'commission_earned'
    }
  },
  {
    name: 'Course Completion Certificate',
    slug: 'course-completion-certificate',
    description: 'Email sertifikat selesai kursus',
    category: 'COURSE',
    type: 'EMAIL',
    roleTarget: 'MEMBER',
    subject: 'Selamat! Sertifikat "{course.title}" Siap Diunduh 🎓',
    content: `Halo {user.name},

Selamat! Anda telah berhasil menyelesaikan kursus "{course.title}" dengan hasil yang memuaskan.

Detail Kursus:
• Judul: {course.title}
• Instruktur: {course.instructor}
• Progress: {course.progress}%
• Tanggal Selesai: {current.date}

Sertifikat resmi Anda sudah tersedia dan dapat diunduh melalui link di bawah ini.`,
    ctaText: 'Unduh Sertifikat',
    ctaLink: '{course.certificate}',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["certificate", "course", "completion"],
    variables: {
      certificate_type: 'course_completion',
      delivery_method: 'download_link'
    }
  },
  {
    name: 'Payment Confirmation',
    slug: 'payment-confirmation',
    description: 'Konfirmasi pembayaran berhasil',
    category: 'PAYMENT',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Pembayaran Berhasil - Invoice #{transaction.id}',
    content: `Halo {user.name},

Terima kasih! Pembayaran Anda telah berhasil diproses.

Detail Pembayaran:
• ID Transaksi: {transaction.id}
• Jumlah: {transaction.amount}
• Jenis Transaksi: {transaction.type}
• Tanggal: {transaction.date}
• Status: BERHASIL ✓

Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.`,
    ctaText: 'Lihat Invoice',
    ctaLink: '{links.dashboard}/invoices/{transaction.id}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["payment", "confirmation", "invoice"],
    variables: {
      payment_method: 'multiple',
      auto_send: true
    }
  },
  {
    name: 'WhatsApp Order Update',
    slug: 'whatsapp-order-update',
    description: 'Update status pesanan via WhatsApp',
    category: 'NOTIFICATION',
    type: 'WHATSAPP',
    roleTarget: 'ALL',
    subject: 'Status Pesanan Update',
    content: `🔔 *UPDATE PESANAN EKSPORTIR*

Halo {user.name},

Pesanan Anda #{transaction.id} telah diupdate:
📦 Status: {transaction.status}
📅 Tanggal: {transaction.date}
💰 Total: {transaction.amount}

Terima kasih telah menggunakan EksporYuk! 🇮🇩`,
    ctaText: null,
    ctaLink: null,
    priority: 'NORMAL',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["order", "status", "whatsapp"],
    variables: {
      message_format: 'whatsapp',
      auto_send: true
    }
  },
  {
    name: 'Push Notification - New Message',
    slug: 'push-notification-new-message',
    description: 'Push notification untuk pesan baru',
    category: 'NOTIFICATION',
    type: 'PUSH',
    roleTarget: 'ALL',
    subject: 'Pesan Baru dari EksporYuk',
    content: `{user.name}, Anda memiliki pesan baru! Tap untuk membaca.`,
    ctaText: 'Baca Pesan',
    ctaLink: '{links.dashboard}/messages',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: false,
    isActive: true,
    tags: ["message", "push", "notification"],
    variables: {
      notification_type: 'message',
      sound_enabled: true
    }
  },
  {
    name: 'Marketing Newsletter',
    slug: 'marketing-newsletter',
    description: 'Newsletter bulanan untuk semua user',
    category: 'MARKETING',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Newsletter EksporYuk - {current.date}',
    content: `Halo {user.name},

Selamat datang di newsletter bulanan EksporYuk! 📰

Bulan ini kami hadirkan:
• Tips ekspor terbaru dari para ahli
• Success story eksportir Indonesia
• Update regulasi perdagangan internasional
• Peluang pasar global yang menjanjikan

Jangan lewatkan kesempatan mengembangkan bisnis ekspor Anda bersama EksporYuk.`,
    ctaText: 'Baca Selengkapnya',
    ctaLink: '{brand.website}/newsletter',
    priority: 'LOW',
    isDefault: false,
    isSystem: false,
    isActive: true,
    tags: ["newsletter", "marketing", "monthly"],
    variables: {
      frequency: 'monthly',
      segment: 'all_users'
    }
  },
  {
    name: 'System Maintenance Alert',
    slug: 'system-maintenance-alert',
    description: 'Pemberitahuan maintenance sistem',
    category: 'SYSTEM',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Maintenance Terjadwal - EksporYuk Platform',
    content: `Halo {user.name},

Kami akan melakukan maintenance terjadwal pada platform EksporYuk.

Jadwal Maintenance:
📅 Tanggal: {current.date}
⏰ Waktu: 02:00 - 06:00 WIB
⏳ Estimasi: 4 jam

Selama maintenance, platform tidak dapat diakses sementara. Mohon maaf atas ketidaknyamanan ini.

Tim Support: {brand.email}`,
    ctaText: 'Info Lebih Lanjut',
    ctaLink: '{brand.website}/maintenance',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ["maintenance", "system", "downtime"],
    variables: {
      maintenance_type: 'scheduled',
      notification_timing: '24_hours_before'
    }
  }
]

async function createSampleTemplates() {
  console.log('🌱 Creating sample branded templates...')

  try {
    // First, find admin user to use as creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }

    console.log(`👤 Using admin user: ${adminUser.email}`)

    for (const template of SAMPLE_TEMPLATES) {
      // Check if template already exists
      const existing = await prisma.brandedTemplate.findFirst({
        where: { slug: template.slug }
      })

      if (existing) {
        console.log(`⏭️  Template "${template.name}" already exists, skipping...`)
        continue
      }

      // Create the template
      const created = await prisma.brandedTemplate.create({
        data: {
          ...template,
          createdBy: adminUser.id
        }
      })

      console.log(`✅ Created template: "${created.name}" (${created.category}/${created.type})`)

      // Create some sample usage data for analytics
      const usageCount = Math.floor(Math.random() * 50) + 1
      
      for (let i = 0; i < usageCount; i++) {
        const randomDaysAgo = Math.floor(Math.random() * 30)
        const usedAt = new Date()
        usedAt.setDate(usedAt.getDate() - randomDaysAgo)

        await prisma.brandedTemplateUsage.create({
          data: {
            templateId: created.id,
            userId: adminUser.id,
            context: 'MANUAL',
            metadata: {
              trigger: 'sample_data',
              recipient_email: `sample${i}@example.com`,
              used_at: usedAt.toISOString()
            }
          }
        })
      }

      // Update usage count dan last used date
      await prisma.brandedTemplate.update({
        where: { id: created.id },
        data: {
          usageCount: usageCount,
          lastUsedAt: new Date()
        }
      })

      console.log(`📊 Added ${usageCount} usage records for analytics`)
    }

    console.log('🎉 Sample templates created successfully!')

  } catch (error) {
    console.error('❌ Error creating sample templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeder
createSampleTemplates()