import { NextResponse } from 'next/server'

// Force dynamic to read env vars at runtime, not build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Debug logging
  const timestamp = new Date().toISOString()
  console.log(`[PROVIDERS-API ${timestamp}] Checking Google OAuth environment variables`)
  console.log(`[PROVIDERS-API ${timestamp}] GOOGLE_CLIENT_ID:`, process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] GOOGLE_CLIENT_SECRET:`, process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'undefined')
  console.log(`[PROVIDERS-API ${timestamp}] NODE_ENV:`, process.env.NODE_ENV)
  console.log(`[PROVIDERS-API ${timestamp}] PORT:`, process.env.PORT)
  
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  console.log(`[PROVIDERS-API ${timestamp}] Google OAuth enabled:`, googleEnabled)

  const response = NextResponse.json({
    google: googleEnabled,
    debug: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined',
      timestamp,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    }
  })
  
  // Disable caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}
