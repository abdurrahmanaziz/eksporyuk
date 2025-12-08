import { authOptions } from '@/lib/auth-options'
import NextAuth from 'next-auth'

// Validate environment variables before initializing NextAuth
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error('[NEXTAUTH] CRITICAL ERROR: NEXTAUTH_SECRET is not set!')
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

const handler = NextAuth(authOptions)

// Export with explicit error handling
export async function GET(req: Request, context: any) {
  try {
    return await handler(req, context)
  } catch (error) {
    console.error('[NEXTAUTH] GET Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(req: Request, context: any) {
  try {
    return await handler(req, context)
  } catch (error) {
    console.error('[NEXTAUTH] POST Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
