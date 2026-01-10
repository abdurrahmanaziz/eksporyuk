/**
 * REMINDER EMAIL TEMPLATES
 * Template siap pakai untuk admin tanpa perlu HTML
 * Semua template menggunakan format email branded dengan header logo dan footer
 */

// CRITICAL: .trim() to remove any whitespace/newlines from env vars
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()
const APP_NAME = 'EksporYuk'
const SUPPORT_EMAIL = 'support@eksporyuk.com'
const BRAND_COLOR = '#f97316'
const LOGO_URL = `${APP_URL}/logo.png`

/**
 * Generate branded email HTML dari plain text
 * Admin cukup tulis pesan biasa, akan otomatis di-wrap dengan template branded
 */
export function generateBrandedEmail(options: {
  title: string
  greeting: string
  body: string
  ctaText?: string
  ctaLink?: string
  footerNote?: string
}): string {
  const { title, greeting, body, ctaText, ctaLink, footerNote } = options

  // Convert plain text to HTML paragraphs
  const bodyHtml = body
    .split('\n\n')
    .map(paragraph => `<p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.7;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const ctaButton = ctaText && ctaLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaLink}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${ctaText}
      </a>
    </div>
  ` : ''

  const footerNoteHtml = footerNote ? `
    <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        💡 ${footerNote}
      </p>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #ea580c 100%); border-radius: 16px 16px 0 0;">
              <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 48px; margin-bottom: 12px;" onerror="this.style.display='none'">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">
                ${greeting}
              </p>
              
              ${bodyHtml}
              
              ${ctaButton}
              
              ${footerNoteHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">
                ${APP_NAME}
              </p>
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia
              </p>
              <div style="margin: 16px 0;">
                <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 13px; margin: 0 8px;">Website</a>
                <span style="color: #d1d5db;">|</span>
                <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 13px; margin: 0 8px;">Bantuan</a>
                <span style="color: #d1d5db;">|</span>
                <a href="${APP_URL}/dashboard" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 13px; margin: 0 8px;">Dashboard</a>
              </div>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                  Email ini dikirim otomatis karena Anda adalah member ${APP_NAME}.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * TEMPLATE REMINDER SIAP PAKAI
 * Admin tinggal pilih template dan customize variabel
 */
export const reminderTemplates = {
  // ============================================
  // WELCOME & ONBOARDING
  // ============================================
  
  welcome: {
    id: 'welcome',
    name: 'Selamat Datang Member Baru',
    description: 'Email pertama setelah bergabung membership',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 0,
    delayUnit: 'hours',
    
    emailSubject: '🎉 Selamat Datang di {plan_name}!',
    emailBody: `Halo {name}!

Selamat bergabung di keluarga EksporYuk! Kami sangat senang menyambut Anda sebagai member {plan_name}.

Akun Anda sudah aktif dan Anda bisa langsung mulai belajar. Berikut beberapa hal yang bisa Anda lakukan:

✅ Akses semua materi kursus
✅ Bergabung dengan komunitas member
✅ Download template dan dokumen ekspor
✅ Tanya jawab dengan mentor

Jangan ragu untuk mengeksplorasi semua fitur yang tersedia!`,
    emailCTA: 'Mulai Belajar Sekarang',
    emailCTALink: '{course_link}',
    
    whatsappMessage: `Halo {name}! 🎉

Selamat bergabung di {plan_name}!

Akun Anda sudah aktif. Langsung mulai belajar di:
{course_link}

Ada pertanyaan? Reply pesan ini!`,
    
    pushTitle: '🎉 Selamat Datang!',
    pushBody: 'Membership {plan_name} sudah aktif. Mulai belajar sekarang!',
    
    inAppTitle: 'Selamat Datang di {plan_name}!',
    inAppBody: 'Membership Anda sudah aktif. Klik untuk mulai belajar.',
  },

  onboarding_day1: {
    id: 'onboarding_day1',
    name: 'Panduan Hari Pertama',
    description: 'Reminder panduan memulai di hari pertama',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 1,
    delayUnit: 'days',
    
    emailSubject: '📚 Panduan Memulai - Hari Pertama Anda',
    emailBody: `Halo {name}!

Sudah satu hari Anda bergabung di {plan_name}. Bagaimana pengalaman pertama Anda?

Agar belajar lebih terarah, berikut rekomendasi langkah-langkah untuk Anda:

🎯 Langkah 1: Lengkapi profil Anda
🎯 Langkah 2: Tonton video orientasi
🎯 Langkah 3: Bergabung grup komunitas
🎯 Langkah 4: Mulai modul pertama

Tip: Luangkan minimal 30 menit sehari untuk belajar konsisten!`,
    emailCTA: 'Lanjutkan Belajar',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `Halo {name}! 📚

Sudah hari pertama di {plan_name}!

Jangan lupa cek:
✅ Video orientasi
✅ Grup komunitas
✅ Modul pertama

Dashboard: {dashboard_link}`,
    
    pushTitle: '📚 Panduan Hari Pertama',
    pushBody: 'Jangan lewatkan langkah-langkah penting untuk memulai!',
    
    inAppTitle: 'Panduan Hari Pertama',
    inAppBody: 'Sudah cek panduan memulai? Klik untuk melihat langkah-langkahnya.',
  },

  // ============================================
  // ENGAGEMENT & RETENTION
  // ============================================

  engagement_week1: {
    id: 'engagement_week1',
    name: 'Check-in Minggu Pertama',
    description: 'Reminder engagement setelah 7 hari',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 7,
    delayUnit: 'days',
    
    emailSubject: '👋 Bagaimana Progress Minggu Pertama Anda?',
    emailBody: `Halo {name}!

Tidak terasa sudah seminggu Anda bergabung di {plan_name}. Kami ingin tahu bagaimana progress Anda!

Sudah berapa modul yang Anda selesaikan? Jika ada kendala atau pertanyaan, jangan ragu untuk bertanya di grup komunitas atau hubungi tim support kami.

Ingat, konsistensi adalah kunci kesuksesan dalam belajar. Tetap semangat! 💪`,
    emailCTA: 'Lanjutkan Belajar',
    emailCTALink: '{course_link}',
    
    whatsappMessage: `Halo {name}! 👋

Sudah 1 minggu di {plan_name}!

Bagaimana progressnya? Ada kendala?

Reply pesan ini kalau butuh bantuan ya!`,
    
    pushTitle: '👋 1 Minggu Bersama Kami!',
    pushBody: 'Bagaimana progress belajar Anda? Terus semangat!',
    
    inAppTitle: 'Check-in Minggu Pertama',
    inAppBody: 'Sudah seminggu! Bagaimana progress belajar Anda?',
  },

  inactive_reminder: {
    id: 'inactive_reminder',
    name: 'Reminder Member Tidak Aktif',
    description: 'Reminder untuk member yang belum login 14 hari',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 14,
    delayUnit: 'days',
    
    emailSubject: '😢 Kami Rindu Anda di EksporYuk!',
    emailBody: `Halo {name}!

Kami perhatikan Anda belum login ke dashboard dalam beberapa waktu. Apakah semuanya baik-baik saja?

Jangan biarkan kesempatan belajar terlewat! Ada banyak materi dan update baru yang menanti Anda di {plan_name}.

Kalau ada kendala teknis atau pertanyaan, tim support kami siap membantu kapan saja.

Yuk, mulai belajar lagi! 🚀`,
    emailCTA: 'Kembali ke Dashboard',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `Halo {name}! 😢

Sudah lama tidak login ke EksporYuk.

Ada kendala? Butuh bantuan?

Yuk lanjut belajar: {dashboard_link}`,
    
    pushTitle: '😢 Kami Rindu Anda!',
    pushBody: 'Sudah lama tidak login. Yuk lanjutkan belajar!',
    
    inAppTitle: 'Selamat Datang Kembali!',
    inAppBody: 'Senang melihat Anda kembali! Ada banyak update baru.',
  },

  // ============================================
  // EXPIRY & RENEWAL
  // ============================================

  expiry_30days: {
    id: 'expiry_30days',
    name: 'Reminder 30 Hari Sebelum Expired',
    description: 'Reminder renewal H-30',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 30,
    delayUnit: 'days',
    
    emailSubject: '⏰ Membership Anda Akan Berakhir dalam 30 Hari',
    emailBody: `Halo {name}!

Ini adalah pengingat bahwa membership {plan_name} Anda akan berakhir pada tanggal {expiry_date} (30 hari lagi).

Jangan sampai akses Anda terputus! Perpanjang sekarang untuk tetap bisa:
✅ Akses semua materi kursus
✅ Bergabung dengan komunitas
✅ Download template dan dokumen
✅ Konsultasi dengan mentor

Perpanjang sekarang dan nikmati harga khusus untuk member existing!`,
    emailCTA: 'Perpanjang Membership',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `Halo {name}! ⏰

Reminder: Membership {plan_name} berakhir {expiry_date} (30 hari lagi).

Perpanjang sekarang agar akses tidak terputus: {payment_link}`,
    
    pushTitle: '⏰ Membership Berakhir 30 Hari Lagi',
    pushBody: 'Perpanjang sekarang agar akses tidak terputus.',
    
    inAppTitle: '30 Hari Menuju Expired',
    inAppBody: 'Membership akan berakhir. Perpanjang sekarang!',
  },

  expiry_7days: {
    id: 'expiry_7days',
    name: 'Reminder 7 Hari Sebelum Expired',
    description: 'Reminder renewal H-7',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 7,
    delayUnit: 'days',
    
    emailSubject: '🚨 PENTING: Membership Berakhir 7 Hari Lagi!',
    emailBody: `Halo {name}!

Ini pengingat penting bahwa membership {plan_name} Anda akan berakhir dalam 7 hari (tanggal {expiry_date}).

Setelah membership berakhir:
❌ Akses kursus akan terhenti
❌ Tidak bisa download materi
❌ Tidak bisa ikut live session

Perpanjang sekarang dan tetap terhubung dengan komunitas EksporYuk!`,
    emailCTA: 'Perpanjang Sekarang',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `🚨 PENTING {name}!

Membership {plan_name} berakhir 7 HARI lagi ({expiry_date}).

Segera perpanjang: {payment_link}

Jangan sampai akses terputus!`,
    
    pushTitle: '🚨 7 Hari Menuju Expired!',
    pushBody: 'Segera perpanjang membership Anda!',
    
    inAppTitle: 'URGENT: 7 Hari Lagi Expired',
    inAppBody: 'Membership akan berakhir dalam 7 hari. Perpanjang sekarang!',
  },

  expiry_1day: {
    id: 'expiry_1day',
    name: 'Reminder 1 Hari Sebelum Expired',
    description: 'Reminder renewal H-1 (urgent)',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 1,
    delayUnit: 'days',
    
    emailSubject: '🔴 TERAKHIR: Membership Berakhir BESOK!',
    emailBody: `Halo {name}!

⚠️ PERHATIAN: Membership {plan_name} Anda akan berakhir BESOK ({expiry_date})!

Ini adalah kesempatan terakhir untuk perpanjang tanpa kehilangan akses. Setelah expired, Anda harus mendaftar ulang dan kehilangan progress yang sudah tercatat.

Perpanjang sekarang dalam hitungan menit!`,
    emailCTA: 'PERPANJANG SEKARANG',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `🔴 URGENT {name}!

Membership BERAKHIR BESOK!

Perpanjang SEKARANG: {payment_link}

Jangan sampai terlambat!`,
    
    pushTitle: '🔴 Membership Berakhir BESOK!',
    pushBody: 'SEGERA perpanjang sebelum terlambat!',
    
    inAppTitle: 'TERAKHIR: Membership Berakhir Besok',
    inAppBody: 'Ini adalah reminder terakhir. Perpanjang sekarang!',
  },

  // ============================================
  // SPECIAL OCCASIONS
  // ============================================

  achievement_unlocked: {
    id: 'achievement_unlocked',
    name: 'Notifikasi Achievement',
    description: 'Reminder saat user dapat achievement',
    triggerType: 'CONDITIONAL',
    delayAmount: 0,
    delayUnit: 'minutes',
    
    emailSubject: '🏆 Selamat! Anda Mendapat Achievement Baru!',
    emailBody: `Halo {name}!

Selamat! Anda baru saja membuka achievement baru di EksporYuk! 🎉

Terus belajar dan kumpulkan achievement lainnya. Setiap pencapaian adalah satu langkah lebih dekat menuju kesuksesan ekspor Anda!

Lihat koleksi achievement Anda di dashboard.`,
    emailCTA: 'Lihat Achievement',
    emailCTALink: '{dashboard_link}/achievements',
    
    whatsappMessage: `🏆 Selamat {name}!

Anda mendapat achievement baru di EksporYuk!

Lihat di: {dashboard_link}/achievements`,
    
    pushTitle: '🏆 Achievement Unlocked!',
    pushBody: 'Anda mendapat achievement baru!',
    
    inAppTitle: 'Achievement Unlocked! 🏆',
    inAppBody: 'Selamat! Anda mendapat achievement baru.',
  },

  community_welcome: {
    id: 'community_welcome',
    name: 'Selamat Datang di Komunitas',
    description: 'Welcome ke grup komunitas',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 2,
    delayUnit: 'hours',
    
    emailSubject: '👥 Selamat Bergabung di Komunitas EksporYuk!',
    emailBody: `Halo {name}!

Selamat bergabung di komunitas eksklusif EksporYuk! 🎉

Di komunitas ini, Anda bisa:
👥 Networking dengan sesama pelaku ekspor
💬 Diskusi dan tanya jawab
📢 Dapat info terbaru dan tips
🎁 Akses event eksklusif member

Jangan lupa perkenalkan diri Anda di grup ya!`,
    emailCTA: 'Gabung Grup Sekarang',
    emailCTALink: '{community_link}',
    
    whatsappMessage: `Halo {name}! 👥

Selamat bergabung di komunitas EksporYuk!

Gabung grup: {community_link}

Jangan lupa perkenalkan diri ya! 🙌`,
    
    pushTitle: '👥 Welcome to Community!',
    pushBody: 'Gabung grup komunitas dan kenalan dengan member lain!',
    
    inAppTitle: 'Bergabung dengan Komunitas',
    inAppBody: 'Klik untuk gabung grup WhatsApp komunitas EksporYuk.',
  },
}

/**
 * Get template by ID
 */
export function getReminderTemplate(templateId: string) {
  return reminderTemplates[templateId as keyof typeof reminderTemplates] || null
}

/**
 * Get all templates as array
 */
export function getAllReminderTemplates() {
  return Object.values(reminderTemplates)
}

/**
 * Get templates by trigger type
 */
export function getTemplatesByTrigger(triggerType: string) {
  return Object.values(reminderTemplates).filter(t => t.triggerType === triggerType)
}

export default reminderTemplates
