import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createBrandedEmailAsync, processShortcodes, type TemplateData } from '@/lib/branded-template-engine'
import { MailketingService } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/branded-templates/test-email
 * Send test email using branded template
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Test Email API] Starting...')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      console.log('[Test Email API] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Test Email API] Session validated for user:', session.user.email)

    const body = await request.json()
    const { templateId, testEmail, testData } = body

    console.log('[Test Email API] Request body:', { templateId, testEmail })

    if (!templateId || !testEmail) {
      return NextResponse.json(
        { error: 'Template ID and test email are required' },
        { status: 400 }
      )
    }

    // Get template
    console.log('[Test Email API] Fetching template:', templateId)
    const template = await prisma.brandedTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      console.log('[Test Email API] Template not found:', templateId)
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    console.log('[Test Email API] Template found:', template.name)

    if (template.type !== 'EMAIL') {
      return NextResponse.json(
        { error: 'Only EMAIL templates can be tested via email' },
        { status: 400 }
      )
    }

    // Render template with test data
    console.log('[Test Email API] Rendering template with data')
    const templateData: TemplateData = {
      name: testData?.name || 'Test User',
      email: testEmail,
      phone: testData?.phone || '+62812345678',
      role: 'TEST',
      membershipPlan: testData?.membership_plan || 'Test Plan',
      expiryDate: testData?.expiry_date || '31 Desember 2025',
      amountFormatted: testData?.amount || 'Rp 199.000',
      invoiceNumber: testData?.invoice_number || 'TEST-001',
      affiliateCode: testData?.affiliate_code || 'TEST123',
      commissionFormatted: testData?.commission || 'Rp 50.000',
      ...testData
    }

    // Use createBrandedEmailAsync for database-aware rendering
    let renderedContent: string
    try {
      renderedContent = await createBrandedEmailAsync(
        template.subject,
        template.content,
        template.ctaText || undefined,
        template.ctaLink || undefined,
        templateData
      )
      console.log('[Test Email API] Template rendered successfully, length:', renderedContent.length)
    } catch (renderError: any) {
      console.error('[Test Email API] Render error:', renderError.message)
      return NextResponse.json(
        { error: 'Failed to render template', details: renderError.message },
        { status: 500 }
      )
    }

    // Process subject with shortcodes
    const processedSubject = processShortcodes(template.subject, templateData)

    // Send email using Mailketing API only
    console.log('📧 Sending test email via Mailketing:', {
      to: testEmail,
      subject: `[TEST] ${processedSubject}`,
      templateName: template.name
    })

    try {
      const mailketing = new MailketingService()
      const emailResult = await mailketing.sendEmail({
        to: testEmail,
        subject: `[TEST] ${processedSubject}`,
        html: renderedContent,
        from_email: process.env.MAILKETING_FROM_EMAIL || 'noreply@eksporyuk.com',
        from_name: 'EksporYuk Test'
      })

    if (emailResult.success) {
      // Record usage
      try {
        await prisma.brandedTemplateUsage.create({
          data: {
            templateId: template.id,
            userId: session.user.id,
            userRole: session.user.role,
            context: 'TEST_EMAIL',
            success: true,
            metadata: {
              testEmail: testEmail,
              testData: testData,
              mode: emailResult.data?.mode || 'api',
              messageId: emailResult.data?.message_id || `test_${Date.now()}`
            }
          }
        })
      } catch (usageError) {
        console.error('[Test Email API] Failed to record usage:', usageError)
        // Continue anyway - email was sent
      }

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        mode: emailResult.data?.mode || 'api',
        details: emailResult.message
      })
    } else {
      // Record failed attempt
      try {
        await prisma.brandedTemplateUsage.create({
          data: {
            templateId: template.id,
            userId: session.user.id,
            userRole: session.user.role,
            context: 'TEST_EMAIL',
            success: false,
            metadata: {
              testEmail: testEmail,
              testData: testData,
              error: emailResult.error || emailResult.message
            }
          }
        })
      } catch (usageError) {
        console.error('[Test Email API] Failed to record usage:', usageError)
      }

      return NextResponse.json(
        { error: emailResult.error || emailResult.message || 'Failed to send test email' },
        { status: 500 }
      )
    }
    } catch (mailError: any) {
      console.error('[Test Email API] Mailketing error:', mailError.message)
      return NextResponse.json(
        { error: 'Mailketing service error', details: mailError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Test Email API] Error:', error)
    console.error('[Test Email API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
      },
      { status: 500 }
    )
  }
}