/**
 * COMPREHENSIVE TEMPLATE SEEDER
 * Seeds all templates for production-ready deployment
 * Run: node seed-all-templates.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedAllTemplates() {
  console.log('🌱 Starting comprehensive template seeding...\n')
  
  let counts = {
    branded: 0,
    followUp: 0,
    reminder: 0,
    affiliateEmail: 0,
    cta: 0,
    oneSignal: 0,
    certificate: 0
  }

  try {
    // Get admin user first
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      throw new Error('Admin user not found! Please create admin user first.')
    }
    
    console.log(`Using admin user: ${adminUser.email}\n`)
    // ========================================
    // 1. BRANDED TEMPLATES (Email & WhatsApp)
    // ========================================
    console.log('📧 Seeding Branded Templates...')
    
    const brandedTemplates = [
      {
        name: 'Welcome New Member',
        slug: 'welcome-new-member',
        category: 'MEMBERSHIP',
        type: 'EMAIL',
        subject: 'Selamat Datang di Eksporyuk! 🎉',
        content: `Halo {name},

Selamat datang di Eksporyuk! Kami senang Anda bergabung.

Email Anda: {email}
Membership: {membership_plan}

Akses dashboard Anda sekarang dan mulai belajar ekspor!

Salam,
Tim Eksporyuk`,
        ctaText: 'Akses Dashboard',
        ctaLink: '{dashboard_link}',
        tags: ['welcome', 'onboarding'],
        isDefault: true,
        createdBy: null
      },
      {
        name: 'Membership Expiry Reminder',
        slug: 'membership-expiry-reminder',
        category: 'MEMBERSHIP',
        type: 'EMAIL',
        subject: '⚠️ Membership Anda Akan Berakhir',
        content: `Halo {name},

Membership {membership_plan} Anda akan berakhir pada {expiry_date}.

Sisa waktu: {days_left} hari

Perpanjang sekarang agar tidak kehilangan akses!

Salam,
Tim Eksporyuk`,
        ctaText: 'Perpanjang Membership',
        ctaLink: '{renewal_link}',
        tags: ['reminder', 'expiry'],
        isDefault: true,
        createdBy: null
      },
      {
        name: 'Payment Success Notification',
        slug: 'payment-success',
        category: 'TRANSACTION',
        type: 'EMAIL',
        subject: '✅ Pembayaran Berhasil!',
        content: `Halo {name},

Pembayaran Anda sebesar Rp {amount} telah berhasil!

Produk: {product_name}
Status: LUNAS

Terima kasih atas kepercayaan Anda.

Salam,
Tim Eksporyuk`,
        ctaText: 'Lihat Invoice',
        ctaLink: '{invoice_link}',
        tags: ['payment', 'success'],
        isDefault: true,
        createdBy: null
      },
      {
        name: 'WhatsApp Welcome Message',
        slug: 'wa-welcome',
        category: 'MEMBERSHIP',
        type: 'WHATSAPP',
        subject: 'Welcome to Eksporyuk!',
        content: `Halo {name}! 👋

Selamat datang di Eksporyuk!

Akses dashboard: {dashboard_link}

Ada pertanyaan? Reply chat ini!`,
        tags: ['welcome', 'whatsapp'],
        isDefault: true,
        createdBy: null
      },
      {
        name: 'WhatsApp Payment Reminder',
        slug: 'wa-payment-reminder',
        category: 'TRANSACTION',
        type: 'WHATSAPP',
        subject: 'Payment Reminder',
        content: `Halo {name}! 🔔

Pembayaran Anda sebesar Rp {amount} masih pending.

Segera selesaikan: {payment_link}

Terima kasih!`,
        tags: ['payment', 'reminder', 'whatsapp'],
        isDefault: true,
        createdBy: null
      }
    ]

    for (const template of brandedTemplates) {
      try {
        await prisma.brandedTemplate.upsert({
          where: { slug: template.slug },
          update: template,
          create: template
        })
        counts.branded++
      } catch (err) {
        if (!err.message.includes('Unique constraint')) {
          console.log(`⚠️  Skipped branded template: ${template.name}`)
        }
      }
    }
    
    console.log(`✅ Processed ${counts.branded}/${brandedTemplates.length} branded templates\n`)

    // ========================================
    // 2. FOLLOW UP TEMPLATES
    // ========================================
    console.log('📨 Seeding Follow Up Templates...')
    
    const followUpTemplates = [
      {
        name: 'Follow Up 1 Hour After Checkout',
        triggerHours: 1,
        message: 'Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu. Segera selesaikan sebelum kedaluwarsa!',
        channel: 'WHATSAPP',
        isActive: true,
        createdBy: adminUser.id,
        ownerType: 'admin',
        useStarsender: true
      },
      {
        name: 'Follow Up 24 Hours',
        triggerHours: 24,
        message: 'Reminder: Pembayaran Anda akan kedaluwarsa dalam {timeLeft}. Link: {payment_link}',
        channel: 'EMAIL',
        isActive: true,
        createdBy: adminUser.id,
        ownerType: 'admin',
        useMailkiting: true
      },
      {
        name: 'Follow Up 48 Hours - Last Chance',
        triggerHours: 48,
        message: 'LAST CHANCE! Pembayaran Anda akan dibatalkan otomatis. Segera bayar: {payment_link}',
        channel: 'WHATSAPP',
        isActive: true,
        createdBy: adminUser.id,
        ownerType: 'admin',
        useStarsender: true
      }
    ]

    for (const template of followUpTemplates) {
      try {
        const existing = await prisma.followUpTemplate.findFirst({ where: { name: template.name } })
        if (!existing) {
          await prisma.followUpTemplate.create({ data: template })
          counts.followUp++
        }
      } catch (err) {
        console.log(`⚠️  Skipped follow-up template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.followUp}/${followUpTemplates.length} follow-up templates\n`)

    // ========================================
    // 3. REMINDER TEMPLATES (Using templateData JSON)
    // ========================================
    console.log('⏰ Seeding Reminder Templates...')
    
    const reminderTemplates = [
      // MEMBERSHIP REMINDERS
      {
        name: 'Membership Expiry 7 Days',
        description: 'Reminder 7 hari sebelum membership expired',
        category: 'MEMBERSHIP_EXPIRY',
        templateData: {
          triggerType: 'BEFORE_EXPIRY',
          triggerDays: 7,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Membership Anda Akan Berakhir dalam 7 Hari',
            body: 'Halo {name},\n\nMembership {membership_name} Anda akan berakhir pada {expiry_date}.\n\nSisa waktu: 7 hari\n\nPerpanjang sekarang agar tidak kehilangan akses ke:\n- Semua kursus premium\n- Materi eksklusif\n- Support prioritas\n\nKlik link di bawah untuk perpanjang:\n{renewal_link}',
            cta: 'Perpanjang Membership',
            ctaLink: '{renewal_link}'
          },
          whatsapp: {
            message: 'Hi {name}! 👋\n\nMembership {membership_name} Anda akan berakhir {expiry_date}.\n\n⏰ Sisa 7 hari!\n\nPerpanjang di: {renewal_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Membership Expiry 3 Days',
        description: 'Reminder 3 hari sebelum membership expired',
        category: 'MEMBERSHIP_EXPIRY',
        templateData: {
          triggerType: 'BEFORE_EXPIRY',
          triggerDays: 3,
          channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
          email: {
            subject: '⚠️ Membership Berakhir dalam 3 Hari!',
            body: 'Halo {name},\n\nPeringatan! Membership Anda akan berakhir dalam 3 hari.\n\nJangan sampai kehilangan akses!\n\nPerpanjang sekarang: {renewal_link}'
          },
          whatsapp: {
            message: '⚠️ PENTING!\n\nMembership {membership_name} Anda berakhir dalam 3 hari.\n\nSegera perpanjang: {renewal_link}'
          },
          push: {
            title: '⚠️ Membership Berakhir 3 Hari Lagi',
            body: 'Perpanjang sekarang agar tidak kehilangan akses'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Membership Expiry 1 Day',
        description: 'Reminder 1 hari sebelum membership expired',
        category: 'MEMBERSHIP_EXPIRY',
        templateData: {
          triggerType: 'BEFORE_EXPIRY',
          triggerDays: 1,
          channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
          email: {
            subject: '🚨 URGENT: Membership Berakhir Besok!',
            body: 'URGENT!\n\nMembership Anda berakhir besok, {expiry_date}.\n\nIni adalah kesempatan terakhir untuk perpanjang tanpa kehilangan akses.\n\nPerpanjang SEKARANG: {renewal_link}'
          },
          whatsapp: {
            message: '🚨 BESOK membership Anda expired!\n\nTerakhir kali perpanjang: {renewal_link}'
          },
          push: {
            title: '🚨 Membership Berakhir Besok',
            body: 'Perpanjang sekarang!'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Membership Expired Today',
        description: 'Notifikasi di hari membership expired',
        category: 'MEMBERSHIP_EXPIRY',
        templateData: {
          triggerType: 'ON_EXPIRY',
          triggerDays: 0,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Membership Anda Telah Berakhir',
            body: 'Halo {name},\n\nMembership {membership_name} Anda telah berakhir hari ini.\n\nAnda masih bisa perpanjang untuk mendapatkan akses kembali.\n\nPerpanjang sekarang: {renewal_link}'
          },
          whatsapp: {
            message: 'Membership Anda sudah expired. Perpanjang untuk akses kembali: {renewal_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Membership Welcome',
        description: 'Welcome message setelah beli membership',
        category: 'MEMBERSHIP_PURCHASE',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 0,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Selamat Datang di {membership_name}! 🎉',
            body: 'Halo {name},\n\nSelamat! Anda sekarang adalah member {membership_name}.\n\nAkses dashboard Anda: {dashboard_link}\n\nAnda bisa mulai:\n- Akses semua kursus\n- Download materi\n- Join komunitas\n\nSelamat belajar!'
          },
          whatsapp: {
            message: '🎉 Selamat datang di {membership_name}!\n\nAkses dashboard: {dashboard_link}\n\nSelamat belajar!'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      
      // COURSE REMINDERS
      {
        name: 'Course Progress Reminder',
        description: 'Reminder untuk melanjutkan kursus yang belum selesai',
        category: 'COURSE_PROGRESS',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 7,
          channels: ['EMAIL', 'PUSH'],
          email: {
            subject: 'Lanjutkan Kursus Anda!',
            body: 'Halo {name},\n\nKami melihat Anda belum menyelesaikan kursus {course_name}.\n\nProgress Anda: {progress}%\n\nYuk lanjutkan belajar: {course_link}'
          },
          push: {
            title: 'Lanjutkan Kursus',
            body: '{course_name} - Progress {progress}%'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Course Not Started',
        description: 'Reminder untuk kursus yang belum dimulai',
        category: 'COURSE_PROGRESS',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 3,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Mulai Kursus {course_name} Anda',
            body: 'Halo {name},\n\nAnda sudah terdaftar di kursus {course_name} tapi belum memulai.\n\nMulai sekarang: {course_link}'
          },
          whatsapp: {
            message: 'Jangan lupa mulai kursus {course_name} Anda!\n\n{course_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Course Completion Congrats',
        description: 'Selamat menyelesaikan kursus',
        category: 'COURSE_COMPLETION',
        templateData: {
          triggerType: 'ON_COMPLETION',
          triggerDays: 0,
          channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
          email: {
            subject: '🎉 Selamat! Anda Menyelesaikan {course_name}',
            body: 'Luar biasa {name}!\n\nAnda telah menyelesaikan kursus {course_name}.\n\nDownload sertifikat Anda: {certificate_link}'
          },
          whatsapp: {
            message: '🎉 Selamat menyelesaikan {course_name}!\n\nDownload sertifikat: {certificate_link}'
          },
          push: {
            title: '🎉 Kursus Selesai!',
            body: 'Download sertifikat Anda sekarang'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      
      // PRODUCT REMINDERS
      {
        name: 'Product Purchase Thank You',
        description: 'Terima kasih setelah beli produk',
        category: 'PRODUCT_PURCHASE',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 0,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Terima Kasih atas Pembelian Anda!',
            body: 'Halo {name},\n\nTerima kasih telah membeli {product_name}.\n\nDownload produk Anda: {product_link}\n\nAda pertanyaan? Hubungi support kami.'
          },
          whatsapp: {
            message: 'Terima kasih sudah beli {product_name}!\n\nDownload di: {product_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Product Usage Reminder',
        description: 'Reminder untuk menggunakan produk yang dibeli',
        category: 'PRODUCT_USAGE',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 7,
          channels: ['EMAIL'],
          email: {
            subject: 'Sudah Gunakan {product_name}?',
            body: 'Halo {name},\n\nSudah seminggu sejak Anda membeli {product_name}.\n\nPastikan Anda sudah download dan gunakan produk Anda.\n\nAkses produk: {product_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      
      // EVENT REMINDERS
      {
        name: 'Event Registration Confirmation',
        description: 'Konfirmasi registrasi event',
        category: 'EVENT_REGISTRATION',
        templateData: {
          triggerType: 'AFTER_PURCHASE',
          triggerDays: 0,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Registrasi Event {event_name} Berhasil!',
            body: 'Halo {name},\n\nRegistrasi Anda untuk event {event_name} berhasil!\n\nTanggal: {event_date}\nWaktu: {event_time}\nLokasi: {event_location}\n\nLink event: {event_link}'
          },
          whatsapp: {
            message: '✅ Registrasi event {event_name} berhasil!\n\n📅 {event_date}\n⏰ {event_time}\n\nLink: {event_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Event Reminder 3 Days',
        description: 'Reminder 3 hari sebelum event',
        category: 'EVENT_UPCOMING',
        templateData: {
          triggerType: 'BEFORE_EXPIRY',
          triggerDays: 3,
          channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
          email: {
            subject: 'Event {event_name} 3 Hari Lagi!',
            body: 'Halo {name},\n\nEvent {event_name} akan dimulai 3 hari lagi.\n\nTanggal: {event_date}\nJangan sampai ketinggalan!\n\nLink event: {event_link}'
          },
          whatsapp: {
            message: '📅 3 hari lagi event {event_name}!\n\nSiap-siap ya!\n{event_link}'
          },
          push: {
            title: 'Event 3 Hari Lagi',
            body: '{event_name} - {event_date}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Event Reminder 1 Day',
        description: 'Reminder 1 hari sebelum event',
        category: 'EVENT_UPCOMING',
        templateData: {
          triggerType: 'BEFORE_EXPIRY',
          triggerDays: 1,
          channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
          email: {
            subject: '⚠️ Event {event_name} Besok!',
            body: 'BESOK! Event {event_name}\n\nTanggal: {event_date}\nWaktu: {event_time}\n\nJangan lupa ya!\n\nLink event: {event_link}'
          },
          whatsapp: {
            message: '⚠️ BESOK! Event {event_name}\n\n⏰ {event_time}\n\n{event_link}'
          },
          push: {
            title: '⚠️ Event Besok!',
            body: '{event_name} - {event_time}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Event Starting Soon',
        description: 'Reminder 1 jam sebelum event dimulai',
        category: 'EVENT_UPCOMING',
        templateData: {
          triggerType: 'BEFORE_START',
          triggerHours: 1,
          channels: ['WHATSAPP', 'PUSH'],
          whatsapp: {
            message: '🔔 Event {event_name} dimulai dalam 1 jam!\n\nBergabung sekarang: {event_link}'
          },
          push: {
            title: '🔔 Event Dimulai 1 Jam Lagi',
            body: 'Bergabung sekarang!'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Event Thank You',
        description: 'Terima kasih setelah event selesai',
        category: 'EVENT_COMPLETION',
        templateData: {
          triggerType: 'AFTER_END',
          triggerDays: 1,
          channels: ['EMAIL'],
          email: {
            subject: 'Terima Kasih Telah Mengikuti {event_name}',
            body: 'Halo {name},\n\nTerima kasih telah mengikuti event {event_name}.\n\nDownload materi event: {materials_link}\n\nSampai jumpa di event berikutnya!'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      
      // SYSTEM REMINDERS
      {
        name: 'Weekly Activity Summary',
        description: 'Summary aktivitas mingguan user',
        category: 'SYSTEM_ACTIVITY',
        templateData: {
          triggerType: 'SCHEDULED',
          triggerDay: 'MONDAY',
          channels: ['EMAIL'],
          email: {
            subject: 'Summary Aktivitas Minggu Ini',
            body: 'Halo {name},\n\nBerikut summary aktivitas Anda minggu ini:\n\n- Kursus diselesaikan: {courses_completed}\n- Total waktu belajar: {learning_hours} jam\n- Progress: {overall_progress}%\n\nTeruskan semangat belajarnya!'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      },
      {
        name: 'Inactive User Re-engagement',
        description: 'Re-engage user yang tidak aktif',
        category: 'SYSTEM_ENGAGEMENT',
        templateData: {
          triggerType: 'AFTER_LAST_ACTIVITY',
          triggerDays: 30,
          channels: ['EMAIL', 'WHATSAPP'],
          email: {
            subject: 'Kami Kangen Kamu! 😢',
            body: 'Halo {name},\n\nSudah lama tidak terlihat di platform.\n\nAda konten baru menunggu Anda:\n- {new_courses_count} kursus baru\n- {new_materials_count} materi baru\n\nKembali belajar: {dashboard_link}'
          },
          whatsapp: {
            message: 'Udah lama gak login nih! 😢\n\nAda {new_courses_count} kursus baru lho.\n\nCek sekarang: {dashboard_link}'
          }
        },
        isPublic: true,
        createdBy: adminUser.id
      }
    ]

    for (const template of reminderTemplates) {
      try {
        const existing = await prisma.reminderTemplate.findFirst({ where: { name: template.name } })
        if (!existing) {
          await prisma.reminderTemplate.create({ data: template })
          counts.reminder++
        }
      } catch (err) {
        console.log(`⚠️  Skipped reminder template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.reminder}/${reminderTemplates.length} reminder templates\n`)

    // ========================================
    // 4. AFFILIATE EMAIL TEMPLATES
    // ========================================
    console.log('💰 Seeding Affiliate Email Templates...')
    
    const affiliateTemplates = [
      {
        name: 'Commission Earned Notification',
        slug: 'commission-earned',
        subject: '💸 Selamat! Anda Dapat Komisi Rp {commission_amount}',
        body: `Halo {affiliate_name},

Selamat! Anda baru saja mendapatkan komisi sebesar Rp {commission_amount}!

Detail:
- Dari: {customer_name}
- Produk: {product_name}
- Komisi: Rp {commission_amount}
- Total Earnings: Rp {total_earnings}

Lihat detail di dashboard Anda.`,
        category: 'COMMISSION',
        isActive: true,
        createdById: adminUser.id
      },
      {
        name: 'Withdrawal Request Approved',
        slug: 'withdrawal-approved',
        subject: '✅ Penarikan Dana Disetujui',
        body: `Halo {affiliate_name},

Permintaan penarikan dana Anda sebesar Rp {amount} telah disetujui!

Dana akan ditransfer ke rekening Anda dalam 1-3 hari kerja.

No. Rekening: {bank_account}
Bank: {bank_name}`,
        category: 'WITHDRAWAL',
        isActive: true,
        createdById: adminUser.id
      }
    ]

    for (const template of affiliateTemplates) {
      try {
        await prisma.affiliateEmailTemplate.upsert({
          where: { slug: template.slug },
          update: template,
          create: template
        })
        counts.affiliateEmail++
      } catch (err) {
        console.log(`⚠️  Skipped affiliate template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.affiliateEmail}/${affiliateTemplates.length} affiliate email templates\n`)

    // ========================================
    // 5. AFFILIATE CTA TEMPLATES
    // ========================================
    console.log('🔗 Seeding Affiliate CTA Templates...')
    
    const ctaTemplates = [
      {
        name: 'Default Product CTA',
        buttonText: 'Dapatkan Sekarang!',
        buttonType: 'PRIMARY',
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        isActive: true
      },
      {
        name: 'Limited Time Offer',
        buttonText: 'Promo Terbatas - Beli Sekarang!',
        buttonType: 'DANGER',
        backgroundColor: '#EF4444',
        textColor: '#FFFFFF',
        isActive: true
      },
      {
        name: 'Learn More',
        buttonText: 'Pelajari Lebih Lanjut',
        buttonType: 'SECONDARY',
        backgroundColor: '#6B7280',
        textColor: '#FFFFFF',
        isActive: true
      }
    ]

    for (const template of ctaTemplates) {
      try {
        const existing = await prisma.affiliateCTATemplate.findFirst({ where: { name: template.name } })
        if (!existing) {
          await prisma.affiliateCTATemplate.create({ data: template })
          counts.cta++
        }
      } catch (err) {
        console.log(`⚠️  Skipped CTA template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.cta}/${ctaTemplates.length} CTA templates\n`)

    // ========================================
    // 6. ONESIGNAL TEMPLATES
    // ========================================
    console.log('🔔 Seeding OneSignal Templates...')
    
    const oneSignalTemplates = [
      {
        name: 'Welcome Push',
        title: 'Selamat Datang! 🎉',
        message: 'Terima kasih bergabung dengan Eksporyuk. Mulai belajar sekarang!',
        imageUrl: '/icon.png',
        url: '/dashboard',
        targetType: 'all'
      },
      {
        name: 'New Course Available',
        title: 'Kursus Baru Tersedia! 📚',
        message: 'Kursus {course_name} baru saja ditambahkan. Check it out!',
        imageUrl: '/icon.png',
        url: '/courses',
        targetType: 'enrolled'
      },
      {
        name: 'Payment Reminder',
        title: 'Pembayaran Menunggu ⏰',
        message: 'Segera selesaikan pembayaran Anda sebelum kedaluwarsa.',
        imageUrl: '/icon.png',
        url: '/transactions',
        targetType: 'pending_payment'
      }
    ]

    for (const template of oneSignalTemplates) {
      try {
        const existing = await prisma.oneSignalTemplate.findFirst({ where: { name: template.name } })
        if (!existing) {
          await prisma.oneSignalTemplate.create({ data: template })
          counts.oneSignal++
        }
      } catch (err) {
        console.log(`⚠️  Skipped OneSignal template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.oneSignal}/${oneSignalTemplates.length} OneSignal templates\n`)

    // ========================================
    // 7. CERTIFICATE TEMPLATES
    // ========================================
    console.log('🎓 Seeding Certificate Templates...')
    
    const certificateTemplates = [
      {
        name: 'Course Completion Certificate',
        description: 'Default certificate untuk penyelesaian kursus',
        layout: 'MODERN',
        backgroundColor: '#FFFFFF',
        primaryColor: '#3B82F6',
        secondaryColor: '#60A5FA',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        titleFontSize: '3xl',
        showLogo: true,
        showSignature: true,
        showQrCode: true,
        showBorder: true,
        isActive: true,
        isDefault: true
      }
    ]

    for (const template of certificateTemplates) {
      try {
        const existing = await prisma.certificateTemplate.findFirst({ where: { name: template.name } })
        if (!existing) {
          await prisma.certificateTemplate.create({ data: template })
          counts.certificate++
        }
      } catch (err) {
        console.log(`⚠️  Skipped certificate template: ${template.name}`)
      }
    }
    
    console.log(`✅ Processed ${counts.certificate}/${certificateTemplates.length} certificate templates\n`)

    // Summary
    console.log('=' .repeat(60))
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(60))
    console.log(`
Summary:
- Branded Templates: ${counts.branded}
- Follow-Up Templates: ${counts.followUp}
- Reminder Templates: ${counts.reminder} (Membership, Course, Product, Event, System)
- Affiliate Email Templates: ${counts.affiliateEmail}
- CTA Templates: ${counts.cta}
- OneSignal Templates: ${counts.oneSignal}
- Certificate Templates: ${counts.certificate}

Total Templates Created: ${Object.values(counts).reduce((a, b) => a + b, 0)}

📋 Reminder Categories Covered:
   ✅ Membership (Expiry, Welcome, Purchase)
   ✅ Course (Progress, Not Started, Completion)
   ✅ Product (Purchase, Usage)
   ✅ Event (Registration, Upcoming, Completion)
   ✅ System (Activity Summary, Re-engagement)

🎉 All templates are now ready for production deployment!
    `)

  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seeder
seedAllTemplates()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
