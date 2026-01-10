import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/view-as-user
 * 
 * Memungkinkan admin untuk melihat platform dari perspektif user lain
 * untuk keperluan debugging, moderasi, dan dukungan customer
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[VIEW-AS-USER] API called')
    
    // 1. Verifikasi admin authentication
    const session = await getServerSession(authOptions)
    console.log('[VIEW-AS-USER] Session check:', { 
      hasSession: !!session, 
      userRole: session?.user?.role,
      userId: session?.user?.id 
    })

    if (!session || !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)) {
      console.log('[VIEW-AS-USER] ❌ UNAUTHORIZED - Not admin/founder/co-founder')
      return NextResponse.json(
        { error: 'Unauthorized - Admin/Founder access required' },
        { status: 403 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { targetUserId, reason } = body
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }
    
    // Auto-generate reason if not provided
    const auditReason = reason && reason.trim().length >= 10 
      ? reason 
      : `Admin viewed user profile via 3-dot menu - ${new Date().toISOString()}`

    console.log('[VIEW-AS-USER] Request:', { targetUserId, reason: auditReason.substring(0, 50) + '...' })

    // 3. Verifikasi target user exists dan tidak suspended
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendReason: true,
        username: true,
        avatar: true,
        whatsapp: true,
        emailVerified: true,
        memberCode: true,
        affiliateMenuEnabled: true,
        preferredDashboard: true,
      }
    })

    if (!targetUser) {
      console.log('[VIEW-AS-USER] ❌ Target user not found:', targetUserId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from impersonating other admins, founders, or co-founders
    const protectedRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (protectedRoles.includes(targetUser.role)) {
      console.log('[VIEW-AS-USER] ❌ Cannot impersonate protected role:', targetUser.role)
      return NextResponse.json(
        { error: 'Cannot impersonate admin, founder, or co-founder accounts' },
        { status: 403 }
      )
    }

    console.log('[VIEW-AS-USER] Target user found:', { 
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      isActive: targetUser.isActive,
      isSuspended: targetUser.isSuspended
    })

    // 4. Get additional roles for target user
    const userRoles = await prisma.userRole.findMany({
      where: { userId: targetUser.id },
      select: { role: true }
    })
    const allRoles = [targetUser.role, ...userRoles.map(ur => ur.role)]

    // 5. Get affiliate profile status
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: targetUser.id },
      select: { id: true, isActive: true }
    })

    // 6. Log admin action untuk audit trail
    try {
      await prisma.activityLog.create({
        data: {
          id: `admin_view_as_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'ADMIN_VIEW_AS_USER_START',
          entity: 'USER',
          entityId: targetUserId,
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            adminId: session.user.id,
            adminEmail: session.user.email,
            adminName: session.user.name,
            targetUserId: targetUser.id,
            targetUserEmail: targetUser.email,
            targetUserName: targetUser.name,
            targetUserRole: targetUser.role,
            reason: auditReason,
            timestamp: new Date().toISOString()
          }
        }
      })
      console.log('[VIEW-AS-USER] ✅ Activity logged for audit trail')
    } catch (logError) {
      console.error('[VIEW-AS-USER] Failed to log activity:', logError)
      // Don't fail the request if logging fails
    }

    // 7. Return impersonation session data
    const impersonationData = {
      // Original admin session data (untuk kembali)
      originalAdmin: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      // Target user data (untuk session baru)
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        allRoles: allRoles,
        username: targetUser.username,
        avatar: targetUser.avatar,
        whatsapp: targetUser.whatsapp,
        emailVerified: targetUser.emailVerified,
        memberCode: targetUser.memberCode,
        affiliateMenuEnabled: targetUser.affiliateMenuEnabled || (!!affiliateProfile && affiliateProfile.isActive),
        hasAffiliateProfile: !!affiliateProfile && affiliateProfile.isActive,
        preferredDashboard: targetUser.preferredDashboard
      },
      // Impersonation metadata
      impersonation: {
        isImpersonating: true,
        reason: auditReason,
        startedAt: new Date().toISOString(),
        adminId: session.user.id,
        adminEmail: session.user.email
      }
    }

    console.log('[VIEW-AS-USER] ✅ Impersonation data prepared for:', targetUser.email)
    
    return NextResponse.json({
      success: true,
      message: `Now viewing as ${targetUser.name || targetUser.email}`,
      data: impersonationData
    })

  } catch (error) {
    console.error('[VIEW-AS-USER] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/view-as-user
 * 
 * Admin kembali ke session asli mereka
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[VIEW-AS-USER] EXIT API called')
    
    // Get current session (yang mungkin impersonating)
    const session = await getServerSession(authOptions)
    
    // Log activity untuk audit trail
    try {
      if (session?.user?.id) {
        await prisma.activityLog.create({
          data: {
            id: `admin_view_as_end_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: session.user.id,
            action: 'ADMIN_VIEW_AS_USER_END',
            entity: 'USER',
            entityId: session.user.id,
            ipAddress: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
              timestamp: new Date().toISOString(),
              sessionUserId: session.user.id,
              sessionUserEmail: session.user.email
            }
          }
        })
        console.log('[VIEW-AS-USER] ✅ Exit activity logged')
      }
    } catch (logError) {
      console.error('[VIEW-AS-USER] Failed to log exit activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Returned to admin session'
    })

  } catch (error) {
    console.error('[VIEW-AS-USER] Exit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}