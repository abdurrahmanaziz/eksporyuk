import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/dashboard-options
 * Returns available dashboard options based on user's roles from database
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DASHBOARD OPTIONS] API called')
    const session = await getServerSession(authOptions)
    
    console.log('[DASHBOARD OPTIONS] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })
    
    if (!session?.user?.id) {
      console.log('[DASHBOARD OPTIONS] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get user with primary role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        affiliateMenuEnabled: true,
        preferredDashboard: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all user roles from UserRole table
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { role: true }
    })

    // Check if user has affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true, isActive: true }
    })

    // Combine primary role with additional roles
    const allRoles = new Set<string>()
    allRoles.add(user.role) // Primary role
    userRoles.forEach(ur => allRoles.add(ur.role)) // Additional roles

    // Build dashboard options based on all roles
    const dashboardOptions: Array<{
      id: string
      title: string
      description: string
      href: string
      icon: string
      color: string
      bgColor: string
    }> = []

    // Member dashboard - available if user has any member role
    const hasMemberRole = allRoles.has('MEMBER_FREE') || allRoles.has('MEMBER_PREMIUM')
    const hasAffiliateRole = allRoles.has('AFFILIATE')
    const hasMentorRole = allRoles.has('MENTOR')
    const hasAdminRole = allRoles.has('ADMIN')

    // Admin dashboard
    if (hasAdminRole) {
      dashboardOptions.push({
        id: 'admin',
        title: 'Admin Panel',
        description: 'Kelola platform, user, dan pengaturan sistem',
        href: '/admin',
        icon: 'Shield',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      })
    }

    // Member dashboard - for members OR affiliates/mentors who also have member access
    if (hasMemberRole || hasAffiliateRole || hasMentorRole) {
      dashboardOptions.push({
        id: 'member',
        title: 'Member Dashboard',
        description: 'Akses kursus, materi, dan fitur membership Anda',
        href: '/dashboard?selected=member',
        icon: 'User',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      })
    }

    // Affiliate dashboard - if has affiliate role OR affiliate menu enabled with profile
    const hasAffiliateAccess = hasAffiliateRole || (user.affiliateMenuEnabled && affiliateProfile?.isActive)
    if (hasAffiliateAccess) {
      dashboardOptions.push({
        id: 'affiliate',
        title: 'Rich Affiliate',
        description: 'Kelola affiliate earnings, track referral links, dan lihat komisi Anda',
        href: '/affiliate/dashboard',
        icon: 'DollarSign',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      })
    }

    // Mentor dashboard
    if (hasMentorRole) {
      dashboardOptions.push({
        id: 'mentor',
        title: 'Mentor Hub',
        description: 'Buat kursus, kelola siswa, dan pantau progress pembelajaran',
        href: '/mentor/dashboard',
        icon: 'GraduationCap',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200'
      })
    }

    return NextResponse.json({
      success: true,
      dashboardOptions,
      preferredDashboard: user.preferredDashboard,
      allRoles: Array.from(allRoles),
      needsSelection: dashboardOptions.length > 1,
    })

  } catch (error) {
    console.error('Error fetching dashboard options:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
