import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { checkEmailCredits, getCreditUsageStats } from '@/lib/email-credits-monitor'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/email-credits
 * Check current email credits balance and status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get stats parameter
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Check current balance
    const balanceCheck = await checkEmailCredits()
    
    let response: any = {
      success: true,
      balance: balanceCheck.balance,
      status: balanceCheck.status,
      alert: balanceCheck.alert
    }

    // Include usage statistics if requested
    if (includeStats) {
      const stats = await getCreditUsageStats(days)
      response.stats = stats
      response.period = `${days} days`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error checking email credits:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/email-credits
 * Manually trigger credit check and alerts
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    console.log('🔄 [CREDITS-API] Manual credit check triggered by admin')

    // Check current balance and trigger alerts if needed
    const balanceCheck = await checkEmailCredits()
    
    return NextResponse.json({
      success: true,
      message: 'Credit check completed',
      balance: balanceCheck.balance,
      status: balanceCheck.status,
      alert: balanceCheck.alert,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in manual credit check:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
