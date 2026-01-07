import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// PUT /api/admin/courses/[id]/modules/reorder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await request.json()
    const { modules } = body

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json({ error: 'Modules array is required' }, { status: 400 })
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Update order for each module
    const updatePromises = modules.map(({ id, order }: { id: string; order: number }) =>
      prisma.courseModule.update({
        where: { id },
        data: { order }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ 
      success: true,
      message: 'Module order updated successfully' 
    })
  } catch (error) {
    console.error('Reorder modules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
