import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PUT /api/admin/courses/[id]/modules/[moduleId]/lessons/reorder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, moduleId } = await params
    const body = await request.json()
    const { lessons } = body

    if (!lessons || !Array.isArray(lessons)) {
      return NextResponse.json({ error: 'Lessons array is required' }, { status: 400 })
    }

    // Verify module belongs to course
    const module = await prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        courseId: courseId
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Update order for each lesson
    const updatePromises = lessons.map(({ id, order }: { id: string; order: number }) =>
      prisma.courseLesson.update({
        where: { id },
        data: { order }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ 
      success: true,
      message: 'Lesson order updated successfully' 
    })
  } catch (error) {
    console.error('Reorder lessons error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
