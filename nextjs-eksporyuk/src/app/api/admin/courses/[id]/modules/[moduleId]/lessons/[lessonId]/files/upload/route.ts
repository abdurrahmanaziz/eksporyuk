import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Upload file from device
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'lessons', lessonId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const extension = originalName.substring(originalName.lastIndexOf('.'))
    const safeName = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '-')
    const fileName = `${safeName}-${timestamp}${extension}`
    
    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Generate public URL
    const fileUrl = `/uploads/lessons/${lessonId}/${fileName}`

    // Get current max order
    const maxOrderFile = await prisma.lessonFile.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrder = (maxOrderFile?.order ?? -1) + 1

    // Save to database
    const lessonFile = await prisma.lessonFile.create({
      data: {
        lessonId,
        title,
        fileName: originalName,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        order: nextOrder
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: lessonFile 
    }, { status: 201 })
  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
