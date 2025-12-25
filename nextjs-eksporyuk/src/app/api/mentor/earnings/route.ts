import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
      return NextResponse.json({
        overview: {
          totalEarnings: 0,
          monthlyEarnings: 0,
          pendingPayout: 0,
          lastPayout: 0,
          growthPercent: 0,
        },
        breakdown: { courses: 0, products: 0, affiliates: 0 },
        transactions: [],
        monthlyData: [],
      })
    }

    // Get earnings data from courses
    const courses = await prisma.course.findMany({
      where: { mentorId: mentorProfile.id },
      select: {
        id: true,
        title: true,
        price: true,
        enrollments: {
          select: {
            id: true,
            createdAt: true
          }
        }
      }
    })

    // Calculate earnings
    const totalEarnings = courses.reduce((sum, course) => {
      return sum + (Number(course.price) || 0) * course.enrollments.length * 0.7 // 70% commission
    }, 0)

    const now = new Date()
    const thisMonth = courses.reduce((sum, course) => {
      const monthEnrollments = course.enrollments.filter(e => {
        const enrollDate = new Date(e.createdAt)
        return enrollDate.getMonth() === now.getMonth() && 
               enrollDate.getFullYear() === now.getFullYear()
      })
      return sum + (Number(course.price) || 0) * monthEnrollments.length * 0.7
    }, 0)

    // Calculate breakdown
    const courseEarnings = courses.reduce((sum, course) => {
      return sum + (Number(course.price) || 0) * course.enrollments.length * 0.7
    }, 0)

    return NextResponse.json({
      overview: {
        totalEarnings,
        monthlyEarnings: thisMonth,
        pendingPayout: totalEarnings * 0.2, // 20% pending
        lastPayout: 0,
        growthPercent: 0,
      },
      breakdown: {
        courses: courseEarnings,
        products: 0,
        affiliates: 0,
      },
      transactions: [],
      monthlyData: [],
    })
  } catch (error) {
    console.error('Error fetching mentor earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
