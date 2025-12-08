import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

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

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    console.log('✅ File validation passed')

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with user ID for security
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const sanitizedType = type.replace(/[^a-z0-9]/gi, '_')
    const filename = `${session.user.id}_${sanitizedType}_${timestamp}.${extension}`

    console.log('🔵 Generated filename:', filename)

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'bio')
    if (!existsSync(uploadDir)) {
      console.log('📁 Creating upload directory:', uploadDir)
      await mkdir(uploadDir, { recursive: true })
    }

    // Write the file
    const filepath = join(uploadDir, filename)
    console.log('💾 Writing file to:', filepath)
    await writeFile(filepath, buffer)

    // Return the public URL
    const url = `/uploads/bio/${filename}`
    console.log('✅ File uploaded successfully:', url)

    return NextResponse.json({ 
      success: true, 
      url: url,
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
