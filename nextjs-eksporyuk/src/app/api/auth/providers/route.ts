import { NextResponse } from 'next/server'

// Force dynamic to read env vars at runtime, not build time
export const dynamic = 'force-dynamic'

export async function GET() {
  const googleEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  )

  return NextResponse.json({
    google: googleEnabled,
  })
}
