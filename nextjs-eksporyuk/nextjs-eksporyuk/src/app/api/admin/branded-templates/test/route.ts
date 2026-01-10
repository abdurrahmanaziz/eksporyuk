import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendBrandedEmail } from '@/lib/branded-template-helpers'
import { createBrandedEmailAsync, processShortcodes } from '@/lib/branded-template-engine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/branded-templates/test
 * Test rendering branded template with preview data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, slug, testEmail, sampleData } = body

    // Get template
    let template
    if (templateId) {
      template = await prisma.brandedTemplate.findUnique({
        where: { id: templateId }
      })
    } else if (slug) {
      template = await prisma.brandedTemplate.findFirst({
        where: { slug }
      })
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Prepare test data
    const testData = sampleData || {
      name: session.user.name || 'Test User',
      email: testEmail || session.user.email,
      userId: session.user.id,
      url: 'https://eksporyuk.com',
      amount: 'Rp 1.000.000',
      date: new Date().toLocaleDateString('id-ID'),
      code: 'TEST-CODE-123',
      ...template.variables
    }

    // Generate HTML
    let htmlContent = ''
    try {
      htmlContent = await createBrandedEmailAsync({
        subject: template.subject,
        content: template.content,
        variables: testData,
        ctaText: template.ctaText,
        ctaLink: template.ctaLink
      })
    } catch (htmlError) {
      console.error('HTML generation error:', htmlError)
      // Fallback to simple HTML
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>${template.subject}</h2>
          <p>${template.content}</p>
          ${template.ctaText && template.ctaLink ? `<a href="${template.ctaLink}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">${template.ctaText}</a>` : ''}
        </body>
        </html>
      `
    }

    // Send test email
    const emailResult = await sendBrandedEmail({
      templateSlug: slug || template.slug,
      recipientEmail: testEmail || session.user.email,
      recipientName: testData.name,
      variables: testData,
      userId: session.user.id,
      trackingEnabled: true
    })

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          category: template.category,
          type: template.type
        },
        preview: {
          subject: template.subject,
          htmlContent,
          textContent: template.content
        },
        emailSent: emailResult.success,
        emailMessage: emailResult.message,
        testData
      }
    })

  } catch (error) {
    console.error('[Branded Templates Test API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to test template', details: String(error) },
      { status: 500 }
    )
  }
}
