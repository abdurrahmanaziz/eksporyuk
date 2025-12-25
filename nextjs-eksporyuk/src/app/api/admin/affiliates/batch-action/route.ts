import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/affiliates/batch-action
 * 
 * Batch actions for affiliates:
 * - approve-all: Approve all pending affiliates
 * - activate-all: Activate all approved but inactive affiliates
 * - approve-selected: Approve selected affiliate IDs
 * - activate-selected: Activate selected affiliate IDs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, affiliateIds } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case 'approve-all': {
        // Approve all pending affiliates
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            approvedAt: null
          },
          data: {
            approvedAt: new Date(),
            isActive: true
          }
        })
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil di-approve`,
          count: updated.count
        }
        break
      }

      case 'activate-all': {
        // Activate ALL affiliates (also approve if not approved yet)
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            isActive: false
          },
          data: {
            approvedAt: new Date(), // Also approve if not approved
            isActive: true
          }
        })
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil diaktifkan`,
          count: updated.count
        }
        break
      }

      case 'approve-selected': {
        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
          return NextResponse.json({ error: 'affiliateIds is required' }, { status: 400 })
        }
        
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            id: { in: affiliateIds },
            approvedAt: null
          },
          data: {
            approvedAt: new Date(),
            isActive: true
          }
        })
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil di-approve`,
          count: updated.count
        }
        break
      }

      case 'activate-selected': {
        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
          return NextResponse.json({ error: 'affiliateIds is required' }, { status: 400 })
        }
        
        // Activate selected affiliates (also approve if not approved yet)
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            id: { in: affiliateIds }
          },
          data: {
            approvedAt: new Date(), // Also approve if not approved
            isActive: true
          }
        })
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil diaktifkan`,
          count: updated.count
        }
        break
      }

      case 'deactivate-selected': {
        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
          return NextResponse.json({ error: 'affiliateIds is required' }, { status: 400 })
        }
        
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            id: { in: affiliateIds }
          },
          data: {
            isActive: false
          }
        })
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil dinonaktifkan`,
          count: updated.count
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in batch action:', error)
    return NextResponse.json(
      { error: 'Failed to perform batch action' },
      { status: 500 }
    )
  }
}
