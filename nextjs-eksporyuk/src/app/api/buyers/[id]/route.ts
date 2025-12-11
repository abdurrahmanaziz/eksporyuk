import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkDatabaseAccess, trackDatabaseView } from '@/lib/export-database'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/buyers/[id] - View buyer detail (tracks quota)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyerId = params.id

    // Check if user can access
    const access = await checkDatabaseAccess(session.user.id, 'buyer')

    if (!access.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded', 
          message: `Kamu sudah menggunakan ${access.used}/${access.quota} quota bulan ini. Upgrade paket untuk akses lebih banyak!`,
          upgrade: true
        },
        { status: 403 }
      )
    }

    // Get buyer detail
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Track view
    await trackDatabaseView(session.user.id, 'buyer', buyerId)

    // Update access info after tracking
    const updatedAccess = await checkDatabaseAccess(session.user.id, 'buyer')

    return NextResponse.json({
      buyer,
      quota: {
        used: updatedAccess.used,
        remaining: updatedAccess.remaining,
        isUnlimited: updatedAccess.isUnlimited
      }
    })
  } catch (error: any) {
    console.error('Get buyer detail error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
