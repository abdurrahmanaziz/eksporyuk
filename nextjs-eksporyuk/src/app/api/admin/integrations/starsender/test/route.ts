import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { starsenderService } from '@/lib/services/starsenderService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/integrations/starsender/test
 * Test Starsender WhatsApp integration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can test
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { testType, phone, name } = body

    if (!testType) {
      return NextResponse.json(
        { error: 'Test type is required' },
        { status: 400 }
      )
    }

    let result

    switch (testType) {
      case 'connection':
        // Test API connection
        result = await starsenderService.testConnection()
        break

      case 'simple':
        // Send simple test message
        if (!phone) {
          return NextResponse.json(
            { error: 'Phone number is required' },
            { status: 400 }
          )
        }
        result = await starsenderService.sendMessage({
          phone,
          message: `🧪 *Test WhatsApp dari EksporYuk*\n\nHalo${name ? ` ${name}` : ''}! Ini adalah pesan test dari sistem notifikasi WhatsApp kami.\n\n✅ Jika Anda menerima pesan ini, berarti integrasi berhasil!\n\n_Waktu kirim: ${new Date().toLocaleString('id-ID')}_`
        })
        break

      case 'welcome':
        // Test welcome message
        if (!phone || !name) {
          return NextResponse.json(
            { error: 'Phone and name are required' },
            { status: 400 }
          )
        }
        result = await starsenderService.sendWelcomeMessage({
          phone,
          name
        })
        break

      case 'membership':
        // Test membership notification
        if (!phone || !name) {
          return NextResponse.json(
            { error: 'Phone and name are required' },
            { status: 400 }
          )
        }
        result = await starsenderService.sendMembershipPurchaseNotification({
          phone,
          name,
          membershipName: 'Gold Membership (TEST)',
          price: 499000,
          duration: '3 Bulan',
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')
        })
        break

      case 'reminder':
        // Test reminder message
        if (!phone || !name) {
          return NextResponse.json(
            { error: 'Phone and name are required' },
            { status: 400 }
          )
        }
        result = await starsenderService.sendMembershipExpiryReminder({
          phone,
          name,
          membershipName: 'Gold Membership (TEST)',
          daysLeft: 7,
          renewalLink: 'https://eksporyuk.com/membership'
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      testType,
      result
    })

  } catch (error: any) {
    console.error('[STARSENDER TEST] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/integrations/starsender/test
 * Get Starsender configuration status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hasApiKey = !!process.env.STARSENDER_API_KEY
    const hasDeviceId = !!process.env.STARSENDER_DEVICE_ID
    const apiUrl = process.env.STARSENDER_API_URL || 'Not configured'
    const isDevelopment = !process.env.STARSENDER_API_KEY || process.env.NODE_ENV === 'development'

    return NextResponse.json({
      configured: hasApiKey && hasDeviceId,
      mode: isDevelopment ? 'development' : 'production',
      apiUrl: hasApiKey ? apiUrl : 'Not configured',
      hasApiKey,
      hasDeviceId,
      status: hasApiKey && hasDeviceId ? 'ready' : 'not_configured'
    })

  } catch (error: any) {
    console.error('[STARSENDER CONFIG] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
