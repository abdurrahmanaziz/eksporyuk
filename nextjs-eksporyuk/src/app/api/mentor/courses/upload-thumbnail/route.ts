import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: 'courses',
      prefix: `course-${courseId || 'new'}`,
      maxSize: 5 * 1024 * 1024, // 5MB for thumbnails
    })
    
    return NextResponse.json({ 
      success: true,
      url: result.url,
      filename: result.filename,
      storage: result.storage
    })
    
  } catch (error) {
    console.error('Upload thumbnail error:', error)
    return NextResponse.json(
      { error: 'Failed to upload thumbnail' },
      { status: 500 }
    )
  }
}
