import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import {
  mailketing,
  starsender,
  onesignal,
  pusher,
  sendUnifiedNotification,
} from '@/lib/integrations'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * POST /api/test/integrations
 * Test all integration services
 * ADMIN ONLY
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { service, testType, params } = body

    const results: any = {
      service,
      testType,
      timestamp: new Date().toISOString(),
      results: {},
    }

    // Test specific service
    if (service === 'xendit') {
      if (testType === 'check-balance') {
        // Test Xendit Secret Key dengan balance check
        const secretKey = process.env.XENDIT_SECRET_KEY
        
        if (!secretKey) {
          results.results = {
            success: false,
            error: 'XENDIT_SECRET_KEY not configured',
            mode: 'not-configured'
          }
        } else {
          try {
            const authString = Buffer.from(`${secretKey}:`).toString('base64')
            const response = await fetch('https://api.xendit.co/balance', {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
              },
            })

            if (response.ok) {
              const balanceData = await response.json()
              results.results = {
                success: true,
                data: {
                  balance: balanceData.balance,
                  mode: process.env.XENDIT_ENVIRONMENT || 'development',
                  message: 'Xendit connection successful'
                }
              }
            } else {
              const errorData = await response.json()
              results.results = {
                success: false,
                error: errorData.message || 'Invalid Xendit credentials',
                statusCode: response.status
              }
            }
          } catch (err) {
            results.results = {
              success: false,
              error: err instanceof Error ? err.message : 'Connection failed',
              mode: 'error'
            }
          }
        }
      }
    }

    else if (service === 'mailketing') {
      if (testType === 'send-email') {
        results.results = await mailketing.sendEmail({
          to: params.email || session.user.email!,
          subject: 'Test Email from EksporYuk',
          html: '<h1>Hello from Mailketing!</h1><p>This is a test email.</p>',
        })
      } else if (testType === 'send-verification') {
        const { sendVerificationEmail } = await import('@/lib/integrations/mailketing')
        results.results = await sendVerificationEmail(
          params.email || session.user.email!,
          params.name || session.user.name!,
          'https://eksporyuk.com/verify?token=test123'
        )
      }
    }

    else if (service === 'starsender') {
      if (testType === 'send-message') {
        results.results = await starsender.sendMessage({
          phone: params.phone || '6281234567890',
          message: `Test WhatsApp from EksporYuk!\n\nHi ${params.name || 'User'}, this is a test message.`,
        })
      } else if (testType === 'check-status') {
        results.results = await starsender.getDeviceStatus()
      }
    }

    else if (service === 'onesignal') {
      if (testType === 'send-notification') {
        results.results = await onesignal.sendToUsers(
          [session.user.id],
          'Test Notification',
          'This is a test push notification from EksporYuk!',
          { data: { test: true } }
        )
      } else if (testType === 'send-all') {
        results.results = await onesignal.sendToAll(
          'Test Broadcast',
          'This is a test broadcast to all users!'
        )
      }
    }

    else if (service === 'pusher') {
      if (testType === 'trigger-event') {
        results.results = await pusher.trigger({
          channel: params.channel || 'public-test',
          event: params.event || 'test-event',
          data: {
            message: 'Test real-time event from EksporYuk!',
            timestamp: new Date().toISOString(),
          },
        })
      } else if (testType === 'get-channels') {
        results.results = await pusher.getChannels()
      }
    }

    else if (service === 'unified') {
      results.results = await sendUnifiedNotification({
        userId: session.user.id,
        email: params.email || session.user.email,
        phone: params.phone,
        name: params.name || session.user.name!,
        notification: {
          subject: 'Test Unified Notification',
          message: 'This is a test sent via Email, WhatsApp, and Push!',
          type: 'announcement',
          data: { test: true },
        },
      })
    }

    else {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Integration test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test/integrations
 * Get integration status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const status = {
      mailketing: {
        configured: !!process.env.MAILKETING_API_KEY,
        apiKey: process.env.MAILKETING_API_KEY ? '✅ Set' : '❌ Not set',
        fromEmail: process.env.MAILKETING_FROM_EMAIL || 'Not set',
      },
      starsender: {
        configured: !!process.env.STARSENDER_API_KEY && !!process.env.STARSENDER_DEVICE_ID,
        apiKey: process.env.STARSENDER_API_KEY ? '✅ Set' : '❌ Not set',
        deviceId: process.env.STARSENDER_DEVICE_ID ? '✅ Set' : '❌ Not set',
      },
      onesignal: {
        configured: !!process.env.ONESIGNAL_APP_ID && (!!process.env.ONESIGNAL_API_KEY || !!process.env.ONESIGNAL_REST_API_KEY),
        appId: process.env.ONESIGNAL_APP_ID ? '✅ Set' : '❌ Not set',
        apiKey: (process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY) ? '✅ Set' : '❌ Not set',
      },
      pusher: {
        configured: !!process.env.PUSHER_APP_ID && !!process.env.PUSHER_KEY && !!process.env.PUSHER_SECRET,
        appId: process.env.PUSHER_APP_ID ? '✅ Set' : '❌ Not set',
        key: process.env.PUSHER_KEY ? '✅ Set' : '❌ Not set',
        secret: process.env.PUSHER_SECRET ? '✅ Set' : '❌ Not set',
        cluster: process.env.PUSHER_CLUSTER || 'ap1',
      },
    }

    return NextResponse.json({ status })
  } catch (error: any) {
    console.error('Get status error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
