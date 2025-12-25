import { PrismaClient } from '@prisma/client'
import { mailketing } from './src/lib/integrations/mailketing.ts'

const prisma = new PrismaClient()

async function sendTestEmail() {
  try {
    console.log('\n🧪 Testing Branded Email with Logo...\n')
    
    // Get settings untuk logo
    const settings = await prisma.settings.findFirst()
    const logoUrl = settings?.siteLogo || 'https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=EksporYuk'
    
    console.log('📸 Logo URL:', logoUrl)
    console.log('🏢 Company:', settings?.emailFooterCompany || 'PT EksporYuk')
    
    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              <img src="${logoUrl}" alt="EksporYuk" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
              <div style="margin-top: 16px; color: #ffffff; font-size: 14px; opacity: 0.9;">
                ${settings?.emailFooterCompany || 'PT EksporYuk Indonesia'}
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">🎉 Test Email - Logo Display</h2>
              
              <p style="margin: 16px 0; line-height: 1.6; color: #374151;">
                Halo! Ini adalah test email untuk memastikan logo tampil dengan benar di inbox Gmail Anda.
              </p>
              
              <p style="margin: 16px 0; line-height: 1.6; color: #374151;">
                Jika Anda melihat email ini dengan logo <strong>PT. EksporYuk Indonesia</strong> di header dengan background biru gradient, berarti sistem branded email sudah berfungsi sempurna! ✅
              </p>
              
              <ul style="margin: 16px 0; padding-left: 20px; color: #374151;">
                <li style="margin: 8px 0;">✅ Logo dari Vercel Blob Storage</li>
                <li style="margin: 8px 0;">✅ HTML email wrapper otomatis</li>
                <li style="margin: 8px 0;">✅ Responsive design</li>
                <li style="margin: 8px 0;">✅ Professional branding</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/admin/branded-templates" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Lihat Templates
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Terima kasih telah menggunakan sistem Branded Email Templates
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
    
    // Send via Mailketing
    console.log('\n📧 Sending email via Mailketing API...')
    
    const result = await mailketing.sendEmail({
      to: 'abdurrahmanalaziz@gmail.com', // GANTI dengan email Anda
      subject: '[TEST] 📧 Logo Display Test - EksporYuk Branded Email',
      html: htmlContent
    })
    
    if (result.success) {
      console.log('\n✅ Email berhasil dikirim!')
      console.log('📬 Cek inbox Anda: abdurrahmanalaziz@gmail.com')
      console.log('📁 Jika tidak ada di inbox, cek folder Spam/Promosi')
      console.log('\n🔍 Yang harus terlihat:')
      console.log('   1. Logo EksporYuk di header (background biru gradient)')
      console.log('   2. Teks dengan formatting rapi')
      console.log('   3. Tombol CTA biru')
      console.log('   4. Footer dengan copyright')
    } else {
      console.log('\n❌ Email gagal dikirim')
      console.log('Error:', result.error)
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

sendTestEmail()
