import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Check if Vercel Blob is configured
const isVercelBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type: string = data.get('type') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${type}_${timestamp}.${extension}`

    let url: string

    // Use Vercel Blob in production, local storage in development
    if (isVercelBlobConfigured) {
      // Upload to Vercel Blob (cloud storage)
      const blob = await put(`uploads/${filename}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      url = blob.url
      console.log('[Admin Upload] File uploaded to Vercel Blob:', { filename, url })
    } else {
      // Fallback to local storage for development
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      // For local dev, use localhost URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      url = `${appUrl}/uploads/${filename}`
      console.log('[Admin Upload] File uploaded locally:', { filename, url })
    }

    return NextResponse.json({ 
      success: true, 
      url: url,
      message: 'File uploaded successfully' 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Gagal upload file' }, { status: 500 })
  }
}