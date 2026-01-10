import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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
        const pendingAffiliates = await prisma.affiliateProfile.findMany({
          where: {
            approvedAt: null
          },
          select: { userId: true }
        })
        
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            approvedAt: null
          },
          data: {
            approvedAt: new Date(),
            isActive: true
          }
        })
        
        // Auto-grant AFFILIATE role to approved users
        for (const affiliate of pendingAffiliates) {
          await prisma.user.update({
            where: { id: affiliate.userId },
            data: { role: 'AFFILIATE' }
          })
        }
        
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil di-approve dan diberi akses AFFILIATE role`,
          count: updated.count
        }
        break
      }

      case 'activate-all': {
        // Activate ALL affiliates (also approve if not approved yet)
        const inactiveAffiliates = await prisma.affiliateProfile.findMany({
          where: {
            isActive: false
          },
          select: { userId: true }
        })
        
        const updated = await prisma.affiliateProfile.updateMany({
          where: {
            isActive: false
          },
          data: {
            approvedAt: new Date(), // Also approve if not approved
            isActive: true
          }
        })
        
        // Auto-grant AFFILIATE role to activated users
        for (const affiliate of inactiveAffiliates) {
          await prisma.user.update({
            where: { id: affiliate.userId },
            data: { role: 'AFFILIATE' }
          })
        }
        
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil diaktifkan dan diberi akses AFFILIATE role`,
          count: updated.count
        }
        break
      }

      case 'approve-selected': {
        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
          return NextResponse.json({ error: 'affiliateIds is required' }, { status: 400 })
        }
        
        const selectedAffiliates = await prisma.affiliateProfile.findMany({
          where: {
            id: { in: affiliateIds },
            approvedAt: null
          },
          select: { userId: true }
        })
        
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
        
        // Auto-grant AFFILIATE role to approved users
        for (const affiliate of selectedAffiliates) {
          await prisma.user.update({
            where: { id: affiliate.userId },
            data: { role: 'AFFILIATE' }
          })
        }
        
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil di-approve dan diberi akses AFFILIATE role`,
          count: updated.count
        }
        break
      }

      case 'activate-selected': {
        if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
          return NextResponse.json({ error: 'affiliateIds is required' }, { status: 400 })
        }
        
        const selectedAffiliates = await prisma.affiliateProfile.findMany({
          where: {
            id: { in: affiliateIds }
          },
          select: { userId: true }
        })
        
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
        
        // Auto-grant AFFILIATE role to activated users
        for (const affiliate of selectedAffiliates) {
          await prisma.user.update({
            where: { id: affiliate.userId },
            data: { role: 'AFFILIATE' }
          })
        }
        
        result = {
          success: true,
          message: `${updated.count} affiliate berhasil diaktifkan dan diberi akses AFFILIATE role`,
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
