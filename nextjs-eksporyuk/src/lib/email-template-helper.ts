import { prisma } from './prisma'
import { mailketing } from './integrations/mailketing'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

/**
 * Replace variables dalam string
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value || '')
  }
  return result
}

/**
 * Wrap email content dengan HTML template (logo, header, footer)
 */
function wrapEmailContent(
  content: string,
  options: {
    logoUrl: string
    companyName: string
    ctaText?: string
    ctaLink?: string
    footerText: string
    copyrightText: string
    socialMedia?: {
      instagram?: string
      facebook?: string
      linkedin?: string
    }
  }
): string {
  // Convert plain text content ke paragraphs
  const paragraphs = content
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Check if it's a list item
      if (p.startsWith('•') || p.startsWith('✓') || p.startsWith('✅') || p.startsWith('❌')) {
        const items = p.split('\n').map(item => item.trim()).filter(item => item.length > 0)
        return `<ul style="margin: 16px 0; padding-left: 20px; color: #374151;">${items.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('')}</ul>`
      }
      // Regular paragraph
      return `<p style="margin: 16px 0; line-height: 1.6; color: #374151;">${p.replace(/\n/g, '<br>')}</p>`
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              <img src="${options.logoUrl}" alt="${options.companyName}" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
              <div style="margin-top: 16px; color: #ffffff; font-size: 14px; opacity: 0.9;">
                ${options.companyName}
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${paragraphs}
              
              ${options.ctaText && options.ctaLink ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${options.ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      ${options.ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
              <!-- Social Media -->
              ${options.socialMedia && (options.socialMedia.instagram || options.socialMedia.facebook || options.socialMedia.linkedin) ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    ${options.socialMedia.instagram ? `<a href="${options.socialMedia.instagram}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="28" height="28" style="border-radius: 4px;"></a>` : ''}
                    ${options.socialMedia.facebook ? `<a href="${options.socialMedia.facebook}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" width="28" height="28" style="border-radius: 4px;"></a>` : ''}
                    ${options.socialMedia.linkedin ? `<a href="${options.socialMedia.linkedin}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="28" height="28" style="border-radius: 4px;"></a>` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Footer Text -->
              <p style="margin: 0 0 16px 0; text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${options.footerText}
              </p>
              
              <!-- Copyright -->
              <p style="margin: 0; text-align: center; color: #9ca3af; font-size: 12px;">
                ${options.copyrightText}
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
}

/**
 * Send email menggunakan BrandedTemplate system
 * 
 * @param to - Email recipient
 * @param templateSlug - Slug dari template (e.g., 'welcome-email')
 * @param variables - Object berisi key-value untuk replace {{variables}}
 * @param options - Optional settings (cc, bcc, attachments, etc)
 */
export async function sendBrandedEmail(
  to: string,
  templateSlug: string,
  variables: Record<string, string>,
  options?: {
    cc?: string
    bcc?: string
    replyTo?: string
    attachments?: any[]
  }
) {
  try {
    // Fetch template dari database
    const template = await prisma.brandedTemplate.findFirst({
      where: { 
        slug: templateSlug,
        isActive: true
      }
    })
    
    if (!template) {
      throw new Error(`Template '${templateSlug}' not found or inactive`)
    }
    
    // Fetch settings untuk logo dan footer
    const settings = await prisma.settings.findFirst()
    const logoUrl = settings?.siteLogo 
      ? (settings.siteLogo.startsWith('http') 
          ? settings.siteLogo 
          : `${process.env.NEXTAUTH_URL}${settings.siteLogo}`)
      : `${process.env.NEXTAUTH_URL}/logo-eksporyuk.png`
    
    // Auto-inject logo dan footer variables
    const enhancedVariables = {
      ...variables,
      logoUrl,
      footerCompany: settings?.emailFooterCompany || 'PT Ekspor Yuk Indonesia',
      footerAddress: settings?.emailFooterAddress || 'Jakarta, Indonesia',
      footerPhone: settings?.emailFooterPhone || '+62 812-3456-7890',
      footerEmail: settings?.emailFooterEmail || 'admin@eksporyuk.com',
      footerWebsite: settings?.emailFooterWebsiteUrl || 'https://eksporyuk.com',
      footerInstagram: settings?.emailFooterInstagramUrl || 'https://instagram.com/eksporyuk',
      footerFacebook: settings?.emailFooterFacebookUrl || 'https://facebook.com/eksporyuk',
      footerLinkedin: settings?.emailFooterLinkedinUrl || 'https://linkedin.com/company/eksporyuk',
      footerText: settings?.emailFooterText || 'Platform pembelajaran ekspor terpercaya',
      footerCopyright: settings?.emailFooterCopyrightText || '© 2025 EksporYuk. All rights reserved.',
      currentYear: new Date().getFullYear().toString()
    }
    
    // Replace variables di subject dan content
    let subject = template.subject
    let content = template.content
    
    for (const [key, value] of Object.entries(enhancedVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      subject = subject.replace(regex, value || '')
      content = content.replace(regex, value || '')
    }
    
    // Wrap content dengan HTML email wrapper (logo + header + content + footer)
    const htmlContent = wrapEmailContent(content, {
      logoUrl,
      companyName: enhancedVariables.footerCompany,
      ctaText: template.ctaText,
      ctaLink: template.ctaLink ? replaceVariables(template.ctaLink, enhancedVariables) : undefined,
      footerText: enhancedVariables.footerText,
      copyrightText: enhancedVariables.footerCopyright,
      socialMedia: {
        instagram: enhancedVariables.footerInstagram,
        facebook: enhancedVariables.footerFacebook,
        linkedin: enhancedVariables.footerLinkedin,
      }
    })
    
    // Log template usage (skip if emailLog model not available)
    console.log('[EMAIL] Sending template:', { templateSlug, to, subject })
    
    // Send via Mailketing
    const result = await mailketing.sendEmail({
      to,
      subject,
      html: htmlContent,
      cc: options?.cc ? [options.cc] : undefined,
      bcc: options?.bcc ? [options.bcc] : undefined,
      reply_to: options?.replyTo
    })
    
    // Track usage: increment usageCount and log usage record
    if (result.success) {
      try {
        // Increment usage count
        await prisma.brandedTemplate.update({
          where: { id: template.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        })
        
        // Create usage record (optional: get userId from variables if available)
        await prisma.brandedTemplateUsage.create({
          data: {
            id: createId(),
            templateId: template.id,
            userId: null, // TODO: Extract from context if needed
            userRole: null,
            context: `Email sent to ${to}`,
            success: true,
            metadata: {
              to,
              subject,
              timestamp: new Date().toISOString()
            }
          }
        })
        
        console.log(`✅ Email sent using template '${templateSlug}' to ${to} (usage tracked)`)
      } catch (trackError) {
        // Don't fail email send if tracking fails
        console.warn(`⚠️ Failed to track template usage:`, trackError)
      }
    }
    
    return result
    
  } catch (error) {
    console.error(`❌ Failed to send branded email:`, error)
    throw error
  }
}

/**
 * Send email dengan fallback ke hardcoded content jika template tidak ada
 * Berguna untuk migration period - gradually move dari hardcoded ke template
 */
export async function sendEmailWithFallback(
  to: string,
  templateSlug: string,
  variables: Record<string, string>,
  fallbackSubject: string,
  fallbackHtml: string
) {
  try {
    // Try template first
    return await sendBrandedEmail(to, templateSlug, variables)
  } catch (error) {
    // Fallback ke hardcoded
    console.warn(`⚠️ Template '${templateSlug}' not available, using fallback`)
    
    return mailketing.sendEmail({
      to,
      subject: fallbackSubject,
      html: fallbackHtml
    })
  }
}

/**
 * Preview template dengan variables (untuk testing di admin panel)
 */
export async function previewTemplate(
  templateSlug: string,
  variables: Record<string, string>
) {
  const template = await prisma.brandedTemplate.findFirst({
    where: { slug: templateSlug }
  })
  
  if (!template) {
    throw new Error(`Template '${templateSlug}' not found`)
  }
  
  let subject = template.subject
  let content = template.content
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(regex, value || `{{${key}}}`)
    content = content.replace(regex, value || `{{${key}}}`)
  }
  
  return {
    subject,
    content,
    template: {
      name: template.name,
      slug: template.slug,
      category: template.category
    }
  }
}

/**
 * Get list of available variables untuk sebuah template
 */
export function extractTemplateVariables(content: string, subject: string): string[] {
  const combined = `${subject} ${content}`
  const matches = combined.match(/\{\{([^}]+)\}\}/g)
  
  if (!matches) return []
  
  const variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''))
  return [...new Set(variables)] // Remove duplicates
}

/**
 * Validate bahwa semua required variables tersedia
 */
export function validateVariables(
  templateContent: string,
  templateSubject: string,
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredVars = extractTemplateVariables(templateContent, templateSubject)
  const providedKeys = Object.keys(providedVariables)
  
  const missing = requiredVars.filter(v => !providedKeys.includes(v))
  
  return {
    valid: missing.length === 0,
    missing
  }
}
