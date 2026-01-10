import { NextResponse } from 'next/server'

// Force dynamic to read env vars at runtime, not build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Debug logging
  const timestamp = new Date().toISOString()
  console.log(`[PROVIDERS-API ${timestamp}] Checking OAuth environment variables`)
  console.log(`[PROVIDERS-API ${timestamp}] GOOGLE_CLIENT_ID:`, process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] GOOGLE_CLIENT_SECRET:`, process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] FACEBOOK_CLIENT_ID:`, process.env.FACEBOOK_CLIENT_ID || 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] FACEBOOK_CLIENT_SECRET:`, process.env.FACEBOOK_CLIENT_SECRET ? 'SET' : 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] NODE_ENV:`, process.env.NODE_ENV)
  
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  )

  const facebookEnabled = !!(
    process.env.FACEBOOK_CLIENT_ID && 
    process.env.FACEBOOK_CLIENT_SECRET
  )
  
  console.log(`[PROVIDERS-API ${timestamp}] Google OAuth enabled:`, googleEnabled)
  console.log(`[PROVIDERS-API ${timestamp}] Facebook OAuth enabled:`, facebookEnabled)

  const response = NextResponse.json({
    google: googleEnabled,
    facebook: facebookEnabled,
    debug: {
      google: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined',
      },
      facebook: {
        hasClientId: !!process.env.FACEBOOK_CLIENT_ID,
        hasClientSecret: !!process.env.FACEBOOK_CLIENT_SECRET,
        appId: process.env.FACEBOOK_CLIENT_ID || 'undefined',
      },
      timestamp,
      nodeEnv: process.env.NODE_ENV,
    }
  })
  
  // Disable caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}
