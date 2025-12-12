const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Modern email template dengan logo dan footer
function getModernEmailTemplate(bodyContent, headerGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EksporYuk</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background: ${headerGradient}; padding: 40px 40px 30px; text-align: center;">
              <img src="{{logoUrl}}" alt="EksporYuk" style="max-width: 180px; height: auto; margin-bottom: 10px;">
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 50px 40px;">
              ${bodyContent}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); padding: 40px; color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center; padding-bottom: 25px;">
                    <img src="{{logoUrl}}" alt="EksporYuk" style="max-width: 120px; height: auto; opacity: 0.9;">
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e0;">
                      {{footerText}}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 25px;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="{{footerInstagram}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none; transition: all 0.3s;">
                            <span style="color: #ffffff; font-size: 18px;">📷</span>
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="{{footerFacebook}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="color: #ffffff; font-size: 18px;">👥</span>
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="{{footerLinkedin}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="color: #ffffff; font-size: 18px;">💼</span>
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="{{footerWebsite}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;">
                            <span style="color: #ffffff; font-size: 18px;">🌐</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;">
                      <strong>{{footerCompany}}</strong>
                    </p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;">
                      📍 {{footerAddress}}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;">
                      📧 <a href="mailto:{{footerEmail}}" style="color: #90cdf4; text-decoration: none;">{{footerEmail}}</a>
                    </p>
                    <p style="margin: 0 0 15px; font-size: 13px; color: #a0aec0;">
                      📱 <a href="tel:{{footerPhone}}" style="color: #90cdf4; text-decoration: none;">{{footerPhone}}</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #718096;">
                      {{footerCopyright}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

const templates = [
  {
    slug: 'welcome-email',
    name: 'Welcome Email',
    subject: '🎉 Selamat Datang di EksporYuk!',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700; line-height: 1.2;">
        Selamat Datang! 🎉
      </h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">
        Halo <strong style="color: #667eea;">{{userName}}</strong>,
      </p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
        Terima kasih telah bergabung dengan <strong>EksporYuk</strong>! Kami sangat senang Anda menjadi bagian dari komunitas eksportir Indonesia yang terus berkembang.
      </p>
      <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <p style="color: #2d3748; font-size: 15px; font-weight: 600; margin: 0 0 15px;">🚀 Yang Bisa Anda Lakukan:</p>
        <ul style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Akses ribuan materi pembelajaran ekspor</li>
          <li style="margin-bottom: 8px;">Bergabung dengan webinar & workshop eksklusif</li>
          <li style="margin-bottom: 8px;">Konsultasi langsung dengan mentor berpengalaman</li>
          <li style="margin-bottom: 8px;">Networking dengan sesama eksportir</li>
          <li>Akses tools & template bisnis ekspor</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s;">
          🎯 Mulai Belajar Sekarang
        </a>
      </div>
      <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0; font-style: italic;">
        Jika ada pertanyaan, jangan ragu untuk menghubungi tim support kami. Kami siap membantu!
      </p>
    `, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  },
  {
    slug: 'payment-success',
    name: 'Payment Success',
    subject: '✅ Pembayaran Berhasil - EksporYuk',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700; line-height: 1.2;">
        Pembayaran Berhasil! ✅
      </h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">
        Halo <strong style="color: #10b981;">{{userName}}</strong>,
      </p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
        Terima kasih! Pembayaran Anda telah berhasil diproses. Berikut detail transaksinya:
      </p>
      <div style="background: linear-gradient(135deg, #10b98115 0%, #059f6815 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 30px; margin: 25px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Jumlah Pembayaran:</td>
            <td style="padding: 8px 0; text-align: right; color: #1a202c; font-size: 18px; font-weight: 700;">{{amount}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Nomor Invoice:</td>
            <td style="padding: 8px 0; text-align: right; color: #667eea; font-weight: 600;">{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Tanggal:</td>
            <td style="padding: 8px 0; text-align: right; color: #4a5568;">{{date}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Status:</td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="background: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">LUNAS</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
          📊 Lihat Dashboard
        </a>
      </div>
    `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
  },
  {
    slug: 'membership-active',
    name: 'Membership Active',
    subject: '🎊 Membership {{membershipName}} Anda Aktif!',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700; line-height: 1.2;">
        Membership Aktif! 🎊
      </h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">
        Halo <strong style="color: #f59e0b;">{{userName}}</strong>,
      </p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
        Selamat! Membership <strong style="color: #f59e0b;">{{membershipName}}</strong> Anda telah aktif dan siap digunakan.
      </p>
      <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9730815 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 25px 0;">
        <p style="color: #2d3748; font-size: 15px; font-weight: 600; margin: 0 0 15px;">📋 Detail Membership:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Nama Paket:</td>
            <td style="padding: 8px 0; text-align: right; color: #f59e0b; font-weight: 700;">{{membershipName}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Berlaku Hingga:</td>
            <td style="padding: 8px 0; text-align: right; color: #1a202c; font-weight: 600;">{{expiryDate}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Invoice:</td>
            <td style="padding: 8px 0; text-align: right; color: #667eea;">{{invoiceNumber}}</td>
          </tr>
        </table>
      </div>
      <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
        <p style="color: #2d3748; font-size: 15px; font-weight: 600; margin: 0 0 15px;">🎁 Benefit Yang Anda Dapatkan:</p>
        <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Akses unlimited ke semua kursus & materi</li>
          <li style="margin-bottom: 8px;">Webinar eksklusif setiap minggu</li>
          <li style="margin-bottom: 8px;">Konsultasi 1-on-1 dengan mentor</li>
          <li style="margin-bottom: 8px;">Sertifikat untuk setiap kursus</li>
          <li>Akses ke komunitas premium</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);">
          🚀 Mulai Belajar
        </a>
      </div>
    `, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
  },
  {
    slug: 'membership-expiring',
    name: 'Membership Expiring Soon',
    subject: '⏰ Membership Anda Akan Berakhir dalam {{daysLeft}} Hari',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700; line-height: 1.2;">
        Perpanjang Membership ⏰
      </h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">
        Halo <strong style="color: #ef4444;">{{userName}}</strong>,
      </p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
        Membership <strong>{{membershipName}}</strong> Anda akan berakhir dalam <strong style="color: #ef4444;">{{daysLeft}} hari</strong>.
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <p style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0 0 10px;">⚠️ Jangan Sampai Kehilangan Akses!</p>
        <p style="color: #78350f; font-size: 15px; margin: 0;">
          Tanggal berakhir: <strong>{{expiryDate}}</strong>
        </p>
      </div>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 25px 0;">
        Perpanjang sekarang untuk tetap menikmati semua benefit tanpa gangguan.
      </p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{renewUrl}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);">
          🔄 Perpanjang Sekarang
        </a>
      </div>
    `, 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)')
  }
]

async function updateTemplates() {
  console.log('\n🎨 Updating templates dengan modern design...\n')
  
  let updated = 0
  let failed = 0
  
  for (const template of templates) {
    try {
      await prisma.brandedTemplate.updateMany({
        where: { slug: template.slug },
        data: {
          name: template.name,
          subject: template.subject,
          content: template.content
        }
      })
      console.log(`✅ Updated: ${template.name}`)
      updated++
    } catch (error) {
      console.error(`❌ Failed to update ${template.name}:`, error.message)
      failed++
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  await prisma.$disconnect()
}

updateTemplates().catch(console.error)
