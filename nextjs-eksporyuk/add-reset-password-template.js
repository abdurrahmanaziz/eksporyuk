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
  slug: 'reset-password',
  name: 'Reset Password',
  description: 'Email untuk reset password yang lupa',
  type: 'EMAIL',
  category: 'AUTHENTICATION',
  subject: '🔐 Reset Password - EksporYuk',
  content: getModernEmailTemplate(`
    <h1 style="color: #1a202c; margin: 0 0 20px; font-size: 32px; font-weight: 700;">Reset Password 🔐</h1>
    <p style="color: #2d3748; font-size: 17px; line-height: 1.7; margin: 0 0 20px;">Halo <strong style="color: #ef4444;">{{userName}}</strong>,</p>
    <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">Kami menerima permintaan untuk mereset password akun Anda di EksporYuk.</p>
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
      <p style="color: #78350f; font-size: 15px; margin: 0 0 20px;">Klik tombol di bawah untuk mereset password Anda:</p>
      <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);">🔓 Reset Password Sekarang</a>
    </div>
    <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <p style="color: #991b1b; font-size: 15px; font-weight: 600; margin: 0 0 15px;">⚠️ Penting - Harap Dibaca!</p>
      <ul style="color: #b91c1c; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Link ini hanya berlaku selama <strong>{{expiryTime}}</strong></li>
        <li style="margin-bottom: 8px;">Jangan bagikan link ini kepada siapapun</li>
        <li style="margin-bottom: 8px;">Jika Anda tidak meminta reset password, abaikan email ini</li>
        <li>Akun Anda tetap aman sampai Anda klik link reset</li>
      </ul>
    </div>
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="color: #4b5563; font-size: 13px; margin: 0 0 10px;"><strong>Atau copy link berikut ke browser:</strong></p>
      <p style="color: #667eea; font-size: 12px; word-break: break-all; margin: 0; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">{{resetLink}}</p>
    </div>
    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0; font-style: italic;">Butuh bantuan? Hubungi tim support kami.</p>
  `, 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'),
  isActive: true
}

async function addTemplate() {
  console.log('\n🔐 Adding Reset Password template...\n')
  
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
      console.log('✅ Updated: Reset Password template')
    } else {
      await prisma.brandedTemplate.create({ data: template })
      console.log('✅ Created: Reset Password template')
    }
    
    console.log('\n📊 Template details:')
    console.log('   Slug:', template.slug)
    console.log('   Subject:', template.subject)
    console.log('   Category:', template.category)
    console.log('   Variables: userName, resetLink, expiryTime')
    
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
  
  await prisma.$disconnect()
}

addTemplate().catch(console.error)
