import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/events/quota-status
 * Get quota status for all events of the admin
 * Returns: Array of events with registration counts and quota info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can access this' },
        { status: 403 }
      )
    }

    // Get all events created by this admin
    const events = await prisma.product.findMany({
      where: {
        creatorId: session.user.id,
        productType: 'EVENT',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        maxParticipants: true,
        eventDate: true,
        productStatus: true,
        createdAt: true
      },
      orderBy: { eventDate: 'asc' }
    })

    // Get registration count for each event
    const eventsWithQuota = await Promise.all(
      events.map(async (event) => {
        // Count only SUCCESS transactions (paid registrations)
        const registrationCount = await prisma.transaction.count({
          where: { 
            productId: event.id,
            status: 'SUCCESS'
          }
        })

        const percentFull = event.maxParticipants 
          ? (registrationCount / event.maxParticipants) * 100 
          : 0
        
        const remaining = event.maxParticipants 
          ? event.maxParticipants - registrationCount 
          : null

        // Determine quota status
        let quotaStatus = 'AVAILABLE'
        if (percentFull >= 100) {
          quotaStatus = 'FULL'
        } else if (percentFull >= 95) {
          quotaStatus = 'CRITICAL'
        } else if (percentFull >= 80) {
          quotaStatus = 'WARNING'
        }

        return {
          id: event.id,
          name: event.name,
          eventDate: event.eventDate,
          maxParticipants: event.maxParticipants,
          registrations: registrationCount,
          remaining: remaining,
          percentFull: Math.round(percentFull * 10) / 10, // 1 decimal place
          quotaStatus: quotaStatus,
          productStatus: event.productStatus,
          createdAt: event.createdAt
        }
      })
    )

    // Sort by quota status (critical first)
    const statusOrder = { FULL: 0, CRITICAL: 1, WARNING: 2, AVAILABLE: 3 }
    eventsWithQuota.sort((a, b) => statusOrder[a.quotaStatus as keyof typeof statusOrder] - statusOrder[b.quotaStatus as keyof typeof statusOrder])

    return NextResponse.json({
      success: true,
      data: eventsWithQuota,
      summary: {
        total: eventsWithQuota.length,
        full: eventsWithQuota.filter(e => e.quotaStatus === 'FULL').length,
        critical: eventsWithQuota.filter(e => e.quotaStatus === 'CRITICAL').length,
        warning: eventsWithQuota.filter(e => e.quotaStatus === 'WARNING').length,
        available: eventsWithQuota.filter(e => e.quotaStatus === 'AVAILABLE').length
      }
    })
  } catch (error) {
    console.error('[Admin Events Quota Status API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quota status' },
      { status: 500 }
    )
  }
}
