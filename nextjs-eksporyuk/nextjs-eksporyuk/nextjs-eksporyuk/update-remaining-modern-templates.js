const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: ${headerGradient}; padding: 40px 40px 30px; text-align: center;">
              <img src="{{logoUrl}}" alt="EksporYuk" style="max-width: 180px; height: auto; margin-bottom: 10px;">
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px;">
              ${bodyContent}
            </td>
          </tr>
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
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e0;">{{footerText}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-bottom: 25px;">
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px;"><a href="{{footerInstagram}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;"><span style="color: #ffffff; font-size: 18px;">📷</span></a></td>
                        <td style="padding: 0 10px;"><a href="{{footerFacebook}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;"><span style="color: #ffffff; font-size: 18px;">👥</span></a></td>
                        <td style="padding: 0 10px;"><a href="{{footerLinkedin}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;"><span style="color: #ffffff; font-size: 18px;">💼</span></a></td>
                        <td style="padding: 0 10px;"><a href="{{footerWebsite}}" style="display: inline-block; width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; text-decoration: none;"><span style="color: #ffffff; font-size: 18px;">🌐</span></a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;"><strong>{{footerCompany}}</strong></p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;">📍 {{footerAddress}}</p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #a0aec0;">📧 <a href="mailto:{{footerEmail}}" style="color: #90cdf4; text-decoration: none;">{{footerEmail}}</a></p>
                    <p style="margin: 0 0 15px; font-size: 13px; color: #a0aec0;">📱 <a href="tel:{{footerPhone}}" style="color: #90cdf4; text-decoration: none;">{{footerPhone}}</a></p>
                    <p style="margin: 0; font-size: 12px; color: #718096;">{{footerCopyright}}</p>
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
    slug: 'credit-topup-success',
    name: 'Credit Top Up Success',
    subject: '✅ Top Up Kredit Berhasil - Rp {{amount}}',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Top Up Berhasil! ✅</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #10b981;">{{userName}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Top up kredit Anda sebesar <strong style="color: #10b981;">Rp {{amount}}</strong> telah berhasil diproses!</p>
      <div style="background: linear-gradient(135deg, #10b98115 0%, #059f6815 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 30px; margin: 25px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Jumlah Top Up:</td><td style="padding: 8px 0; text-align: right; color: #1a202c; font-size: 18px; font-weight: 700;">Rp {{amount}}</td></tr>
          <tr><td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Saldo Sebelum:</td><td style="padding: 8px 0; text-align: right; color: #4a5568;">Rp {{previousBalance}}</td></tr>
          <tr><td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Saldo Sekarang:</td><td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 700;">Rp {{newBalance}}</td></tr>
          <tr><td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Invoice:</td><td style="padding: 8px 0; text-align: right; color: #667eea;">{{invoiceNumber}}</td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{walletUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">�� Lihat Wallet</a>
      </div>
    `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
  },
  {
    slug: 'event-ticket-confirmed',
    name: 'Event Ticket Confirmed',
    subject: '🎟️ Tiket {{eventName}} Anda Telah Dikonfirmasi',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Tiket Terkonfirmasi! 🎟️</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #3b82f6;">{{userName}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Tiket Anda untuk <strong style="color: #3b82f6;">{{eventName}}</strong> telah dikonfirmasi!</p>
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 3px dashed #3b82f6; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <p style="color: #1e40af; font-size: 18px; font-weight: 700; margin: 0 0 15px;">📅 {{eventName}}</p>
        <p style="color: #1e3a8a; font-size: 15px; margin: 5px 0;">🕐 {{eventDate}} • {{eventTime}}</p>
        <p style="color: #1e3a8a; font-size: 15px; margin: 5px 0;">📍 {{eventLocation}}</p>
        <div style="margin: 20px 0; padding: 15px; background: #ffffff; border-radius: 8px;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 5px;">Kode Tiket</p>
          <p style="color: #3b82f6; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 3px;">{{ticketCode}}</p>
        </div>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #78350f; font-size: 14px; margin: 0;">💡 <strong>Tips:</strong> Simpan email ini dan tunjukkan kode tiket saat check-in!</p>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ticketUrl}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);">🎫 Lihat Tiket Digital</a>
      </div>
    `, 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')
  },
  {
    slug: 'event-reminder',
    name: 'Event Reminder',
    subject: '🔔 Reminder: {{eventName}} Dimulai {{timeUntilEvent}}',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Event Reminder! 🔔</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #8b5cf6;">{{userName}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Ini pengingat bahwa event <strong>{{eventName}}</strong> akan dimulai {{timeUntilEvent}}!</p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <p style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0 0 15px;">⏰ {{eventName}}</p>
        <p style="color: #78350f; font-size: 16px; margin: 5px 0;">📅 {{eventDate}}</p>
        <p style="color: #78350f; font-size: 16px; margin: 5px 0;">🕐 {{eventTime}}</p>
        <p style="color: #78350f; font-size: 16px; margin: 5px 0;">📍 {{eventLocation}}</p>
      </div>
      <div style="background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #5b21b6; font-size: 14px; margin: 0;">💡 <strong>Tips:</strong> Siapkan pertanyaan Anda dan jangan lupa bawa notebook!</p>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{eventUrl}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);">📅 Lihat Detail Event</a>
      </div>
    `, 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')
  },
  {
    slug: 'payout-approved',
    name: 'Payout Approved',
    subject: '💰 Pencairan Dana Disetujui - Rp {{amount}}',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Pencairan Disetujui! 💰</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #10b981;">{{userName}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Permintaan pencairan dana Anda sebesar <strong style="color: #10b981;">Rp {{amount}}</strong> telah disetujui!</p>
      <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 30px; margin: 25px 0;">
        <p style="color: #065f46; font-size: 15px; font-weight: 600; margin: 0 0 15px;">💵 Detail Pencairan:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding: 8px 0; color: #047857; font-size: 14px;">Jumlah:</td><td style="padding: 8px 0; text-align: right; color: #065f46; font-size: 18px; font-weight: 700;">Rp {{amount}}</td></tr>
          <tr><td style="padding: 8px 0; color: #047857; font-size: 14px;">Bank:</td><td style="padding: 8px 0; text-align: right; color: #065f46; font-weight: 600;">{{bankName}}</td></tr>
          <tr><td style="padding: 8px 0; color: #047857; font-size: 14px;">Rekening:</td><td style="padding: 8px 0; text-align: right; color: #065f46;">{{accountNumber}}</td></tr>
          <tr><td style="padding: 8px 0; color: #047857; font-size: 14px;">Atas Nama:</td><td style="padding: 8px 0; text-align: right; color: #065f46;">{{accountName}}</td></tr>
          <tr><td style="padding: 8px 0; color: #047857; font-size: 14px;">Referensi:</td><td style="padding: 8px 0; text-align: right; color: #667eea;">{{referenceNumber}}</td></tr>
        </table>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #78350f; font-size: 14px; margin: 0;">⏱️ Dana akan diproses dalam <strong>1-3 hari kerja</strong></p>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{transactionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">📊 Lihat Detail</a>
      </div>
    `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
  },
  {
    slug: 'membership-upgrade-prompt',
    name: 'Membership Upgrade Prompt',
    subject: '🚀 Upgrade ke Premium & Raih Lebih Banyak Manfaat!',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Upgrade ke Premium! 🚀</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #667eea;">{{userName}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Sudah {{daysSinceJoin}} hari Anda bersama kami! Saatnya tingkatkan pengalaman belajar Anda.</p>
      <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 12px; padding: 30px; margin: 25px 0;">
        <p style="color: #1a202c; font-size: 18px; font-weight: 700; margin: 0 0 15px;">�� Benefit Premium:</p>
        <ul style="color: #4a5568; font-size: 15px; line-height: 1.9; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 10px;">✅ Akses unlimited semua kursus</li>
          <li style="margin-bottom: 10px;">✅ Webinar eksklusif setiap minggu</li>
          <li style="margin-bottom: 10px;">✅ Konsultasi 1-on-1 dengan mentor</li>
          <li style="margin-bottom: 10px;">✅ Sertifikat resmi</li>
          <li style="margin-bottom: 10px;">✅ Komunitas premium</li>
          <li>✅ Akses tools & template</li>
        </ul>
      </div>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0;">🎁 {{discountText}}</p>
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{upgradeUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">⚡ Upgrade Sekarang</a>
      </div>
    `, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  },
  {
    slug: 'email-verification',
    name: 'Email Verification',
    subject: '✉️ Verifikasi Email Anda - EksporYuk',
    content: getModernEmailTemplate(`
      <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Verifikasi Email ✉️</h1>
      <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #667eea;">{{name}}</strong>,</p>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Terima kasih telah mendaftar di EksporYuk! Untuk melanjutkan, silakan verifikasi alamat email Anda.</p>
      <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <p style="color: #2d3748; font-size: 15px; margin: 0 0 20px;">Klik tombol di bawah untuk verifikasi:</p>
        <a href="{{verificationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);">✅ Verifikasi Email</a>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="color: #78350f; font-size: 14px; margin: 0;">⏰ Link ini akan kadaluarsa dalam <strong>24 jam</strong></p>
      </div>
      <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">Jika Anda tidak mendaftar di EksporYuk, abaikan email ini.</p>
    `, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  }
]

async function updateTemplates() {
  console.log('\n🎨 Updating remaining templates...\n')
  
  let updated = 0
  let failed = 0
  
  for (const template of templates) {
    try {
      const result = await prisma.brandedTemplate.updateMany({
        where: { slug: template.slug },
        data: {
          name: template.name,
          subject: template.subject,
          content: template.content
        }
      })
      
      if (result.count > 0) {
        console.log(`✅ Updated: ${template.name}`)
        updated++
      } else {
        console.log(`⚠️  Not found: ${template.name}`)
      }
    } catch (error) {
      console.error(`❌ Failed: ${template.name}`, error.message)
      failed++
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  await prisma.$disconnect()
}

updateTemplates().catch(console.error)
