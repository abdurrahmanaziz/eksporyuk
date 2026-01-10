import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - List all files for a lesson
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { lessonId } = params

    const files = await prisma.lessonFile.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error('GET lesson files error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson files' },
      { status: 500 }
    )
  }
}

// POST - Add a new file to a lesson
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { lessonId } = params
    const body = await request.json()
    const { title, fileName, fileUrl, fileSize, fileType } = body

    if (!title || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Title, fileName, and fileUrl are required' },
        { status: 400 }
      )
    }

    // Get current max order
    const maxOrderFile = await prisma.lessonFile.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrder = (maxOrderFile?.order ?? -1) + 1

    const file = await prisma.lessonFile.create({
      data: {
        lessonId,
        title,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        fileType: fileType || null,
        order: nextOrder
      }
    })

    return NextResponse.json({ success: true, file }, { status: 201 })
  } catch (error) {
    console.error('POST lesson file error:', error)
    return NextResponse.json(
      { error: 'Failed to add file' },
      { status: 500 }
    )
  }
}
