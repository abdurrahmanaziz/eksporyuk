import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Public endpoint untuk debug environment
  const envCheck = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
  }

  return NextResponse.json(envCheck)
}
