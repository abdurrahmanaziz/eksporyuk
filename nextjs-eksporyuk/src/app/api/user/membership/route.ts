import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    // Fetch active user membership with all relations
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        isActive: true,
      },
      include: {
        membership: {
          include: {
            membershipGroups: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            },
            membershipCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  }
                }
              }
            },
            membershipProducts: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  }
                }
              }
            },
          }
        },
        transaction: {
          select: {
            id: true,
            createdAt: true,
            amount: true,
            status: true,
          }
        }
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

    // Transform the data to flatten the nested structure
    const transformedMembership = {
      ...userMembership,
      membership: {
        ...userMembership.membership,
        groups: userMembership.membership.membershipGroups.map((mg: any) => mg.group),
        courses: userMembership.membership.membershipCourses.map((mc: any) => mc.course),
        products: userMembership.membership.membershipProducts.map((mp: any) => mp.product),
        // Remove the nested relations from response
        membershipGroups: undefined,
        membershipCourses: undefined,
        membershipProducts: undefined,
      }
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

