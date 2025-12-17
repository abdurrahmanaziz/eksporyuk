import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

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

    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: `lessons/${lessonId}`,
      prefix: 'file',
      maxSize: 50 * 1024 * 1024, // 50MB for lesson files
      allowedTypes: [], // Allow all types for lesson materials
    })

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
        fileName: file.name,
        fileUrl: result.url,
        fileSize: file.size,
        fileType: file.type,
        order: nextOrder
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: lessonFile,
      storage: result.storage
    }, { status: 201 })
  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
