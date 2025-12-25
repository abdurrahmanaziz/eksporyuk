import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/courses/[id]/consents
 * Get all consent records for a course (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and mentor can access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const courseId = resolvedParams.id

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Build where clause
    let where: any = {
      courseId
    }

    // If searching, we need to filter by user after fetching
    let searchFilter = ''
    if (search) {
      searchFilter = search.toLowerCase()
    }

    // Get all consents first (we'll filter and paginate after joining with users)
    const allConsents = await prisma.courseConsent.findMany({
      where,
      orderBy: { agreedAt: 'desc' }
    })

    // Fetch all user data
    const userIds = allConsents.map(c => c.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        memberCode: true,
        phone: true,
        whatsapp: true
      }
    })

    // Map users to consents
    const userMap = new Map(users.map(u => [u.id, u]))
    let consentsWithUsers = allConsents.map(consent => ({
      ...consent,
      user: userMap.get(consent.userId) || null
    }))

    // Filter by search if needed
    if (searchFilter) {
      consentsWithUsers = consentsWithUsers.filter(c => {
        const user = c.user
        if (!user) return false
        return (
          user.name?.toLowerCase().includes(searchFilter) ||
          user.email?.toLowerCase().includes(searchFilter)
        )
      })
    }

    // Calculate pagination
    const total = consentsWithUsers.length
    const startIndex = (page - 1) * limit
    const consents = consentsWithUsers.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      course,
      consents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching consents:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data persetujuan' },
      { status: 500 }
    )
  }
}
