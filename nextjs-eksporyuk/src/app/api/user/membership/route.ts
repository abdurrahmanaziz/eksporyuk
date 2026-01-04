import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Step 1: Fetch active user membership (no relations - schema doesn't have them)
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        isActive: true,
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { 
          membership: null,
          message: 'No active membership found'
        },
        { status: 200 }
      )
    }

    // Step 2: Fetch membership details (manual join)
    const membership = await prisma.membership.findUnique({
      where: { id: userMembership.membershipId }
    })

    if (!membership) {
      return NextResponse.json(
        { 
          membership: null,
          message: 'Membership data not found'
        },
        { status: 200 }
      )
    }

    // Step 3: Fetch related data (groups, courses, products) - parallel queries for efficiency
    const [membershipGroups, membershipCourses, membershipProducts, transaction] = await Promise.all([
      // Get groups via MembershipGroup junction table
      prisma.membershipGroup.findMany({
        where: { membershipId: membership.id }
      }).then(async (junctions) => {
        if (junctions.length === 0) return []
        const groupIds = junctions.map(j => j.groupId)
        return prisma.group.findMany({
          where: { id: { in: groupIds } },
          select: { id: true, name: true }
        })
      }),
      
      // Get courses via MembershipCourse junction table
      prisma.membershipCourse.findMany({
        where: { membershipId: membership.id }
      }).then(async (junctions) => {
        if (junctions.length === 0) return []
        const courseIds = junctions.map(j => j.courseId)
        return prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, slug: true }
        })
      }),
      
      // Get products via MembershipProduct junction table
      prisma.membershipProduct.findMany({
        where: { membershipId: membership.id }
      }).then(async (junctions) => {
        if (junctions.length === 0) return []
        const productIds = junctions.map(j => j.productId)
        return prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true }
        })
      }),
      
      // Get transaction if exists
      userMembership.transactionId 
        ? prisma.transaction.findUnique({
            where: { id: userMembership.transactionId },
            select: { id: true, createdAt: true, amount: true, status: true }
          })
        : Promise.resolve(null)
    ])

    // Step 4: Compose the response
    const transformedMembership = {
      ...userMembership,
      membership: {
        ...membership,
        groups: membershipGroups,
        courses: membershipCourses,
        products: membershipProducts,
      },
      transaction
    }

    return NextResponse.json(
      { 
        membership: transformedMembership,
        message: 'Success'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[API] Error fetching user membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

