import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getGoogleOAuthConfig } from '@/lib/integration-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/google-oauth/sync
 * Check if Google OAuth config from database matches environment variables
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const dbConfig = await getGoogleOAuthConfig()
    
    const envClientId = process.env.GOOGLE_CLIENT_ID
    const envClientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    const isSynced = dbConfig && 
                     dbConfig.GOOGLE_CLIENT_ID === envClientId &&
                     dbConfig.GOOGLE_CLIENT_SECRET === envClientSecret
    
    return NextResponse.json({
      success: true,
      data: {
        hasDbConfig: !!dbConfig,
        hasEnvConfig: !!(envClientId && envClientSecret),
        isSynced,
        needsRestart: !!dbConfig && !isSynced,
        message: isSynced 
          ? 'Google OAuth config tersinkronisasi dengan environment'
          : dbConfig 
            ? 'Config tersimpan di database. Restart aplikasi untuk mengaktifkan.'
            : 'Google OAuth belum dikonfigurasi'
      }
    })
  } catch (error: any) {
    console.error('Error checking Google OAuth sync:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
