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

    // Check if user is mentor or admin
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

    // Get materials from courses owned by this mentor (or all if admin)
    let whereClause = {}
    if (user.role === 'MENTOR' && mentorProfile) {
      whereClause = { mentorId: mentorProfile.id }
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            title: true,
            lessons: {
              select: {
                id: true,
                title: true,
                videoUrl: true,
                content: true,
                createdAt: true,
                files: {
                  select: {
                    id: true,
                    title: true,
                    fileName: true,
                    fileUrl: true,
                    fileType: true,
                    createdAt: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to materials format - include both lessons and files
    const materials: any[] = []

    courses.forEach(course => {
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          // Add lesson as material
          materials.push({
            id: lesson.id,
            title: lesson.title,
            description: lesson.content?.substring(0, 100) || '',
            type: lesson.videoUrl ? 'VIDEO' : 'LESSON',
            fileUrl: lesson.videoUrl || '',
            course: { id: course.id, title: course.title },
            module: { id: module.id, title: module.title },
            lesson: { id: lesson.id, title: lesson.title },
            createdAt: lesson.createdAt.toISOString()
          })

          // Add files as materials
          lesson.files.forEach(file => {
            materials.push({
              id: file.id,
              title: file.title,
              description: file.fileName,
              type: 'DOCUMENT',
              fileUrl: file.fileUrl,
              course: { id: course.id, title: course.title },
              module: { id: module.id, title: module.title },
              lesson: { id: lesson.id, title: lesson.title },
              createdAt: file.createdAt.toISOString()
            })
          })
        })
      })
    })

    return NextResponse.json({ 
      success: true,
      materials 
    })
  } catch (error) {
    console.error('Error fetching mentor materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}
