import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ewalletService } from '@/lib/services/ewallet-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ewallet/accounts
 * Get user's cached e-wallet accounts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await ewalletService.getUserEWalletAccounts(session.user.id)

    return NextResponse.json({
      success: true,
      accounts: accounts.map(account => ({
        id: account.id,
        provider: account.provider,
        phoneNumber: account.phoneNumber,
        accountName: account.accountName,
        lastChecked: account.lastChecked
      }))
    })

  } catch (error) {
    console.error('[GET EWALLET ACCOUNTS ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get e-wallet accounts' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ewallet/accounts
 * Delete cached e-wallet account
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, phoneNumber } = await request.json()

    if (!provider || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Provider and phone number required' 
      }, { status: 400 })
    }

    const success = await ewalletService.deleteCachedAccount(provider, phoneNumber)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Account cache deleted successfully'
      })
    } else {
      return NextResponse.json({
        error: 'Failed to delete account cache'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('[DELETE EWALLET ACCOUNT ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete e-wallet account' },
      { status: 500 }
    )
  }
}