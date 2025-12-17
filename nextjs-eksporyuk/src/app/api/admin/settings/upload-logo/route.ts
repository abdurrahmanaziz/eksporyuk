import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

// Check if Vercel Blob is configured
const isVercelBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'main' | 'affiliate' | 'favicon'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, SVG, WebP, and ICO are allowed.' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-${timestamp}.${fileExt}`

    let publicUrl: string

    // Use Vercel Blob in production, local storage in development
    if (isVercelBlobConfigured) {
      // Upload to Vercel Blob (cloud storage - persists in production!)
      const blob = await put(`branding/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      publicUrl = blob.url
      console.log('[Upload Logo] File uploaded to Vercel Blob:', {
        fileName,
        publicUrl
      })
    } else {
      // Fallback to local storage for development
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branding')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const filePath = path.join(uploadDir, fileName)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // For local dev
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      publicUrl = `${appUrl}/uploads/branding/${fileName}`
      console.log('[Upload Logo] File uploaded locally:', {
        fileName,
        publicUrl
      })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload logo' 
    }, { status: 500 })
  }
}
