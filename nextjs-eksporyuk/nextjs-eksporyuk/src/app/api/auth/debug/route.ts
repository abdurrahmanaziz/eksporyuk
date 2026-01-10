import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    google: {
      hasClientId: !!googleClientId,
      hasClientSecret: !!googleClientSecret,
      clientIdPrefix: googleClientId?.substring(0, 20) + '...',
      expectedCallbackUrl: `${nextAuthUrl}/api/auth/callback/google`,
    },
    nextauth: {
      url: nextAuthUrl,
      hasSecret: !!nextAuthSecret,
      secretLength: nextAuthSecret?.length,
    },
    mailketing: {
      hasApiKey: !!process.env.MAILKETING_API_KEY,
      apiUrl: process.env.MAILKETING_API_URL,
      fromEmail: process.env.MAILKETING_FROM_EMAIL,
    },
    instructions: {
      googleConsoleSettings: [
        '1. Go to https://console.cloud.google.com/apis/credentials',
        '2. Click on your OAuth 2.0 Client ID',
        '3. Under "Authorized redirect URIs", add:',
        `   ${nextAuthUrl}/api/auth/callback/google`,
        '4. Save changes',
        '5. Wait a few minutes for changes to propagate',
      ],
    },
  }
  
  return NextResponse.json(debugInfo)
}
