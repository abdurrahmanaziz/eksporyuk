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

const template = {
  slug: 'password-reset-confirmation',
  name: 'Password Reset Confirmation',
  description: 'Email konfirmasi setelah password berhasil direset',
  type: 'EMAIL',
  category: 'AUTHENTICATION',
  subject: '✅ Password Berhasil Direset - EksporYuk',
  content: getModernEmailTemplate(`
    <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">✅ Password Berhasil Direset</h1>
    <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #10b981;">{{userName}}</strong>,</p>
    <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Password akun Anda telah berhasil direset.</p>
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <p style="color: #065f46; font-size: 15px; font-weight: 600; margin: 0 0 10px;">📅 Tanggal & Waktu Reset:</p>
      <p style="color: #047857; font-size: 15px; margin: 0;">{{resetDate}}</p>
    </div>
    <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 25px 0;">Sekarang Anda dapat login dengan password baru Anda.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">🔓 Login Sekarang</a>
    </div>
    <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <p style="color: #856404; font-size: 15px; font-weight: 600; margin: 0 0 10px;">⚠️ Jika Anda Tidak Melakukan Perubahan Ini</p>
      <p style="color: #856404; font-size: 14px; margin: 0;">Segera hubungi tim support kami untuk mengamankan akun Anda. Ada kemungkinan akun Anda telah diakses oleh pihak yang tidak berwenang.</p>
    </div>
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="color: #4b5563; font-size: 14px; margin: 0 0 10px;"><strong>💡 Tips Keamanan:</strong></p>
      <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Gunakan password yang kuat dan unik</li>
        <li>Jangan bagikan password kepada siapapun</li>
        <li>Aktifkan autentikasi 2 faktor jika tersedia</li>
        <li>Logout dari perangkat yang tidak dikenal</li>
      </ul>
    </div>
    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0; font-style: italic;">Butuh bantuan? Hubungi tim support kami kapan saja.</p>
  `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
  isActive: true
}

async function addTemplate() {
  console.log('\n✅ Adding Password Reset Confirmation template...\n')
  
  try {
    const existing = await prisma.brandedTemplate.findUnique({
      where: { slug: template.slug }
    })
    
    if (existing) {
      console.log('⚠️  Template already exists, updating...')
      await prisma.brandedTemplate.update({
        where: { slug: template.slug },
        data: {
          name: template.name,
          description: template.description,
          subject: template.subject,
          content: template.content,
          category: template.category
        }
      })
      console.log('✅ Updated: Password Reset Confirmation template')
    } else {
      await prisma.brandedTemplate.create({ data: template })
      console.log('✅ Created: Password Reset Confirmation template')
    }
    
    console.log('\n📊 Template details:')
    console.log('   Slug:', template.slug)
    console.log('   Subject:', template.subject)
    console.log('   Category:', template.category)
    console.log('   Variables: userName, resetDate, loginUrl')
    
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
  
  await prisma.$disconnect()
}

addTemplate().catch(console.error)
