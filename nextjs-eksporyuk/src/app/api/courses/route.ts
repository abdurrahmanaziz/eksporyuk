import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')

    const where: any = {}

    // Filter by status if provided
    if (status) {
      where.status = status
    } else {
      // Default: only show published courses for non-admin
      if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
        where.status = 'PUBLISHED'
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true
          }
        },
        ...(session?.user?.id && {
          enrollments: {
            where: {
              userId: session.user.id
            },
            select: {
              id: true
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ courses })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
