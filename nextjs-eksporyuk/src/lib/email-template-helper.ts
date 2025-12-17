import { prisma } from './prisma'
import { mailketing } from './integrations/mailketing'

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
    const template = await prisma.brandedTemplate.findUnique({
      where: { 
        slug: templateSlug
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
    
    // Log template usage (skip if emailLog model not available)
    console.log('[EMAIL] Sending template:', { templateSlug, to, subject })
    
    // Send via Mailketing
    const result = await mailketing.sendEmail({
      to,
      subject,
      html: content,
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
  const template = await prisma.brandedTemplate.findUnique({
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
