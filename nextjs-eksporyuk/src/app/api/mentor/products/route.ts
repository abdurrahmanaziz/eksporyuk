import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!mentorProfile) {
      return NextResponse.json({ products: [] })
    }

    // Get courses as products
    const courses = await prisma.course.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    // Transform to products format
    const products = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: Number(course.price) || 0,
      salePrice: course.originalPrice ? Number(course.originalPrice) : undefined,
      thumbnail: course.thumbnail,
      type: 'COURSE' as const,
      status: course.status === 'PUBLISHED' ? 'ACTIVE' as const : 'DRAFT' as const,
      salesCount: course._count.enrollments,
      revenue: (Number(course.price) || 0) * course._count.enrollments,
      createdAt: course.createdAt.toISOString()
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching mentor products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
