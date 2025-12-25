import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/mailketing/balance
// Fetch account balance from Mailketing
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch balance from Mailketing
    console.log('💰 [API] Fetching balance from Mailketing...')
    const response = await mailketing.getAccountBalance()

    if (response.success) {
      return NextResponse.json({
        success: true,
        data: response.data,
        message: response.message || 'Balance fetched successfully'
      })
    } else {
      // Return 200 but with success: false for expected conditions
      return NextResponse.json({
        success: false,
        data: null,
        message: response.message,
        error: response.error
      })
    }

  } catch (error: any) {
    console.error('❌ Error fetching Mailketing balance:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
