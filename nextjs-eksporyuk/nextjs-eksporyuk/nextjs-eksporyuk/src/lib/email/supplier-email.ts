/**
 * Supplier Email Notifications
 * Send emails for supplier system events using Mailketing API
 */

import { mailketing } from '@/lib/integrations/mailketing'

interface SupplierWelcomeEmailData {
  email: string
  name: string
  companyName: string
  packageName: string
  packageTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  dashboardUrl: string
}

interface PaymentConfirmationEmailData {
  email: string
  name: string
  companyName: string
  packageName: string
  amount: number
  transactionId: string
  invoiceUrl: string
  endDate: Date
}

interface VerificationEmailData {
  email: string
  name: string
  companyName: string
  status: 'APPROVED' | 'REJECTED'
  reason?: string
  profileUrl: string
}

/**
 * Send welcome email after supplier registration
 */
export async function sendSupplierWelcomeEmail(data: SupplierWelcomeEmailData): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  try {
    const result = await mailketing.sendEmail({
      to: data.email,
      subject: `Selamat Bergabung di Ekspor Yuk - ${data.companyName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .welcome-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .feature-list { margin: 20px 0; }
    .feature-item { display: flex; align-items: start; margin: 15px 0; }
    .feature-icon { background: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold; }
    .cta-button { display: inline-block; background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .cta-button:hover { background: #1d4ed8; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .badge { display: inline-block; background: #fbbf24; color: #78350f; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Selamat Bergabung!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Akun Supplier Anda Telah Aktif</p>
    </div>
    
    <div class="content">
      <p>Halo <strong>${data.name}</strong>,</p>
      
      <div class="welcome-box">
        <h3 style="margin-top: 0; color: #2563eb;">Selamat Datang di Ekspor Yuk!</h3>
        <p style="margin-bottom: 0;">
          Akun supplier untuk <strong>${data.companyName}</strong> telah berhasil dibuat dengan paket <strong>${data.packageName}</strong>.
        </p>
        ${data.packageTier === 'PREMIUM' ? '<div class="badge">✨ PREMIUM MEMBER</div>' : ''}
      </div>

      <h3>Langkah Selanjutnya:</h3>
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">1</div>
          <div>
            <strong>Lengkapi Profil Perusahaan</strong><br>
            <span style="color: #6b7280;">Upload logo, banner, dan informasi bisnis Anda</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">2</div>
          <div>
            <strong>Tambahkan Produk</strong><br>
            <span style="color: #6b7280;">Showcase produk ekspor Anda ke calon buyer</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">3</div>
          <div>
            <strong>Upload Dokumen Legalitas</strong><br>
            <span style="color: #6b7280;">Dapatkan badge verifikasi untuk meningkatkan kredibilitas</span>
          </div>
        </div>
      </div>

      ${data.packageTier === 'FREE' ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <strong style="color: #92400e;">💡 Tips:</strong> Upgrade ke <strong>Premium</strong> untuk mendapatkan:
          <ul style="margin: 10px 0 0 20px; color: #78350f;">
            <li>Unlimited produk</li>
            <li>Tombol kontak WhatsApp & Email di profil public</li>
            <li>Chat langsung dengan buyer</li>
            <li>Prioritas tampil di direktori</li>
          </ul>
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" class="cta-button">Masuk ke Dashboard</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>Ekspor Yuk</strong></p>
      <p style="margin: 0; font-size: 13px;">Platform Ekspor Terpercaya Indonesia</p>
      <p style="margin: 15px 0 0 0;">
        <a href="${appUrl}" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Website</a> |
        <a href="mailto:support@eksporyuk.com" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
      tags: ['supplier', 'welcome']
    })

    if (result.success) {
      console.log('✅ Supplier welcome email sent via Mailketing')
      return true
    } else {
      console.error('❌ Mailketing error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Error sending supplier welcome email:', error)
    return false
  }
}

/**
 * Send payment confirmation email
 */
export async function sendSupplierPaymentConfirmation(data: PaymentConfirmationEmailData): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  try {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(data.amount)

    const formattedEndDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(data.endDate))

    const result = await mailketing.sendEmail({
      to: data.email,
      subject: `✅ Pembayaran Berhasil - Membership ${data.packageName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px; overflow: hidden; }
    .invoice-table td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
    .invoice-table td:first-child { font-weight: 600; color: #6b7280; }
    .invoice-table tr:last-child td { border-bottom: none; }
    .amount { font-size: 28px; font-weight: bold; color: #10b981; margin: 10px 0; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .cta-button:hover { background: #059669; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pembayaran Berhasil</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Membership Anda Telah Aktif</p>
    </div>
    
    <div class="content">
      <p>Halo <strong>${data.name}</strong>,</p>
      
      <div class="success-box">
        <div class="success-icon">🎉</div>
        <h3 style="margin: 10px 0; color: #065f46;">Pembayaran Berhasil Dikonfirmasi!</h3>
        <p style="margin: 10px 0 0 0; color: #047857;">Membership <strong>${data.companyName}</strong> telah diaktifkan.</p>
      </div>

      <h3>Detail Pembayaran:</h3>
      <table class="invoice-table">
        <tr>
          <td>Paket Membership</td>
          <td><strong>${data.packageName}</strong></td>
        </tr>
        <tr>
          <td>ID Transaksi</td>
          <td>${data.transactionId}</td>
        </tr>
        <tr>
          <td>Jumlah Dibayar</td>
          <td><strong style="color: #10b981;">${formattedAmount}</strong></td>
        </tr>
        <tr>
          <td>Berlaku Hingga</td>
          <td><strong>${formattedEndDate}</strong></td>
        </tr>
      </table>

      <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 5px;">
        <strong style="color: #1e40af;">🚀 Akses Premium Anda Sudah Aktif!</strong>
        <p style="margin: 10px 0 0 0; color: #1e3a8a;">
          Sekarang Anda dapat menikmati semua fitur premium untuk mengembangkan bisnis ekspor Anda.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/supplier/dashboard" class="cta-button">Masuk ke Dashboard</a>
        <br>
        <a href="${data.invoiceUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px; margin-top: 10px; display: inline-block;">Download Invoice</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Terima kasih telah mempercayai Ekspor Yuk sebagai partner bisnis Anda!
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>Ekspor Yuk</strong></p>
      <p style="margin: 0; font-size: 13px;">Platform Ekspor Terpercaya Indonesia</p>
      <p style="margin: 15px 0 0 0;">
        <a href="${appUrl}" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Website</a> |
        <a href="mailto:support@eksporyuk.com" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
      tags: ['supplier', 'payment']
    })

    if (result.success) {
      console.log('✅ Supplier payment confirmation email sent via Mailketing')
      return true
    } else {
      console.error('❌ Mailketing error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
    return false
  }
}

/**
 * Send verification status email
 */
export async function sendSupplierVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
  const isApproved = data.status === 'APPROVED'

  try {
    const result = await mailketing.sendEmail({
      to: data.email,
      subject: isApproved 
        ? `${data.companyName} Telah Terverifikasi!`
        : `Verifikasi ${data.companyName} Ditolak`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, ${isApproved ? '#10b981' : '#ef4444'} 0%, ${isApproved ? '#059669' : '#dc2626'} 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .status-box { background: ${isApproved ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .cta-button { display: inline-block; background: ${isApproved ? '#10b981' : '#2563eb'}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isApproved ? '✅ Verifikasi Berhasil' : '❌ Verifikasi Ditolak'}</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Status Verifikasi ${data.companyName}</p>
    </div>
    
    <div class="content">
      <p>Halo <strong>${data.name}</strong>,</p>
      
      ${isApproved ? `
        <div class="status-box">
          <h3 style="margin-top: 0; color: #065f46;">🎉 Selamat! Perusahaan Anda Telah Terverifikasi</h3>
          <p style="margin-bottom: 0; color: #047857;">
            <strong>${data.companyName}</strong> telah berhasil diverifikasi oleh tim kami. Sekarang profil Anda akan mendapat badge "Verified" dan prioritas tampil di direktori supplier.
          </p>
        </div>

        <h3>Keuntungan Verifikasi:</h3>
        <ul>
          <li>✅ Badge "Verified" di profil public</li>
          <li>🔝 Prioritas tampil di halaman utama</li>
          <li>🌟 Meningkatkan kepercayaan buyer</li>
          <li>📈 Potensi lebih banyak inquiry</li>
        </ul>
      ` : `
        <div class="status-box">
          <h3 style="margin-top: 0; color: #991b1b;">Mohon Maaf, Verifikasi Belum Dapat Disetujui</h3>
          <p style="margin-bottom: 0; color: #b91c1c;">
            Permohonan verifikasi untuk <strong>${data.companyName}</strong> belum dapat kami setujui saat ini.
          </p>
        </div>

        ${data.reason ? `
          <h3>Alasan:</h3>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <p style="margin: 0; color: #78350f;">${data.reason}</p>
          </div>
        ` : ''}

        <h3>Langkah Selanjutnya:</h3>
        <ul>
          <li>Perbaiki dokumen sesuai catatan di atas</li>
          <li>Upload ulang dokumen legalitas yang valid</li>
          <li>Pastikan semua informasi perusahaan lengkap</li>
          <li>Ajukan verifikasi ulang</li>
        </ul>
      `}

      <div style="text-align: center;">
        <a href="${data.profileUrl}" class="cta-button">${isApproved ? 'Lihat Profil Anda' : 'Perbaiki Profil'}</a>
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Jika ada pertanyaan, silakan hubungi tim support kami.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>Ekspor Yuk</strong></p>
      <p style="margin: 0; font-size: 13px;">Platform Ekspor Terpercaya Indonesia</p>
      <p style="margin: 15px 0 0 0;">
        <a href="${appUrl}" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Website</a> |
        <a href="mailto:support@eksporyuk.com" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
      tags: ['supplier', 'verification']
    })

    if (result.success) {
      console.log('✅ Supplier verification email sent via Mailketing')
      return true
    } else {
      console.error('❌ Mailketing error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

interface UpgradeEmailData {
  email: string
  name: string
  companyName: string
  oldPackage: string
  newPackage: string
  amount: number
  endDate: Date
  dashboardUrl: string
}

/**
 * Send email after successful membership upgrade
 */
export async function sendSupplierUpgradeEmail(data: UpgradeEmailData): Promise<boolean> {
  try {
    const result = await mailketing.sendEmail({
      to: data.email,
      subject: `Membership Upgraded - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Upgrade Berhasil!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Selamat! Membership Anda telah ditingkatkan
              </p>
            </div>
            
            <!-- Content -->
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                Halo <strong>${data.name}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Terima kasih telah upgrade membership <strong>${data.companyName}</strong>!
              </p>

              <!-- Upgrade Info -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 10px; margin: 25px 0;">
                <div style="margin-bottom: 15px;">
                  <span style="color: #6b7280; font-size: 14px;">Upgrade dari:</span>
                  <div style="color: #374151; font-size: 18px; font-weight: 600; margin-top: 5px;">
                    ${data.oldPackage} → ${data.newPackage}
                  </div>
                </div>
                
                <div style="border-top: 1px solid #d1d5db; padding-top: 15px; margin-top: 15px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6b7280;">Biaya Upgrade:</span>
                    <strong style="color: #059669; font-size: 18px;">Rp ${data.amount.toLocaleString('id-ID')}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Aktif Hingga:</span>
                    <strong style="color: #374151;">${new Date(data.endDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              <!-- New Features -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">✨ Fitur Baru yang Bisa Anda Gunakan:</h3>
                <ul style="color: #78350f; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Produk Unlimited</li>
                  <li style="margin-bottom: 8px;">Badge Terverifikasi</li>
                  <li style="margin-bottom: 8px;">Direct Chat dengan Buyer</li>
                  <li style="margin-bottom: 8px;">Custom URL & Logo</li>
                  <li style="margin-bottom: 8px;">Analytics & Statistics</li>
                  <li style="margin-bottom: 8px;">Priority Ranking</li>
                  <li>Priority Support</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                  Mulai Gunakan Fitur Premium
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Butuh bantuan?</strong><br>
                Tim support kami siap membantu Anda memanfaatkan fitur-fitur premium.<br>
                Email: <a href="mailto:support@eksporyuk.com" style="color: #667eea;">support@eksporyuk.com</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} Ekspor Yuk. All rights reserved.
              </p>
              <p style="margin: 5px 0 0 0;">
                Platform Ekspor Indonesia
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      tags: ['supplier', 'upgrade']
    })

    if (result.success) {
      console.log('✅ Supplier upgrade email sent via Mailketing')
      return true
    } else {
      console.error('❌ Mailketing error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Error sending upgrade email:', error)
    return false
  }
}
