import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/members - Get group members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const members = await prisma.groupMember.findMany({
      where: {
        groupId: group.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'desc' },
      ],
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/members - Join group or add member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const foundGroup = await prisma.group.findFirst({ 
      where: { 
        OR: [
          { slug },
          { id: slug }
        ]
      }, 
      select: { id: true } 
    })
    if (!foundGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    const groupId = foundGroup.id
    const body = await request.json()
    const { userId, role } = body

    // Check if group exists and get current user's membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // If adding another user (admin/owner only)
    if (userId && userId !== session.user.id) {
      const currentMember = group.members[0]
      
      if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // Add the specified user
      const member = await prisma.groupMember.create({
        data: {
          groupId: groupId,
          userId: userId,
          role: role || 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      })

      // Auto-enroll member to all group courses
      const groupCourses = await prisma.course.findMany({
        where: { groupId: groupId },
        select: { id: true },
      })

      if (groupCourses.length > 0) {
        const enrollmentsToCreate = groupCourses.map((course) => ({
          userId: userId,
          courseId: course.id,
          status: 'ACTIVE' as const,
        }))

        for (const enrollment of enrollmentsToCreate) {
          await prisma.courseEnrollment.upsert({
            where: {
              userId_courseId: {
                userId: enrollment.userId,
                courseId: enrollment.courseId,
              },
            },
            update: {},
            create: enrollment,
          })
        }
      }

      return NextResponse.json({ 
        member,
        autoEnrolledCourses: groupCourses.length,
      }, { status: 201 })
    }

    // Self-join
    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: session.user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      )
    }

    // For PRIVATE groups, check if user has required membership access
    if (group.type === 'PRIVATE') {
      // Get user's active memberships
      const userMemberships = await prisma.userMembership.findMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
        include: {
          membership: {
            include: {
              membershipGroups: {
                where: {
                  groupId: groupId,
                },
              },
            },
          },
        },
      })

      // Check if any of user's memberships grant access to this group
      const hasAccess = userMemberships.some(
        (um) => um.membership.membershipGroups.length > 0
      )

      if (!hasAccess) {
        return NextResponse.json(
          { 
            error: 'Membership required',
            message: 'Grup ini memerlukan membership premium. Silakan upgrade untuk mengakses grup eksklusif ini.',
            requiresUpgrade: true,
          },
          { status: 403 }
        )
      }
    }

    // For private groups, should create join request (simplified - auto-approve for now)
    const member = await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: session.user.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Auto-enroll member to all group courses
    const groupCourses = await prisma.course.findMany({
      where: { groupId: groupId },
      select: { id: true },
    })

    if (groupCourses.length > 0) {
      const enrollmentsToCreate = groupCourses.map((course) => ({
        userId: session.user.id,
        courseId: course.id,
        status: 'ACTIVE' as const,
      }))

      for (const enrollment of enrollmentsToCreate) {
        await prisma.courseEnrollment.upsert({
          where: {
            userId_courseId: {
              userId: enrollment.userId,
              courseId: enrollment.courseId,
            },
          },
          update: {},
          create: enrollment,
        })
      }
    }

    return NextResponse.json({ 
      member,
      autoEnrolledCourses: groupCourses.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[slug]/members - Leave group or remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    
    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    
    const id = group.id
    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    // If removing another user (admin/owner only)
    if (userIdToRemove && userIdToRemove !== session.user.id) {
      const currentMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: id,
            userId: session.user.id,
          },
        },
      })

      if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // Remove the specified user
      await prisma.groupMember.delete({
        where: {
          groupId_userId: {
            groupId: id,
            userId: userIdToRemove,
          },
        },
      })

      return NextResponse.json({ message: 'Member removed' })
    }

    // Self-leave
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ message: 'Left group successfully' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    )
  }
}
