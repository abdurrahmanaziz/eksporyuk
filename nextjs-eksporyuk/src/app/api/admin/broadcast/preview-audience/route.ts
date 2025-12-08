import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/broadcast/preview-audience
 * Preview target audience for broadcast campaign
 * ADMIN ONLY
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    const {
      targetType,
      targetRoles,
      targetMembershipIds,
      targetGroupIds,
      targetCourseIds,
      customUserIds
    } = data

    let where: any = {
      isActive: true
    }

    switch (targetType) {
      case 'ALL':
        // All active users
        break

      case 'BY_ROLE':
        if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
          where.role = { in: targetRoles }
        }
        break

      case 'BY_MEMBERSHIP':
        if (targetMembershipIds && Array.isArray(targetMembershipIds) && targetMembershipIds.length > 0) {
          where.userMemberships = {
            some: {
              membershipId: { in: targetMembershipIds },
              isActive: true,
              endDate: { gt: new Date() }
            }
          }
        }
        break

      case 'BY_GROUP':
        if (targetGroupIds && Array.isArray(targetGroupIds) && targetGroupIds.length > 0) {
          where.groupMemberships = {
            some: {
              groupId: { in: targetGroupIds },
              status: 'ACTIVE'
            }
          }
        }
        break

      case 'BY_COURSE':
        if (targetCourseIds && Array.isArray(targetCourseIds) && targetCourseIds.length > 0) {
          where.courseEnrollments = {
            some: {
              courseId: { in: targetCourseIds },
              status: 'ACTIVE'
            }
          }
        }
        break

      case 'BY_TRANSACTION':
        const { targetTransactionStatus, targetTransactionType } = data
        let transactionWhere: any = {}
        
        if (targetTransactionStatus && Array.isArray(targetTransactionStatus) && targetTransactionStatus.length > 0) {
          transactionWhere.status = { in: targetTransactionStatus }
        }
        
        if (targetTransactionType && Array.isArray(targetTransactionType) && targetTransactionType.length > 0) {
          transactionWhere.type = { in: targetTransactionType }
        }
        
        if (Object.keys(transactionWhere).length > 0) {
          where.transactions = {
            some: transactionWhere
          }
        }
        break

      case 'BY_EVENT':
        const { targetEventIds } = data
        if (targetEventIds && Array.isArray(targetEventIds) && targetEventIds.length > 0) {
          where.eventRegistrations = {
            some: {
              eventId: { in: targetEventIds }
            }
          }
        }
        break

      case 'CUSTOM':
        if (customUserIds && Array.isArray(customUserIds) && customUserIds.length > 0) {
          where.id = { in: customUserIds }
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid target type' },
          { status: 400 }
        )
    }

    // Get users with email and whatsapp notification preferences
    const [
      totalUsers,
      emailEnabledUsers,
      whatsappEnabledUsers,
      users
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ 
        where: { 
          ...where, 
          emailNotifications: true, 
          email: { not: '' },
          NOT: {
            email: null
          }
        } 
      }),
      prisma.user.count({ 
        where: { 
          ...where, 
          whatsappNotifications: true, 
          whatsapp: { not: '' },
          NOT: {
            whatsapp: null
          }
        } 
      }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          emailNotifications: true,
          whatsappNotifications: true,
          whatsapp: true
        },
        take: 100, // Limit preview to 100 users
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      success: true,
      preview: {
        totalUsers,
        emailEnabledUsers,
        whatsappEnabledUsers,
        users,
        hasMore: totalUsers > 100
      }
    })
  } catch (error: any) {
    console.error('[BROADCAST_PREVIEW] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to preview audience' },
      { status: 500 }
    )
  }
}
