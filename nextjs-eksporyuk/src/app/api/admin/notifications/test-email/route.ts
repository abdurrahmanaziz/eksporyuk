import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Test send email notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    const { templateId, recipient, variables } = requestBody

    if (!templateId || !recipient) {
      return NextResponse.json(
        { error: 'Template ID and recipient required' },
        { status: 400 }
      )
    }

    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Replace variables
    let subject = template.subject
    let emailBody = template.body

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g')
        subject = subject.replace(regex, String(value))
        emailBody = emailBody.replace(regex, String(value))
      })
    }

    // Get Mailketing config
    const config = await prisma.integrationConfig.findFirst({
      where: { service: 'mailketing' },
    })

    if (!config?.isActive) {
      return NextResponse.json(
        { error: 'Mailketing not configured. Please setup in /admin/integrations' },
        { status: 400 }
      )
    }

    const mailketingConfig = config.config as any

    // Send via Mailketing API
    const response = await fetch('https://be.mailketing.co.id/v1/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mailketingConfig.MAILKETING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_email: mailketingConfig.MAILKETING_SENDER_EMAIL,
        from_name: mailketingConfig.MAILKETING_SENDER_NAME,
        to: recipient,
        subject,
        html: emailBody,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: data.message_id,
      })
    } else {
      return NextResponse.json(
        { error: data.message || 'Failed to send email' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
