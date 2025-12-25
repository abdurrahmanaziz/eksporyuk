import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Test send WhatsApp notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, recipient, variables } = body

    if (!templateId || !recipient) {
      return NextResponse.json(
        { error: 'Template ID and recipient required' },
        { status: 400 }
      )
    }

    // Get template
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Replace variables
    let message = template.message

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g')
        message = message.replace(regex, String(value))
      })
    }

    // Get StarSender config
    const config = await prisma.integrationConfig.findFirst({
      where: { service: 'starsender' },
    })

    if (!config?.isActive) {
      return NextResponse.json(
        { error: 'StarSender not configured. Please setup in /admin/integrations' },
        { status: 400 }
      )
    }

    const starsenderConfig = config.config as any

    // Format phone number
    let phone = recipient.replace(/[\+\s\-]/g, '')
    if (!phone.startsWith('62')) {
      phone = '62' + phone.replace(/^0/, '')
    }

    // Send via StarSender API
    const response = await fetch('https://api.starsender.online/api/sendText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: starsenderConfig.STARSENDER_API_KEY,
        device_id: starsenderConfig.STARSENDER_DEVICE_ID,
        phone,
        message,
      }),
    })

    const data = await response.json()

    if (response.ok && data.status === 'success') {
      return NextResponse.json({
        success: true,
        message: 'Test WhatsApp sent successfully',
        messageId: data.message_id,
      })
    } else {
      return NextResponse.json(
        { error: data.message || 'Failed to send WhatsApp' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Test WhatsApp error:', error)
    return NextResponse.json(
      { error: 'Failed to send test WhatsApp' },
      { status: 500 }
    )
  }
}
