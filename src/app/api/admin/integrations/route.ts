import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import IntegrationService from '@/lib/integrations/service'
import { randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

const createId = () => randomBytes(16).toString('hex')


export async function POST(request: NextRequest) {
  // Track service in outer scope so catch can reference safely
  let service: string | null = null
  let configStr: string | null = null

  try {
    console.log('[INTEGRATION_SAVE] Starting save process...')
    
    const session = await getServerSession(authOptions)
    console.log('[INTEGRATION_SAVE] Session:', { userId: session?.user?.id, role: session?.user?.role })

    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('[INTEGRATION_SAVE] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    service = formData.get('service') as string
    configStr = formData.get('config') as string
    
    console.log('[INTEGRATION_SAVE] Received:', { service, configStr })
    
    if (!service || !configStr) {
      console.log('[INTEGRATION_SAVE] Missing required fields:', { service, hasConfig: !!configStr })
      return NextResponse.json(
        { error: 'Service dan config diperlukan' },
        { status: 400 }
      )
    }

    // Validate config is valid JSON
    let config: any
    try {
      config = JSON.parse(configStr)
      console.log('[INTEGRATION_SAVE] Parsed config:', config)
    } catch (err) {
      console.log('[INTEGRATION_SAVE] Invalid JSON config:', err)
      return NextResponse.json(
        { error: 'Config tidak valid (JSON parse error)' },
        { status: 400 }
      )
    }

    // Validate Giphy config
    if (service === 'giphy') {
      const { GIPHY_API_KEY } = config

      if (!GIPHY_API_KEY) {
        return NextResponse.json(
          { error: 'Giphy API Key harus diisi' },
          { status: 400 }
        )
      }

      // Test Giphy API connection
      try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const responseData = await response.json()
          console.error('Giphy validation error:', responseData)
          return NextResponse.json(
            { error: `Giphy API Key tidak valid: ${responseData.message || 'Invalid API key'}` },
            { status: 400 }
          )
        }

        console.log('✅ Giphy API Key validated successfully')
      } catch (err) {
        console.error('Giphy connection test failed:', err)
        return NextResponse.json(
          { error: `Gagal terhubung ke Giphy: ${err instanceof Error ? err.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Validate Xendit config
    if (service === 'xendit') {
      const { XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN, XENDIT_ENVIRONMENT } = config

      if (!XENDIT_SECRET_KEY || !XENDIT_WEBHOOK_TOKEN || !XENDIT_ENVIRONMENT) {
        return NextResponse.json(
          { error: 'Secret Key, Webhook Token, dan Environment harus diisi' },
          { status: 400 }
        )
      }

      // Validate Secret Key format
      if (!XENDIT_SECRET_KEY.startsWith('xnd_development_') && !XENDIT_SECRET_KEY.startsWith('xnd_production_')) {
        return NextResponse.json(
          { error: 'Secret Key tidak valid. Harus dimulai dengan xnd_development_ atau xnd_production_' },
          { status: 400 }
        )
      }

      // Test Xendit connection dengan Secret Key
      try {
        const authString = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString('base64')
        const response = await fetch('https://api.xendit.co/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const responseData = await response.json()
          console.error('Xendit validation error:', responseData)
          return NextResponse.json(
            { error: `Xendit Secret Key tidak valid: ${responseData.message || 'Invalid credentials'}` },
            { status: 400 }
          )
        }

        console.log('✅ Xendit Secret Key validated successfully')
      } catch (err) {
        console.error('Xendit connection test failed:', err)
        return NextResponse.json(
          { error: `Gagal terhubung ke Xendit: ${err instanceof Error ? err.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Validate Pusher config
    if (service === 'pusher') {
      // Pusher is optional, no strict validation required
      console.log('✅ Pusher configuration saved')
    }

    // Validate Google OAuth config
    if (service === 'google_oauth' || service === 'google') {
      const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = config

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Client ID dan Client Secret harus diisi' },
          { status: 400 }
        )
      }

      // Validate Client ID format (should contain .apps.googleusercontent.com)
      if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
        return NextResponse.json(
          { error: 'Client ID tidak valid. Format: xxxxx.apps.googleusercontent.com' },
          { status: 400 }
        )
      }

      // Validate Callback URL format if provided
      if (GOOGLE_CALLBACK_URL) {
        if (!GOOGLE_CALLBACK_URL.includes('/auth/callback/google') && !GOOGLE_CALLBACK_URL.includes('/api/auth/callback/google')) {
          return NextResponse.json(
            { error: 'Callback URL harus berakhir dengan /api/auth/callback/google' },
            { status: 400 }
          )
        }

        // Validate Callback URL matches NEXTAUTH_URL
        const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        if (!GOOGLE_CALLBACK_URL.startsWith(nextAuthUrl)) {
          console.warn(`⚠️ Warning: Callback URL (${GOOGLE_CALLBACK_URL}) doesn't match NEXTAUTH_URL (${nextAuthUrl})`)
        }
      }

      console.log('✅ Google OAuth configuration validated successfully')
    }

    // Validate Facebook OAuth config
    if (service === 'facebook_oauth' || service === 'facebook') {
      const { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_CALLBACK_URL, FACEBOOK_DATA_DELETION_URL } = config

      if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'App ID dan App Secret harus diisi' },
          { status: 400 }
        )
      }

      // Validate App ID format (should be numeric)
      if (!/^\d+$/.test(FACEBOOK_CLIENT_ID)) {
        return NextResponse.json(
          { error: 'App ID tidak valid. Format harus berupa angka.' },
          { status: 400 }
        )
      }

      // Validate Callback URL format if provided
      if (FACEBOOK_CALLBACK_URL) {
        if (!FACEBOOK_CALLBACK_URL.includes('/api/auth/callback/facebook')) {
          return NextResponse.json(
            { error: 'Callback URL harus berakhir dengan /api/auth/callback/facebook' },
            { status: 400 }
          )
        }
      }

      // Validate Data Deletion URL format if provided
      if (FACEBOOK_DATA_DELETION_URL) {
        if (!FACEBOOK_DATA_DELETION_URL.includes('/api/auth/facebook/data-deletion')) {
          return NextResponse.json(
            { error: 'Data Deletion URL harus berakhir dengan /api/auth/facebook/data-deletion' },
            { status: 400 }
          )
        }
      }

      console.log('✅ Facebook OAuth configuration validated successfully')
    }

    // Save to environment file (for development)
    console.log('[INTEGRATION_SAVE] Updating environment file...')
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''

    // Read existing env file
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8')
        console.log('[INTEGRATION_SAVE] Existing .env.local found')
      } else {
        console.log('[INTEGRATION_SAVE] .env.local not found, creating new')
      }
    } catch (readErr) {
      console.log('[INTEGRATION_SAVE] Error reading .env.local:', readErr)
      envContent = '' // Start fresh if read fails
    }

    // Update env variables
    const serviceEnvMap: Record<string, string[]> = {
      giphy: ['GIPHY_API_KEY'],
      xendit: ['XENDIT_SECRET_KEY', 'XENDIT_WEBHOOK_TOKEN', 'XENDIT_ENVIRONMENT', 'XENDIT_VA_COMPANY_CODE'],
      mailketing: ['MAILKETING_API_KEY', 'MAILKETING_SENDER_EMAIL', 'MAILKETING_SENDER_NAME'],
      starsender: ['STARSENDER_API_KEY', 'STARSENDER_DEVICE_ID'],
      onesignal: ['ONESIGNAL_APP_ID', 'ONESIGNAL_API_KEY'],
      pusher: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'],
      google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
      google_oauth: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
      facebook: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_CALLBACK_URL', 'FACEBOOK_DATA_DELETION_URL'],
      facebook_oauth: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_CALLBACK_URL', 'FACEBOOK_DATA_DELETION_URL'],
    }

    const envVars = serviceEnvMap[service] || []
    console.log('[INTEGRATION_SAVE] Updating env vars:', envVars)

    for (const key of envVars) {
      const value = config[key]
      if (value) {
        // Remove existing variable
        const regex = new RegExp(`^${key}=.*$`, 'm')
        envContent = envContent.replace(regex, '')

        // Add new variable
        envContent += `\n${key}=${value}`
        console.log(`[INTEGRATION_SAVE] Updated ${key}`)
      }
    }

    // Write updated env file
    try {
      fs.writeFileSync(envPath, envContent.trim() + '\n')
      console.log('[INTEGRATION_SAVE] Environment file written successfully')
    } catch (writeErr) {
      console.error('[INTEGRATION_SAVE] Error writing .env.local:', writeErr)
      // Continue anyway, database save is more important
    }

    // Save configuration to database
    console.log('[INTEGRATION_SAVE] Saving to database...', { service, configKeys: Object.keys(config) })
    
    // Find existing config first
    const existingConfig = await prisma.integrationConfig.findFirst({
      where: { service }
    })
    
    let savedConfig
    if (existingConfig) {
      // Update existing
      savedConfig = await prisma.integrationConfig.update({
        where: { id: existingConfig.id },
        data: {
          config,
          isActive: true,
          testStatus: 'success',
          lastTestedAt: new Date(),
          updatedAt: new Date(),
        }
      })
    } else {
      // Create new
      savedConfig = await prisma.integrationConfig.create({
        data: {
          id: createId(),
          service,
          config,
          isActive: true,
          testStatus: 'success',
          lastTestedAt: new Date(),
          updatedAt: new Date(),
        }
      })
    }
    
    console.log('[INTEGRATION_SAVE] Database saved:', savedConfig.id)
    console.log('[INTEGRATION_SAVE] Environment file updated:', envPath)

    return NextResponse.json({
      success: true,
      message: `Konfigurasi ${service} berhasil disimpan`,
      service,
      configId: savedConfig.id,
      note: 'Konfigurasi telah disimpan ke database dan file environment',
    })
  } catch (error) {
    console.error('[INTEGRATION_SAVE] Critical error:', error)
    return NextResponse.json(
      { 
        error: 'Gagal menyimpan konfigurasi', 
        details: error instanceof Error ? error.message : 'Unknown error',
        service: service || null,
        configPreview: configStr ? configStr.slice(0, 200) : null
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')

    if (service) {
      // Get specific service config directly from database
      console.log(`[CONFIG_GET] Getting configuration for service: ${service}`)
      
      // Always read directly from database for admin panel
      const dbConfig = await prisma.integrationConfig.findFirst({
        where: { service }
      })
      
      const config = dbConfig?.config || {}
      const hasRequiredFields = Object.keys(config).length > 0
      
      console.log(`[CONFIG_GET] Service ${service} - dbConfig exists: ${!!dbConfig}, isActive: ${dbConfig?.isActive}, hasConfig: ${hasRequiredFields}`)
      
      return NextResponse.json({
        configured: hasRequiredFields && dbConfig?.isActive === true,
        isActive: dbConfig?.isActive || false,
        config: config,
        testStatus: dbConfig?.testStatus || null,
        lastTestedAt: dbConfig?.lastTestedAt || null,
        source: hasRequiredFields ? 'database' : 'none',
      })
    } else {
      // Get all services status including integrations
      console.log('[CONFIG_GET] Getting all services status')
      
      const allConfigs = await prisma.integrationConfig.findMany()
      const integrations = await prisma.integration.findMany()
      
      const services = ['giphy', 'xendit', 'mailketing', 'starsender', 'onesignal', 'pusher', 'google']
      const response: any = {}

      for (const serviceName of services) {
        const dbConfig = allConfigs.find(c => c.service === serviceName)
        // Check if configured by checking if there's a database config with isActive = true
        const isConfigured = dbConfig?.isActive === true && Object.keys(dbConfig?.config || {}).length > 0
        
        response[serviceName] = {
          configured: isConfigured,
          isActive: dbConfig?.isActive || false,
          testStatus: dbConfig?.testStatus || null,
          lastTestedAt: dbConfig?.lastTestedAt || null,
        }
        
        console.log(`[CONFIG_GET] Service ${serviceName}:`, {
          configured: isConfigured,
          dbConfigExists: !!dbConfig,
          isActive: dbConfig?.isActive,
          hasConfig: Object.keys(dbConfig?.config || {}).length > 0
        })
      }

      // Add integrations to response
      return NextResponse.json({
        ...response,
        integrations
      })
    }
  } catch (error) {
    console.error('[CONFIG_GET] Error getting configuration:', error)
    return NextResponse.json(
      { 
        error: 'Gagal membaca konfigurasi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
