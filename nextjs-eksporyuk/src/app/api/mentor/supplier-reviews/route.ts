import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/mentor/supplier-reviews - Get suppliers waiting for mentor review (MENTOR only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is MENTOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Forbidden. Only MENTOR can access this resource.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'WAITING_REVIEW'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get suppliers with their assessments
    const [suppliers, total] = await Promise.all([
      prisma.supplierProfile.findMany({
        where: {
          status: status as any,
        },
        include: {
          assessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              answers: {
                include: {
                  question: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'asc' }, // Oldest first (FIFO)
        skip,
        take: limit,
      }),
      prisma.supplierProfile.count({
        where: {
          status: status as any,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[MENTOR_SUPPLIER_REVIEWS_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
