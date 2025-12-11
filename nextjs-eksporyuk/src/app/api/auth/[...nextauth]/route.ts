import { authOptions } from '@/lib/auth-options'
import NextAuth from 'next-auth'

// Force dynamic - disable caching for auth routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validate environment variables before initializing NextAuth
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error('[NEXTAUTH] CRITICAL ERROR: NEXTAUTH_SECRET is not set!')
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

const handler = NextAuth(authOptions)

// Helper to add no-cache headers
function addNoCacheHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  newHeaders.set('Pragma', 'no-cache')
  newHeaders.set('Expires', '0')
  newHeaders.set('CDN-Cache-Control', 'no-store')
  newHeaders.set('Cloudflare-CDN-Cache-Control', 'no-store')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

// Export with explicit error handling and no-cache headers
export async function GET(req: Request, context: any) {
  try {
    const response = await handler(req, context)
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error('[NEXTAUTH] GET Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    )
  }
}

export async function POST(req: Request, context: any) {
  try {
    const response = await handler(req, context)
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error('[NEXTAUTH] POST Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    )
  }
}
