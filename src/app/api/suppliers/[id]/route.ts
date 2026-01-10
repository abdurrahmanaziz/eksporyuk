import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { checkDatabaseAccess, trackDatabaseView } from '@/lib/export-database'

// GET /api/suppliers/[id] - Get supplier detail (with quota tracking)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplierId = params.id

    // Check quota access
    const access = await checkDatabaseAccess(session.user.id, 'supplier')
    
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: 'Database access quota exceeded',
          message: `You have used ${access.viewsUsed} of ${access.monthlyQuota} views this month. Upgrade your membership for more access.`,
          quotaExceeded: true,
          viewsUsed: access.viewsUsed,
          monthlyQuota: access.monthlyQuota,
        },
        { status: 403 }
      )
    }

    // Get supplier details
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Track this view (increment quota usage)
    await trackDatabaseView(session.user.id, 'supplier', supplierId)

    return NextResponse.json({
      supplier,
      quota: {
        viewsUsed: access.viewsUsed + 1, // Include this view
        monthlyQuota: access.monthlyQuota,
        viewsRemaining: access.monthlyQuota - access.viewsUsed - 1,
      },
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}
