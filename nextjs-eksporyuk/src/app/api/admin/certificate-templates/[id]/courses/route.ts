import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

type Params = {
  id: string
}

// GET /api/admin/certificate-templates/[id]/courses - Get courses assigned to template
export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    const courses = await prisma.course.findMany({
      where: { certificateTemplateId: params.id },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    return NextResponse.json({ 
      courseIds: courses.map(c => c.id),
      courses
    })
  } catch (error) {
    console.error('Error fetching template courses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/certificate-templates/[id]/courses - Update courses assigned to template
export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const body = await req.json()
    const { courseIds = [] } = body

    // First, unassign this template from all courses
    await prisma.course.updateMany({
      where: { certificateTemplateId: params.id },
      data: { certificateTemplateId: null }
    })

    // Then assign to selected courses
    if (courseIds.length > 0) {
      await prisma.course.updateMany({
        where: { 
          id: { in: courseIds }
        },
        data: { 
          certificateTemplateId: params.id 
        }
      })
    }

    return NextResponse.json({ 
      message: 'Course assignments updated successfully',
      assignedCount: courseIds.length
    })
  } catch (error) {
    console.error('Error updating course assignments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
