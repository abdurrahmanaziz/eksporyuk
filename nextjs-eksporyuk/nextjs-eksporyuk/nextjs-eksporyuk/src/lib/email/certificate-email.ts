/**
 * Certificate Email Service
 * Send certificate via email using Mailketing API
 */

import { mailketing } from '@/lib/integrations/mailketing'

interface CertificateEmailData {
  email: string
  name: string
  courseName: string
  certificateNumber: string
  verificationUrl: string
  pdfUrl: string
  completionDate: Date
}

/**
 * Send certificate email with PDF attachment
 */
export async function sendCertificateEmail(data: CertificateEmailData): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  try {
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(data.completionDate))

    const result = await mailketing.sendEmail({
      to: data.email,
      subject: `Selamat! Sertifikat "${data.courseName}" Sudah Tersedia`,
      html: generateCertificateEmailTemplate(data, formattedDate, appUrl),
      tags: ['certificate', 'completion']
    })

    if (result.success) {
      console.log('✅ Certificate email sent via Mailketing:', data.certificateNumber)
      return true
    } else {
      console.error('❌ Mailketing error:', result.error)
      return false
    }
  } catch (error) {
    console.error('Send certificate email error:', error)
    return false
  }
}

/**
 * Generate HTML email template for certificate
 */
function generateCertificateEmailTemplate(
  data: CertificateEmailData, 
  formattedDate: string, 
  appUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sertifikat Kursus</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
                    🎓 Selamat!
                  </h1>
                  <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95;">
                    Sertifikat Kursus Anda Sudah Tersedia
                  </p>
                </td>
              </tr>
              
              <!-- Body content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                    Hai ${data.name}! 👋
                  </h2>
                  
                  <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Selamat atas pencapaian luar biasa Anda! Kami dengan bangga mengumumkan bahwa Anda telah berhasil menyelesaikan kursus:
                  </p>
                  
                  <!-- Course info box -->
                  <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; padding: 20px; margin: 0 0 25px 0; border-radius: 8px;">
                    <h3 style="color: #667eea; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                      ${data.courseName}
                    </h3>
                    <p style="color: #4a5568; margin: 0; font-size: 14px;">
                      <strong>Tanggal Penyelesaian:</strong> ${formattedDate}
                    </p>
                    <p style="color: #4a5568; margin: 8px 0 0 0; font-size: 14px;">
                      <strong>Nomor Sertifikat:</strong> <code style="background: #f7fafc; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.certificateNumber}</code>
                    </p>
                  </div>
                  
                  <p style="color: #4a5568; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    Sertifikat Anda dapat diunduh dan dibagikan kepada employer, klien, atau di platform profesional seperti LinkedIn untuk meningkatkan kredibilitas Anda.
                  </p>
                  
                  <!-- Action buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px 0;">
                    <tr>
                      <td style="padding-right: 10px;">
                        <a href="${appUrl}/certificates" style="display: inline-block; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          📥 Lihat & Download Sertifikat
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 12px;">
                        <a href="${appUrl}${data.verificationUrl}" style="display: inline-block; width: 100%; padding: 14px 24px; background-color: #f7fafc; color: #667eea; text-decoration: none; border-radius: 8px; border: 2px solid #667eea; font-weight: 600; text-align: center; font-size: 16px;">
                          ✓ Verifikasi Keaslian Sertifikat
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Certificate features -->
                  <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
                    <h4 style="color: #2d3748; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
                      📋 Yang Dapat Anda Lakukan:
                    </h4>
                    <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Download PDF sertifikat berkualitas tinggi</li>
                      <li>Scan QR code untuk verifikasi instant</li>
                      <li>Bagikan link verifikasi di LinkedIn</li>
                      <li>Tambahkan ke portfolio profesional Anda</li>
                      <li>Cetak sebagai sertifikat fisik</li>
                    </ul>
                  </div>
                  
                  <!-- Social proof -->
                  <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
                    💡 <strong>Tips:</strong> Tambahkan sertifikat ini ke profil LinkedIn Anda di bagian "Licenses & Certifications" untuk meningkatkan kredibilitas profesional.
                  </p>
                  
                  <!-- Verification info -->
                  <div style="background-color: #edf2f7; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;">
                    <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>🔒 Verifikasi Keaslian:</strong><br>
                      Setiap sertifikat dilengkapi dengan QR code unik dan nomor sertifikat yang dapat diverifikasi secara publik. Siapapun dapat memvalidasi keaslian sertifikat Anda melalui halaman verifikasi kami.
                    </p>
                  </div>
                  
                  <p style="color: #4a5568; line-height: 1.6; margin: 0; font-size: 16px;">
                    Terima kasih telah belajar bersama kami. Terus tingkatkan skill Anda dengan mengambil kursus lainnya!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">
                    Jika Anda memiliki pertanyaan, silakan hubungi kami
                  </p>
                  <p style="color: #a0aec0; margin: 0; font-size: 13px;">
                    © ${new Date().getFullYear()} EksporYuk. All rights reserved.
                  </p>
                  <p style="color: #a0aec0; margin: 10px 0 0 0; font-size: 12px;">
                    Email ini dikirim otomatis, mohon tidak membalas email ini.
                  </p>
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
 * Send certificate reminder email (for users who haven't downloaded yet)
 */
export async function sendCertificateReminderEmail(
  email: string,
  name: string,
  courseName: string,
  certificateNumber: string
): Promise<boolean> {
  const mailketingApiKey = process.env.MAILKETING_API_KEY
  const mailketingUrl = process.env.MAILKETING_API_URL || 'https://be.mailketing.co.id'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()

  if (!mailketingApiKey) {
    console.warn('Mailketing API key not configured')
    return false
  }

  try {
    const emailData = {
      to: email,
      subject: `🔔 Reminder: Jangan Lupa Download Sertifikat "${courseName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1a202c; margin: 0 0 20px 0;">Hai ${name}! 👋</h2>
                      <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0;">
                        Kami ingin mengingatkan bahwa sertifikat untuk kursus <strong>"${courseName}"</strong> sudah tersedia dan siap didownload.
                      </p>
                      <p style="color: #4a5568; line-height: 1.6; margin: 0 0 25px 0;">
                        Jangan lewatkan kesempatan untuk menambahkan pencapaian ini ke portfolio profesional Anda!
                      </p>
                      <a href="${appUrl}/certificates" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Download Sertifikat Sekarang
                      </a>
                      <p style="color: #718096; line-height: 1.6; margin: 25px 0 0 0; font-size: 14px;">
                        Nomor Sertifikat: <code style="background: #f7fafc; padding: 2px 6px; border-radius: 4px;">${certificateNumber}</code>
                      </p>
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

    const response = await fetch(`${mailketingUrl}/v1/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailketingApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      throw new Error('Mailketing API error')
    }

    return true
  } catch (error) {
    console.error('Send reminder email error:', error)
    return false
  }
}
