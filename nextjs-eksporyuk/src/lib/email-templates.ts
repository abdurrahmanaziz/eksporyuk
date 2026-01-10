/**
 * Email Templates for Membership System
 * Professional HTML email templates with inline CSS
 */

interface EmailTemplateData {
  userName: string
  userEmail: string
  [key: string]: any
}

// CRITICAL: .trim() to remove any whitespace/newlines from env vars
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
const APP_NAME = 'EksporYuk'
const SUPPORT_EMAIL = 'support@eksporyuk.com'
const BRAND_COLOR = '#f97316' // Orange

/**
 * Base Email Template Wrapper
 */
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #ea580c 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                👑 ${APP_NAME}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                <strong>${APP_NAME}</strong><br>
                Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Butuh bantuan? Hubungi kami di <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${SUPPORT_EMAIL}</a>
              </p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                  Email ini dikirim karena Anda adalah member ${APP_NAME}.
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

/**
 * Button Component
 */
const emailButton = (text: string, url: string, color: string = BRAND_COLOR) => `
<a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0;">
  ${text}
</a>
`

/**
 * Info Box Component
 */
const infoBox = (content: string, backgroundColor: string = '#f9fafb') => `
<div style="background-color: ${backgroundColor}; border-left: 4px solid ${BRAND_COLOR}; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
  ${content}
</div>
`

// ============================================
// MEMBERSHIP TEMPLATES
// ============================================

/**
 * 1. Membership Activation Success
 * Sent when payment is confirmed and membership activated
 */
export const membershipActivationEmail = (data: {
  userName: string
  membershipName: string
  membershipDuration: string
  startDate: string
  endDate: string | null
  price: number
  invoiceNumber: string
  benefitsList?: string[]
}): { subject: string; html: string } => {
  const benefits = data.benefitsList || [
    'Akses ke semua kursus eksklusif',
    'Bergabung dengan komunitas premium',
    'Database buyer & supplier internasional',
    'Template dokumen ekspor lengkap',
    'Konsultasi gratis dengan mentor',
  ]

  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">
      🎉 Selamat! Membership Anda Aktif
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Pembayaran Anda telah berhasil diproses dan membership <strong>${data.membershipName}</strong> Anda sudah aktif! 🚀
    </p>
    
    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #374151;">
        <tr>
          <td style="padding: 8px 0;"><strong>Paket Membership:</strong></td>
          <td style="text-align: right;">${data.membershipName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Durasi:</strong></td>
          <td style="text-align: right;">${data.membershipDuration}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Tanggal Mulai:</strong></td>
          <td style="text-align: right;">${data.startDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Berakhir Pada:</strong></td>
          <td style="text-align: right;">${data.endDate || 'Selamanya'}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0 8px;"><strong>Total Pembayaran:</strong></td>
          <td style="text-align: right; color: ${BRAND_COLOR}; font-size: 20px; font-weight: bold;">
            Rp ${data.price.toLocaleString('id-ID')}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #6b7280;">Invoice:</td>
          <td style="text-align: right; font-size: 12px; color: #6b7280;">${data.invoiceNumber}</td>
        </tr>
      </table>
    `)}
    
    <h3 style="margin: 32px 0 16px; color: #111827; font-size: 18px;">
      ✨ Benefit yang Anda Dapatkan:
    </h3>
    
    <ul style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 15px; line-height: 1.8;">
      ${benefits.map(benefit => `<li style="margin-bottom: 8px;">✅ ${benefit}</li>`).join('')}
    </ul>
    
    ${emailButton('🚀 Mulai Belajar Sekarang', `${APP_URL}/dashboard`)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      <strong>Tips:</strong> Jangan lupa lengkapi profil Anda dan bergabung dengan grup komunitas untuk networking dengan sesama eksportir! 💼
    </p>
  `

  return {
    subject: `🎊 Selamat! Membership ${data.membershipName} Anda Sudah Aktif`,
    html: emailWrapper(content)
  }
}

/**
 * 2. Payment Success Notification
 * Sent immediately when payment is confirmed
 */
export const paymentSuccessEmail = (data: {
  userName: string
  amount: number
  invoiceNumber: string
  paymentMethod: string
  transactionDate: string
  itemName: string
}): { subject: string; html: string } => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; line-height: 80px; font-size: 40px;">
        ✅
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; text-align: center;">
      Pembayaran Berhasil!
    </h2>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
      Halo <strong>${data.userName}</strong>,<br>
      Pembayaran Anda telah dikonfirmasi. Terima kasih! 🙏
    </p>
    
    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #374151;">
        <tr>
          <td style="padding: 8px 0;"><strong>Item:</strong></td>
          <td style="text-align: right;">${data.itemName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Metode Pembayaran:</strong></td>
          <td style="text-align: right;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Tanggal:</strong></td>
          <td style="text-align: right;">${data.transactionDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
          <td style="text-align: right; font-family: monospace;">${data.invoiceNumber}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0 8px;"><strong>Total Dibayar:</strong></td>
          <td style="text-align: right; color: ${BRAND_COLOR}; font-size: 22px; font-weight: bold;">
            Rp ${data.amount.toLocaleString('id-ID')}
          </td>
        </tr>
      </table>
    `)}
    
    ${emailButton('Lihat Invoice', `${APP_URL}/dashboard/transactions`)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Akses membership Anda akan aktif dalam beberapa saat.<br>
      Cek email berikutnya untuk detail lengkap!
    </p>
  `

  return {
    subject: `✅ Pembayaran Berhasil - Invoice ${data.invoiceNumber}`,
    html: emailWrapper(content)
  }
}

/**
 * 3. Membership Expiry Warning (7 days before)
 * Sent 7 days before membership expires
 */
export const membershipExpiryWarningEmail = (data: {
  userName: string
  membershipName: string
  expiryDate: string
  daysRemaining: number
  renewalUrl: string
}): { subject: string; html: string } => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: #f59e0b; border-radius: 50%; line-height: 80px; font-size: 40px;">
        ⚠️
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; text-align: center;">
      Membership Anda Akan Segera Berakhir
    </h2>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Kami mengingatkan bahwa membership <strong>${data.membershipName}</strong> Anda akan berakhir dalam <strong style="color: #dc2626;">${data.daysRemaining} hari</strong>.
    </p>
    
    ${infoBox(`
      <table style="width: 100%; font-size: 15px; color: #374151;">
        <tr>
          <td style="padding: 8px 0;"><strong>Paket Membership:</strong></td>
          <td style="text-align: right;">${data.membershipName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Tanggal Berakhir:</strong></td>
          <td style="text-align: right; color: #dc2626; font-weight: 600;">${data.expiryDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Sisa Waktu:</strong></td>
          <td style="text-align: right; color: #dc2626; font-weight: 600;">${data.daysRemaining} hari lagi</td>
        </tr>
      </table>
    `, '#fef3c7')}
    
    <p style="margin: 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Jangan sampai kehilangan akses ke semua benefit premium Anda! Perpanjang sekarang untuk terus menikmati:
    </p>
    
    <ul style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li style="margin-bottom: 8px;">✅ Akses kursus & materi eksklusif</li>
      <li style="margin-bottom: 8px;">✅ Komunitas & networking premium</li>
      <li style="margin-bottom: 8px;">✅ Database buyer & supplier</li>
      <li style="margin-bottom: 8px;">✅ Support prioritas dari mentor</li>
    </ul>
    
    ${emailButton('🔄 Perpanjang Membership', data.renewalUrl)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
      <strong>Catatan:</strong> Setelah membership berakhir, Anda akan kehilangan akses ke konten dan benefit premium. Perpanjang sekarang untuk tetap terhubung! 💪
    </p>
  `

  return {
    subject: `⚠️ Membership ${data.membershipName} Berakhir ${data.daysRemaining} Hari Lagi`,
    html: emailWrapper(content)
  }
}

/**
 * 4. Membership Expired Notification
 * Sent when membership has expired
 */
export const membershipExpiredEmail = (data: {
  userName: string
  membershipName: string
  expiredDate: string
  renewalUrl: string
}): { subject: string; html: string } => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: #dc2626; border-radius: 50%; line-height: 80px; font-size: 40px;">
        ⏰
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; text-align: center;">
      Membership Anda Telah Berakhir
    </h2>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Membership <strong>${data.membershipName}</strong> Anda telah berakhir pada <strong>${data.expiredDate}</strong>. Anda sekarang tidak lagi memiliki akses ke konten dan benefit premium.
    </p>
    
    ${infoBox(`
      <p style="margin: 0; color: #dc2626; font-size: 15px; line-height: 1.6;">
        <strong>⚠️ Akses Premium Tidak Aktif</strong><br>
        Untuk melanjutkan pembelajaran dan tetap terhubung dengan komunitas, silakan perpanjang membership Anda.
      </p>
    `, '#fee2e2')}
    
    <p style="margin: 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      <strong>Yang Anda lewatkan:</strong>
    </p>
    
    <ul style="margin: 0 0 24px; padding-left: 24px; color: #6b7280; font-size: 15px; line-height: 1.8;">
      <li style="margin-bottom: 8px;">❌ Akses ke 100+ kursus premium</li>
      <li style="margin-bottom: 8px;">❌ Grup komunitas eksklusif</li>
      <li style="margin-bottom: 8px;">❌ Database lengkap buyer & supplier</li>
      <li style="margin-bottom: 8px;">❌ Template dokumen & konsultasi</li>
    </ul>
    
    ${emailButton('🔄 Aktifkan Kembali', data.renewalUrl)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Terima kasih sudah menjadi bagian dari ${APP_NAME}. Kami tunggu kembali! 🙌
    </p>
  `

  return {
    subject: `😢 Membership ${data.membershipName} Anda Telah Berakhir`,
    html: emailWrapper(content)
  }
}

/**
 * 5. Membership Renewal Success
 * Sent when user renews their membership
 */
export const membershipRenewalEmail = (data: {
  userName: string
  membershipName: string
  newExpiryDate: string
  price: number
  invoiceNumber: string
}): { subject: string; html: string } => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; line-height: 80px; font-size: 40px;">
        🔄
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; text-align: center;">
      Membership Berhasil Diperpanjang!
    </h2>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Terima kasih telah memperpanjang membership <strong>${data.membershipName}</strong>! Akses premium Anda kini aktif hingga <strong>${data.newExpiryDate}</strong>. 🎉
    </p>
    
    ${infoBox(`
      <table style="width: 100%; font-size: 14px; color: #374151;">
        <tr>
          <td style="padding: 8px 0;"><strong>Paket Membership:</strong></td>
          <td style="text-align: right;">${data.membershipName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Aktif Hingga:</strong></td>
          <td style="text-align: right; color: #10b981; font-weight: 600;">${data.newExpiryDate}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0 8px;"><strong>Total Pembayaran:</strong></td>
          <td style="text-align: right; color: ${BRAND_COLOR}; font-size: 20px; font-weight: bold;">
            Rp ${data.price.toLocaleString('id-ID')}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #6b7280;">Invoice:</td>
          <td style="text-align: right; font-size: 12px; color: #6b7280;">${data.invoiceNumber}</td>
        </tr>
      </table>
    `, '#d1fae5')}
    
    ${emailButton('Lihat Dashboard', `${APP_URL}/dashboard/my-membership`)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Selamat belajar dan terus berkembang bersama ${APP_NAME}! 🚀
    </p>
  `

  return {
    subject: `🎉 Membership ${data.membershipName} Berhasil Diperpanjang`,
    html: emailWrapper(content)
  }
}

/**
 * 6. Welcome Email (for new members)
 * Sent to new users after registration
 */
export const welcomeEmail = (data: {
  userName: string
  userEmail: string
}): { subject: string; html: string } => {
  const content = `
    <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px;">
      Selamat Datang di ${APP_NAME}! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
      Terima kasih telah bergabung dengan ${APP_NAME}! Kami senang Anda memutuskan untuk memulai perjalanan ekspor bersama kami. 🚀
    </p>
    
    <h3 style="margin: 24px 0 16px; color: #111827; font-size: 18px;">
      🎯 Langkah Selanjutnya:
    </h3>
    
    <ol style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li style="margin-bottom: 12px;"><strong>Lengkapi Profil Anda</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Tambahkan informasi bisnis untuk networking yang lebih baik</span>
      </li>
      <li style="margin-bottom: 12px;"><strong>Jelajahi Kursus Gratis</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Mulai belajar dasar-dasar ekspor tanpa biaya</span>
      </li>
      <li style="margin-bottom: 12px;"><strong>Bergabung dengan Komunitas</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Terhubung dengan eksportir lainnya di grup publik</span>
      </li>
      <li style="margin-bottom: 12px;"><strong>Upgrade ke Premium</strong><br>
        <span style="color: #6b7280; font-size: 14px;">Dapatkan akses penuh ke semua fitur dan benefit eksklusif</span>
      </li>
    </ol>
    
    ${emailButton('Mulai Sekarang', `${APP_URL}/dashboard`)}
    
    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      <strong>Butuh bantuan?</strong> Tim support kami siap membantu Anda 24/7 via email atau WhatsApp.
    </p>
  `

  return {
    subject: `🎊 Selamat Datang di ${APP_NAME}, ${data.userName}!`,
    html: emailWrapper(content)
  }
}

/**
 * 7. Payment Rejected
 * Sent when admin rejects a pending payment
 */
export const paymentRejectedEmail = (data: {
  customerName: string
  customerEmail: string
  invoiceNumber: string
  productName: string
  amount: number
  rejectionReason: string
  supportEmail?: string
}) => {
  const content = `
<h2 style="margin: 0 0 24px; color: #dc2626; font-size: 24px;">
  ❌ Pembayaran Ditolak
</h2>

<p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
  Halo <strong>${data.customerName}</strong>,
</p>

<p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
  Kami informasikan bahwa pembayaran Anda untuk <strong>${data.productName}</strong> telah <span style="color: #dc2626; font-weight: bold;">ditolak</span> oleh tim kami.
</p>

${infoBox(`
  <p style="margin: 0 0 12px; color: #111827; font-size: 14px;"><strong>📋 Detail Transaksi:</strong></p>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Invoice Number:</td>
      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;"><code style="background-color: #fee2e2; padding: 4px 8px; border-radius: 4px;">${data.invoiceNumber}</code></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produk:</td>
      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.productName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Jumlah:</td>
      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Rp ${data.amount.toLocaleString('id-ID')}</td>
    </tr>
  </table>
`, '#fee2e2')}

${infoBox(`
  <p style="margin: 0 0 8px; color: #dc2626; font-size: 14px; font-weight: bold;">
    ⚠️ Alasan Penolakan:
  </p>
  <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
    ${data.rejectionReason}
  </p>
`, '#fef2f2')}

<p style="margin: 24px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
  <strong>Langkah selanjutnya:</strong>
</p>

<ul style="margin: 12px 0; padding-left: 24px; color: #374151; font-size: 15px; line-height: 1.8;">
  <li>Pastikan bukti pembayaran valid dan sesuai nominal</li>
  <li>Cek kembali detail pembayaran (jumlah, rekening tujuan, dll)</li>
  <li>Hubungi tim support kami jika Anda memerlukan bantuan</li>
  <li>Anda bisa melakukan pembelian baru jika diperlukan</li>
</ul>

${emailButton('Hubungi Support', `mailto:${data.supportEmail || SUPPORT_EMAIL}`, '#dc2626')}

<p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
  Mohon maaf atas ketidaknyamanan ini. Tim kami siap membantu Anda.
</p>

<p style="margin: 16px 0 0; color: #374151; font-size: 15px;">
  Salam hangat,<br>
  <strong>Tim ${APP_NAME}</strong>
</p>
`

  return {
    subject: `❌ Pembayaran Ditolak - ${data.invoiceNumber}`,
    html: emailWrapper(content),
  }
}

// Export all templates
export const emailTemplates = {
  membershipActivation: membershipActivationEmail,
  paymentSuccess: paymentSuccessEmail,
  paymentRejected: paymentRejectedEmail,
  membershipExpiryWarning: membershipExpiryWarningEmail,
  membershipExpired: membershipExpiredEmail,
  membershipRenewal: membershipRenewalEmail,
  welcome: welcomeEmail,
}

