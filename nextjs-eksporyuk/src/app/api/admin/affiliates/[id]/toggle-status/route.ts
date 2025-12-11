import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/affiliates/[id]/toggle-status
 * 
 * Toggle affiliate active/inactive status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get affiliate
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        isActive: true,
        approvedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Affiliate not found' },
        { status: 404 }
      )
    }

    // 3. Check if affiliate is approved
    if (!affiliate.approvedAt) {
      return NextResponse.json(
        { success: false, error: 'Cannot toggle status of unapproved affiliate. Approve or reject first.' },
        { status: 400 }
      )
    }

    // 4. Toggle active status
    const updatedAffiliate = await prisma.affiliateProfile.update({
      where: { id: params.id },
      data: {
        isActive: !affiliate.isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 5. Log the action
    console.log('Affiliate Status Toggled:', {
      affiliateId: params.id,
      userId: affiliate.userId,
      toggledBy: session.user.id,
      toggledAt: new Date(),
      previousStatus: affiliate.isActive,
      newStatus: !affiliate.isActive,
    })

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: `Affiliate ${updatedAffiliate.isActive ? 'activated' : 'deactivated'} successfully`,
      affiliate: updatedAffiliate,
    })

  } catch (error) {
    console.error('Error toggling affiliate status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
