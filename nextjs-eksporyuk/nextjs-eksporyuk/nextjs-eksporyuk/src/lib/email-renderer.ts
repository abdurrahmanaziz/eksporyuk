import { prisma } from './prisma'

/**
 * Email Template Renderer
 * Render email template dengan variables dan branding
 */

interface RenderEmailOptions {
  templateCategory: string
  variables: Record<string, any>
  ctaOverride?: {
    text: string
    link: string
  }
}

// Replace variables in text
function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`
    const value = variables[key] || ''
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })
  
  return result
}

// Generate HTML with branding
function generateBrandedHTML(body: string, ctaText?: string, ctaLink?: string): string {
  // Convert line breaks to HTML paragraphs
  const paragraphs = body.split('\n\n').map(p => 
    p.trim() ? `<p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>` : ''
  ).join('')

  const ctaButton = ctaText && ctaLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${ctaLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                    color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                    font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
            ${ctaText}
          </a>
        </td>
      </tr>
    </table>
  ` : ''

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EksporYuk</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header dengan Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                    EksporYuk
                  </h1>
                  <p style="margin: 8px 0 0; color: #fed7aa; font-size: 14px; font-weight: 500;">
                    Platform Pembelajaran Ekspor Terpercaya
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${paragraphs}
                  ${ctaButton}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
                      Apa yang bisa Anda lakukan di EksporYuk?
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">
                            ✅ Belajar ekspor dari mentor berpengalaman
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">
                            ✅ Akses database buyer & supplier global
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">
                            ✅ Bergabung dengan komunitas eksportir
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">
                            ✅ Dapatkan sertifikat keahlian ekspor
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} EksporYuk. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      Platform pembelajaran ekspor terpercaya di Indonesia<br>
                      <a href="https://eksporyuk.com" style="color: #f97316; text-decoration: none;">eksporyuk.com</a>
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
}

/**
 * Render email from template
 */
export async function renderEmailTemplate(options: RenderEmailOptions) {
  const { templateCategory, variables, ctaOverride } = options

  try {
    // Find active template by category
    const template = await prisma.emailTemplate.findFirst({
      where: {
        category: templateCategory,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!template) {
      console.warn(`⚠️ No template found for category: ${templateCategory}`)
      return null
    }

    // Replace variables in subject and body
    const subject = replaceVariables(template.subject, variables)
    const body = replaceVariables(template.body, variables)

    // Use CTA from template or override
    const ctaText = ctaOverride?.text || replaceVariables(template.ctaText || '', variables)
    const ctaLink = ctaOverride?.link || replaceVariables(template.ctaLink || '', variables)

    // Generate HTML with branding
    const html = generateBrandedHTML(body, ctaText, ctaLink)

    // Plain text version
    const text = body.replace(/<[^>]*>/g, '')

    // Increment usage count
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } }
    })

    console.log(`✅ Email template rendered: ${template.name} (${templateCategory})`)

    return {
      subject,
      html,
      text,
      templateId: template.id,
      templateName: template.name
    }
  } catch (error) {
    console.error('❌ Error rendering email template:', error)
    return null
  }
}

/**
 * Default variables for common use cases
 */
export function getDefaultVariables(baseUrl: string = 'http://localhost:3000') {
  return {
    companyName: 'EksporYuk',
    supportEmail: 'support@eksporyuk.com',
    websiteUrl: baseUrl,
    loginUrl: `${baseUrl}/login`,
    dashboardUrl: `${baseUrl}/dashboard`,
    date: new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
