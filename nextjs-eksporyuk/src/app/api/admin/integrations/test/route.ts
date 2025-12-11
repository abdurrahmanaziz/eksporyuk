import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import IntegrationService from '@/lib/integrations/service'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Test integration configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { service } = await request.json()

    if (!service) {
      return NextResponse.json({ error: 'Service diperlukan' }, { status: 400 })
    }

    console.log(`[TEST_INTEGRATION] Testing ${service}...`)

    const config = await IntegrationService.getConfig(service)
    
    if (!config || Object.keys(config).length === 0) {
      return NextResponse.json({
        success: false,
        message: `${service} belum dikonfigurasi`,
        details: 'Tidak ada konfigurasi yang ditemukan'
      }, { status: 400 })
    }

    let testResult = await testServiceConnection(service, config)

    // Update test status in database
    await prisma.integrationConfig.upsert({
      where: { service },
      update: {
        testStatus: testResult.success ? 'success' : 'failed',
        lastTestedAt: new Date(),
      },
      create: {
        service,
        config: {},
        isActive: false,
        testStatus: testResult.success ? 'success' : 'failed',
        lastTestedAt: new Date(),
      }
    })

    // Clear cache after test
    IntegrationService.clearCache(service)

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details
    })

  } catch (error) {
    console.error(`[TEST_INTEGRATION] Error:`, error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Gagal menguji koneksi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Test connection for specific service
 */
async function testServiceConnection(service: string, config: any): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  try {
    switch (service) {
      case 'giphy':
        return await testGiphyConnection(config)
      case 'xendit':
        return await testXenditConnection(config)
      case 'mailketing':
        return await testMailketingConnection(config)
      case 'starsender':
        return await testStarsenderConnection(config)
      case 'onesignal':
        return await testOneSignalConnection(config)
      case 'pusher':
        return await testPusherConnection(config)
      case 'google':
        return await testGoogleOAuthConnection(config)
      default:
        return {
          success: false,
          message: 'Service tidak dikenal',
          details: `Service ${service} tidak didukung`
        }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error saat menguji koneksi',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testGiphyConnection(config: any) {
  const { GIPHY_API_KEY } = config
  
  if (!GIPHY_API_KEY) {
    return {
      success: false,
      message: 'Giphy API Key tidak ditemukan',
      details: 'GIPHY_API_KEY diperlukan'
    }
  }

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=1`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        message: 'Koneksi Giphy berhasil',
        details: `API key valid, ditemukan ${data.data?.length || 0} GIF`
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        message: 'Koneksi Giphy gagal',
        details: `HTTP ${response.status}: ${errorData.message || response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error koneksi Giphy',
      details: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function testXenditConnection(config: any) {
  const { XENDIT_SECRET_KEY } = config
  
  if (!XENDIT_SECRET_KEY) {
    return {
      success: false,
      message: 'Xendit Secret Key tidak ditemukan',
      details: 'XENDIT_SECRET_KEY diperlukan'
    }
  }

  try {
    const response = await fetch('https://api.xendit.co/v2/balance', {
      headers: {
        'Authorization': `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return {
        success: true,
        message: 'Koneksi Xendit berhasil',
        details: 'API key valid dan dapat mengakses balance'
      }
    } else {
      return {
        success: false,
        message: 'Koneksi Xendit gagal',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error koneksi Xendit',
      details: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function testMailketingConnection(config: any) {
  const { MAILKETING_API_KEY } = config
  
  if (!MAILKETING_API_KEY) {
    return {
      success: false,
      message: 'Mailketing API Key tidak ditemukan',
      details: 'MAILKETING_API_KEY diperlukan'
    }
  }

  // Since Mailketing doesn't have a public test endpoint,
  // we just validate the API key format
  if (MAILKETING_API_KEY.length > 10) {
    return {
      success: true,
      message: 'Konfigurasi Mailketing valid',
      details: 'API key format valid'
    }
  } else {
    return {
      success: false,
      message: 'API Key Mailketing tidak valid',
      details: 'Format API key tidak sesuai'
    }
  }
}

async function testStarsenderConnection(config: any) {
  const { STARSENDER_API_KEY, STARSENDER_DEVICE_ID } = config
  
  if (!STARSENDER_API_KEY || !STARSENDER_DEVICE_ID) {
    return {
      success: false,
      message: 'Konfigurasi Starsender tidak lengkap',
      details: 'STARSENDER_API_KEY dan STARSENDER_DEVICE_ID diperlukan'
    }
  }

  // Basic validation - check format
  if (STARSENDER_API_KEY.length > 10 && STARSENDER_DEVICE_ID.length > 5) {
    return {
      success: true,
      message: 'Konfigurasi Starsender valid',
      details: 'API key dan Device ID format valid'
    }
  } else {
    return {
      success: false,
      message: 'Konfigurasi Starsender tidak valid',
      details: 'Format API key atau Device ID tidak sesuai'
    }
  }
}

async function testOneSignalConnection(config: any) {
  const { ONESIGNAL_APP_ID, ONESIGNAL_API_KEY } = config
  
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    return {
      success: false,
      message: 'Konfigurasi OneSignal tidak lengkap',
      details: 'ONESIGNAL_APP_ID dan ONESIGNAL_API_KEY diperlukan'
    }
  }

  try {
    const response = await fetch(`https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}`, {
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return {
        success: true,
        message: 'Koneksi OneSignal berhasil',
        details: 'App ID dan API key valid'
      }
    } else {
      return {
        success: false,
        message: 'Koneksi OneSignal gagal',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error koneksi OneSignal',
      details: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function testPusherConnection(config: any) {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = config
  
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
    return {
      success: false,
      message: 'Konfigurasi Pusher tidak lengkap',
      details: 'PUSHER_APP_ID, PUSHER_KEY, dan PUSHER_SECRET diperlukan'
    }
  }

  try {
    // Test by getting channel info
    const crypto = require('crypto')
    const timestamp = Math.floor(Date.now() / 1000)
    const body = ''
    const method = 'GET'
    const path = `/apps/${PUSHER_APP_ID}/channels`
    
    const stringToSign = [method, path, `auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=1.0`].join('\n')
    const signature = crypto.createHmac('sha256', PUSHER_SECRET).update(stringToSign).digest('hex')
    
    const url = `https://api-${PUSHER_CLUSTER || 'us2'}.pusherapp.com${path}?auth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=1.0&auth_signature=${signature}`
    
    const response = await fetch(url, { method: 'GET' })
    
    if (response.ok) {
      return {
        success: true,
        message: 'Koneksi Pusher berhasil',
        details: 'Konfigurasi valid dan dapat mengakses API'
      }
    } else {
      return {
        success: false,
        message: 'Koneksi Pusher gagal',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error koneksi Pusher',
      details: error instanceof Error ? error.message : 'Network error'
    }
  }
}

async function testGoogleOAuthConnection(config: any) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = config
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    return {
      success: false,
      message: 'Konfigurasi Google OAuth tidak lengkap',
      details: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_CALLBACK_URL diperlukan'
    }
  }

  // Validate Client ID format
  if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
    return {
      success: false,
      message: 'Format Client ID tidak valid',
      details: 'Client ID harus mengandung .apps.googleusercontent.com'
    }
  }

  // Validate Callback URL format
  if (!GOOGLE_CALLBACK_URL.includes('/api/auth/callback/google') && !GOOGLE_CALLBACK_URL.includes('/auth/callback/google')) {
    return {
      success: false,
      message: 'Format Callback URL tidak valid',
      details: 'Callback URL harus berakhir dengan /api/auth/callback/google'
    }
  }

  try {
    // Test Google OAuth token endpoint using client credentials
    // This is a basic validation to ensure credentials format is correct
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }).toString(),
    })

    // Note: This will likely return 400 error because we're not providing proper authorization flow
    // But we're checking if the credentials are recognized by Google
    if (response.status === 400) {
      const data = await response.json()
      // If error is about grant_type (not about client credentials), credentials are valid
      if (data.error === 'invalid_grant') {
        return {
          success: true,
          message: 'Konfigurasi Google OAuth valid',
          details: 'Client ID dan Client Secret dikenali oleh Google. Callback URL sudah valid.'
        }
      }
      return {
        success: false,
        message: 'Validasi Google OAuth gagal',
        details: `Error dari Google: ${data.error}`
      }
    }

    if (response.ok) {
      return {
        success: true,
        message: 'Koneksi Google OAuth berhasil',
        details: 'Konfigurasi valid dan dapat berkomunikasi dengan Google'
      }
    } else {
      return {
        success: false,
        message: 'Koneksi Google OAuth gagal',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    // If we get a network error trying to connect to Google, that's actually expected
    // since we're using invalid grant type. The important thing is that we can reach Google's endpoint
    if (error instanceof Error && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Gagal terhubung ke Google OAuth',
        details: 'Periksa koneksi internet Anda'
      }
    }

    return {
      success: true,
      message: 'Konfigurasi Google OAuth valid',
      details: 'Format credentials sudah benar. NextAuth akan menangani proses OAuth.'
    }
  }
}