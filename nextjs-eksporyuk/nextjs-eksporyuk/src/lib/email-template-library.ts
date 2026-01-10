// Professional Email Templates Library
export const emailTemplateLibrary = [
  {
    id: 'blank',
    name: 'Blank Template',
    category: 'Basic',
    thumbnail: '📄',
    description: 'Start from scratch',
    html: '<p>Start writing your email here...</p>',
  },
  {
    id: 'welcome_professional',
    name: 'Welcome - Professional',
    category: 'Onboarding',
    thumbnail: '👋',
    description: 'Professional welcome email with gradient header',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Selamat Datang! 🎉</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Terima kasih telah bergabung dengan {siteName}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Halo <strong>{name}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Selamat! Akun Anda telah berhasil dibuat. Kami sangat senang Anda bergabung dengan komunitas kami.
              </p>
              
              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">Yang Bisa Anda Lakukan:</h3>
                    <p style="color: #555555; margin: 8px 0; font-size: 14px;">✅ Akses kelas-kelas berkualitas</p>
                    <p style="color: #555555; margin: 8px 0; font-size: 14px;">✅ Download template gratis</p>
                    <p style="color: #555555; margin: 8px 0; font-size: 14px;">✅ Konsultasi dengan mentor</p>
                    <p style="color: #555555; margin: 8px 0; font-size: 14px;">✅ Bergabung dengan komunitas</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{dashboardUrl}" style="background-color: #667eea; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Mulai Belajar Sekarang
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Jika ada pertanyaan, jangan ragu untuk menghubungi tim support kami.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Email ini dikirim ke {email}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                &copy; 2024 {siteName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'invoice_modern',
    name: 'Invoice - Modern',
    category: 'Payment',
    thumbnail: '🧾',
    description: 'Modern invoice template with clean design',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #667eea; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🧾 INVOICE</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 18px;">#{invoiceId}</p>
            </td>
          </tr>
          <!-- Invoice Details -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top; width: 50%;">
                    <p style="color: #666666; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold;">Kepada:</p>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 5px 0; font-weight: bold;">{name}</p>
                    <p style="color: #666666; font-size: 14px; margin: 0;">{email}</p>
                  </td>
                  <td style="vertical-align: top; width: 50%; text-align: right;">
                    <p style="color: #666666; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold;">Tanggal:</p>
                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">{date}</p>
                    <p style="color: #666666; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold;">Jatuh Tempo:</p>
                    <p style="color: #333333; font-size: 14px; margin: 0;">{dueDate}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; border: 2px solid #667eea; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #e0e0e0;">
                    <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">Detail Pembelian</p>
                  </td>
                  <td style="background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: bold;">Jumlah</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <p style="color: #333333; font-size: 16px; margin: 0; font-weight: 500;">{productName}</p>
                  </td>
                  <td style="padding: 15px; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    <p style="color: #333333; font-size: 16px; margin: 0; font-weight: bold;">Rp {amount}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #667eea; padding: 20px;">
                    <p style="color: #ffffff; font-size: 18px; margin: 0; font-weight: bold;">TOTAL PEMBAYARAN</p>
                  </td>
                  <td style="background-color: #667eea; padding: 20px; text-align: right;">
                    <p style="color: #ffffff; font-size: 24px; margin: 0; font-weight: bold;">Rp {totalAmount}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <tr>
                  <td>
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>⏰ Batas Waktu Pembayaran:</strong><br>
                      Invoice ini akan expired dalam <strong>24 jam</strong>. Mohon segera lakukan pembayaran.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{paymentUrl}" style="background-color: #28a745; color: #ffffff; padding: 15px 50px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Bayar Sekarang
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Jika ada pertanyaan, hubungi: {supportEmail}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                &copy; 2024 {siteName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'notification_minimal',
    name: 'Notification - Minimal',
    category: 'Notification',
    thumbnail: '🔔',
    description: 'Clean minimal notification template',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0">
          <!-- Icon -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <span style="font-size: 40px;">🔔</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px; text-align: center;">
              <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                Notifikasi Penting
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Halo <strong>{name}</strong>,
              </p>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                [Isi notifikasi Anda di sini. Jelaskan dengan singkat dan jelas.]
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{actionUrl}" style="background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; font-size: 14px;">
                      Lihat Detail
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 20px 0;">
              <div style="height: 1px; background-color: #e0e0e0;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Email ini dikirim ke {email}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                {siteName} &copy; 2024
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    id: 'promo_vibrant',
    name: 'Promo - Vibrant',
    category: 'Marketing',
    thumbnail: '🎁',
    description: 'Eye-catching promo email template',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <!-- Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 2px;">
                🎁 SPECIAL OFFER
              </h1>
              <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; font-weight: bold;">
                Khusus Untuk Anda!
              </p>
            </td>
          </tr>
          <!-- Discount Badge -->
          <tr>
            <td align="center" style="padding: 30px 30px 0 30px;">
              <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); display: inline-block; padding: 20px 40px; border-radius: 50px; box-shadow: 0 5px 15px rgba(255,215,0,0.4);">
                <p style="color: #333333; margin: 0; font-size: 48px; font-weight: bold;">50% OFF</p>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                Halo <strong>{name}</strong>! 🎉
              </p>
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Dapatkan diskon <strong>50%</strong> untuk semua produk pilihan. Penawaran terbatas hanya untuk Anda!
              </p>
              
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <p style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 20px; margin: 5px; font-size: 14px; color: #555555;">
                      ⚡ Berlaku 24 Jam
                    </p>
                    <p style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 20px; margin: 5px; font-size: 14px; color: #555555;">
                      🎁 Gratis Ongkir
                    </p>
                    <p style="background-color: #f0f0f0; display: inline-block; padding: 10px 20px; border-radius: 20px; margin: 5px; font-size: 14px; color: #555555;">
                      ⭐ Bonus Eksklusif
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Countdown -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border: 2px dashed #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <tr>
                  <td align="center">
                    <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">
                      ⏰ Berakhir dalam: <span style="font-size: 18px;">{timeLeft}</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{promoUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; padding: 18px 50px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 5px 15px rgba(245,87,108,0.4); text-transform: uppercase; letter-spacing: 1px;">
                      Ambil Promo Sekarang!
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Email promo untuk {email}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                &copy; 2024 {siteName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
]
