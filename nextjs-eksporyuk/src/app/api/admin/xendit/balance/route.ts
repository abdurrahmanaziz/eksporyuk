import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { xenditService } from '@/lib/xendit'

// GET /api/admin/xendit/balance
// Fetch account balance from Xendit
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

    // Fetch balance from Xendit
    console.log('💰 [API] Fetching balance from Xendit...')
    console.log('🔑 Xendit Secret Key exists:', !!process.env.XENDIT_SECRET_KEY)
    
    // Check if Xendit is configured
    if (!process.env.XENDIT_SECRET_KEY) {
      console.log('⚠️ [API] Xendit Secret Key not configured')
      return NextResponse.json({
        success: false,
        data: null,
        message: 'Xendit tidak dikonfigurasi. Silakan tambahkan XENDIT_SECRET_KEY ke environment variables.',
        isConfigurationError: true
      }, { status: 400 })
    }
    
    try {
      const balance = await xenditService.getBalance()

      if (balance) {
        console.log('✅ [API] Balance fetched successfully:', balance)
        return NextResponse.json({
          success: true,
          data: balance,
          message: 'Balance fetched successfully'
        })
      } else {
        console.log('⚠️ [API] Balance is null/empty')
        return NextResponse.json({
          success: false,
          data: null,
          message: 'Failed to fetch balance - empty response'
        }, { status: 400 })
      }
    } catch (xenditError: any) {
      console.error('❌ [API] Xendit getBalance error:', {
        message: xenditError.message,
        code: xenditError.code,
        status: xenditError.status,
        statusCode: xenditError.statusCode,
        response: xenditError.response?.data || xenditError.response,
        fullError: xenditError
      })
      
      // Return more detailed error
      return NextResponse.json({
        success: false,
        data: null,
        message: `Xendit API Error: ${xenditError.message || 'Unknown error'}`,
        error: {
          code: xenditError.code || xenditError.statusCode,
          message: xenditError.message,
          status: xenditError.status || xenditError.statusCode
        }
      }, { status: xenditError.statusCode || 500 })
    }

  } catch (error: any) {
    console.error('❌ Error fetching Xendit balance:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
