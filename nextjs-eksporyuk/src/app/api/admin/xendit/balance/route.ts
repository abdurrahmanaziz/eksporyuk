import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { xenditProxy } from '@/lib/xendit-proxy'

// Force dynamic to read from database at runtime
export const dynamic = 'force-dynamic'

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
    
    // Check if Xendit is configured (reads from database OR env vars)
    const isConfigured = await xenditProxy.isConfigured()
    console.log('🔑 Xendit is configured:', isConfigured)
    
    if (!isConfigured) {
      console.log('⚠️ [API] Xendit not configured in database or env vars')
      return NextResponse.json({
        success: false,
        data: null,
        message: 'Xendit tidak dikonfigurasi. Silakan konfigurasi di halaman Integrasi atau tambahkan XENDIT_SECRET_KEY ke environment variables.',
        isConfigurationError: true
      }, { status: 200 }) // Return 200 to prevent UI error, configuration error handled in body
    }
    
    try {
      const balance = await xenditProxy.getBalance()

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
          message: 'Tidak dapat mengambil saldo - response kosong dari Xendit'
        }, { status: 200 }) // Return 200 to prevent UI crash
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
      
      // Check for authentication errors
      const isAuthError = xenditError.statusCode === 401 || 
                          xenditError.message?.toLowerCase().includes('unauthorized') ||
                          xenditError.message?.toLowerCase().includes('authentication');
      
      // Return 200 with error info to prevent UI crash
      return NextResponse.json({
        success: false,
        data: null,
        message: isAuthError 
          ? 'Xendit API Key tidak valid. Silakan periksa konfigurasi di halaman Integrasi.'
          : `Tidak dapat mengambil saldo Xendit: ${xenditError.message || 'Unknown error'}`,
        isConfigurationError: isAuthError,
        error: {
          code: xenditError.code || xenditError.statusCode,
          message: xenditError.message,
          status: xenditError.status || xenditError.statusCode
        }
      }, { status: 200 }) // Return 200 to prevent UI crash, error handled in response body
    }

  } catch (error: any) {
    console.error('❌ Error fetching Xendit balance:', error)
    // Return 200 with error info to prevent UI crash
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        message: error.message || 'Terjadi kesalahan saat mengambil saldo Xendit',
        error: error.message 
      },
      { status: 200 }
    )
  }
}
