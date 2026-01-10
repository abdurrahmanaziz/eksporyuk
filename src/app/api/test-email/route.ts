import { NextRequest, NextResponse } from 'next/server'
import { mailketing } from '@/lib/integrations/mailketing'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, content } = body
    
    if (!to || !subject) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, subject'
      }, { status: 400 })
    }
    
    const result = await mailketing.sendEmail({
      to,
      subject,
      html: content || '<p>Test email from EksporYuk</p>'
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[TEST-EMAIL] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Test connection to Mailketing and show config source
  try {
    // Get database config
    const { getMailketingConfig } = await import('@/lib/integration-config')
    const dbConfig = await getMailketingConfig()
    
    const result = await mailketing.getLists()
    
    return NextResponse.json({
      status: 'connected',
      configSource: dbConfig ? 'database' : 'environment',
      config: {
        hasApiKey: !!process.env.MAILKETING_API_KEY,
        apiKeyPrefix: process.env.MAILKETING_API_KEY?.substring(0, 8) + '...',
        fromDatabase: dbConfig ? {
          senderEmail: dbConfig.MAILKETING_SENDER_EMAIL,
          senderName: dbConfig.MAILKETING_SENDER_NAME,
          replyTo: dbConfig.MAILKETING_REPLY_TO_EMAIL
        } : null
      },
      lists: result.success ? result.data : null,
      error: result.success ? null : result.error
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}
