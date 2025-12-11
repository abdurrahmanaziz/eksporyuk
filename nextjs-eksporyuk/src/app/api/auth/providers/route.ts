import { NextResponse } from 'next/server'

// Force dynamic to read env vars at runtime, not build time
export const dynamic = 'force-dynamic'

export async function GET() {
  // Debug logging
  console.log('[PROVIDERS-API] Checking Google OAuth environment variables')
  console.log('[PROVIDERS-API] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined')
  console.log('[PROVIDERS-API] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'undefined')
  
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  console.log('[PROVIDERS-API] Google OAuth enabled:', googleEnabled)

  return NextResponse.json({
    google: googleEnabled,
    debug: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined'
    }
  })
}
