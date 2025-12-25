import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Upload request received')
    
    // SECURITY: Check authentication (any authenticated user can upload for their bio)
    const session = await getServerSession(authOptions)
    
    console.log('🔵 Session:', session ? 'Authenticated' : 'Not authenticated')
    
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type: string = data.get('type') as string || 'bio'

    console.log('🔵 File:', file ? file.name : 'No file')
    console.log('🔵 Type:', type)

    if (!file) {
      console.log('❌ No file in form data')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type)
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    console.log('✅ File validation passed')

    // Upload to Vercel Blob (production) or local (development)
    const sanitizedType = type.replace(/[^a-z0-9]/gi, '_')
    const result = await uploadFile(file, {
      folder: 'bio',
      prefix: `${session.user.id}_${sanitizedType}`,
      maxSize: 2 * 1024 * 1024, // 2MB
    })

    console.log('✅ File uploaded successfully:', result.url)

    return NextResponse.json({ 
      success: true, 
      url: result.url,
      storage: result.storage,
      message: 'File uploaded successfully' 
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({ 
      error: 'Gagal upload file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
