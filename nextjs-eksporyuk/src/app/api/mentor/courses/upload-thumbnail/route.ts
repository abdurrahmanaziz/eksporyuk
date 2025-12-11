import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { writeFile } from 'fs/promises'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Generate filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `course-${courseId}-${timestamp}${ext}`
    
    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses')
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }
    
    // Save file
    const filepath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)
    
    // Return public URL
    const url = `/uploads/courses/${filename}`
    
    return NextResponse.json({ 
      success: true,
      url,
      filename
    })
    
  } catch (error) {
    console.error('Upload thumbnail error:', error)
    return NextResponse.json(
      { error: 'Failed to upload thumbnail' },
      { status: 500 }
    )
  }
}
