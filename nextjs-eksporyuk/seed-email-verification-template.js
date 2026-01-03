/**
 * Seed Branded Template untuk Email Verification
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedEmailVerificationTemplate() {
  try {
    console.log('🌱 Seeding Email Verification Template...')

    // Check if template already exists
    const existing = await prisma.brandedTemplate.findFirst({
      where: { slug: 'email-verification' }
    })

    if (existing) {
      console.log('ℹ️  Template email-verification sudah ada, skip...')
      await prisma.$disconnect()
      return
    }

    // Create template
    const template = await prisma.brandedTemplate.create({
      data: {
        id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        slug: 'email-verification',
        name: 'Email Verification',
        category: 'VERIFICATION',
        type: 'TRANSACTIONAL',
        subject: '✅ Verifikasi Email Anda - {site_name}',
        content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email - {site_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Selamat Datang di {site_name}!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 600;">
                Halo {name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Terima kasih telah mendaftar di <strong>{site_name}</strong> - Platform pembelajaran ekspor terpercaya di Indonesia!
              </p>
              
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; 
                              padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; 
                              font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                      ✓ Verifikasi Email Saya
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f97316;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; font-weight: 600;">
                  Atau salin link ini ke browser Anda:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="{verification_url}" style="color: #f97316; font-size: 13px; text-decoration: none;">
                    {verification_url}
                  </a>
                </p>
              </div>
              
              <!-- Info -->
              <div style="margin: 30px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⚠️ <strong>Penting:</strong> Link verifikasi ini akan kadaluarsa dalam 24 jam. 
                  Segera verifikasi email Anda untuk mengakses semua fitur {site_name}.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                <strong>Apa yang bisa Anda lakukan di {site_name}?</strong>
              </p>
              <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                ✅ Belajar ekspor dari mentor berpengalaman
              </p>
              <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                ✅ Akses database buyer & supplier global
              </p>
              <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                ✅ Bergabung dengan komunitas eksportir
              </p>
              <p style="margin: 0 0 25px; color: #6b7280; font-size: 13px;">
                ✅ Dapatkan sertifikat keahlian ekspor
              </p>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                  Jika Anda tidak mendaftar di {site_name}, abaikan email ini.
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © 2024-2026 {site_name}. All rights reserved.<br>
                  <a href="{site_url}" style="color: #f97316; text-decoration: none;">{site_url}</a>
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        ctaText: 'Verifikasi Email Saya',
        ctaLink: '{verification_url}',
        isActive: true,
        description: 'Template email untuk verifikasi akun user baru. Digunakan saat user register dan perlu memverifikasi email mereka.',
        usageCount: 0,
        updatedAt: new Date(),
        variables: {
          name: 'Nama user',
          email: 'Email user',
          verification_url: 'URL untuk verifikasi email',
          site_name: 'Nama website (EksporYuk)',
          site_url: 'URL website (https://eksporyuk.com)'
        }
      }
    })

    console.log('✅ Template email-verification berhasil dibuat!')
    console.log('   ID:', template.id)
    console.log('   Slug:', template.slug)
    console.log('   Category:', template.category)

    await prisma.$disconnect()

  } catch (error) {
    console.error('❌ Error seeding template:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seedEmailVerificationTemplate()
