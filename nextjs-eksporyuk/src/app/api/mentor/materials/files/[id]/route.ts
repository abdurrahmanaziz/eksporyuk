import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// DELETE /api/mentor/materials/files/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: fileId } = await params

    const file = await prisma.lessonFile.findUnique({
      where: { id: fileId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (file.lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    await prisma.lessonFile.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/mentor/materials/files/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

// PUT /api/mentor/materials/files/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: fileId } = await params
    const body = await request.json()
    const { title, fileName, fileUrl, fileType, order } = body

    const file = await prisma.lessonFile.findUnique({
      where: { id: fileId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (file.lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const updatedFile = await prisma.lessonFile.update({
      where: { id: fileId },
      data: {
        title: title !== undefined ? title : file.title,
        fileName: fileName !== undefined ? fileName : file.fileName,
        fileUrl: fileUrl !== undefined ? fileUrl : file.fileUrl,
        fileType: fileType !== undefined ? fileType : file.fileType,
        order: order !== undefined ? order : file.order
      }
    })

    return NextResponse.json({ 
      success: true,
      file: updatedFile 
    })
  } catch (error) {
    console.error('PUT /api/mentor/materials/files/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}
