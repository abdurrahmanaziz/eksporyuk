import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/badges - Get group badges
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get all active badges
    const badges = await prisma.badgeDefinition.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any })
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get user's earned badges for this group
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { groupId: group.id },
          { groupId: null } // Global badges
        ]
      },
      include: {
        badge: true
      }
    })

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

    // Add earned status to badges
    const badgesWithStatus = badges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: userBadges.find(ub => ub.badgeId === badge.id)?.awardedAt
    }))

    return NextResponse.json({
      badges: badgesWithStatus,
      earnedCount: userBadges.length,
      totalCount: badges.length
    })
  } catch (error) {
    console.error('Get badges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/badges - Create badge (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check admin permission
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canCreate = membership?.role && ['OWNER', 'ADMIN'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canCreate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const {
      name,
      slug: badgeSlug,
      description,
      icon,
      color = '#3B82F6',
      category = 'PARTICIPATION',
      conditions,
      points = 0
    } = body

    if (!name || !badgeSlug || !description || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if slug is unique
    const existingBadge = await prisma.badgeDefinition.findUnique({
      where: { slug: badgeSlug }
    })

    if (existingBadge) {
      return NextResponse.json({ error: 'Badge slug already exists' }, { status: 400 })
    }

    const badge = await prisma.badgeDefinition.create({
      data: {
        name,
        slug: badgeSlug,
        description,
        icon,
        color,
        category,
        conditions,
        points
      }
    })

    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    console.error('Create badge error:', error)
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    )
  }
}
