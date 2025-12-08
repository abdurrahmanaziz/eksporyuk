import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/memberships/packages/[id]/details - Get membership with groups and courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        membershipGroups: {
          include: {
            group: true
          }
        },
        membershipCourses: {
          include: {
            course: true
          }
        },
        membershipProducts: {
          include: {
            product: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      groups: membership.membershipGroups.map(mg => mg.group),
      courses: membership.membershipCourses.map(mc => mc.course),
      products: membership.membershipProducts.map(mp => mp.product)
    })
  } catch (error) {
    console.error('Fetch membership details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership details' },
      { status: 500 }
    )
  }
}
