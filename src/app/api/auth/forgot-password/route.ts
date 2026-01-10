import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * DEPRECATED API - Please use /api/auth/forgot-password-v2
 * This endpoint is kept for backward compatibility but will be removed in future versions.
 * 
 * @deprecated Use /api/auth/forgot-password-v2 instead
 */
export async function POST(request: NextRequest) {
  console.warn('⚠️ DEPRECATED: /api/auth/forgot-password called. Use /api/auth/forgot-password-v2 instead');
  
  // Forward to V2 API
  try {
    const body = await request.json()
    
    // Call the new V2 endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/forgot-password-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'X-Deprecated-API': 'true',
        'X-New-Endpoint': '/api/auth/forgot-password-v2'
      }
    })
  } catch (error) {
    console.error('❌ Error forwarding to V2 API:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
