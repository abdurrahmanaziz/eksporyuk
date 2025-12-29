import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    const channelCode = formData.get('channelCode') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!channelCode) {
      return NextResponse.json(
        { error: 'Channel code is required' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: 'payment-logos',
      prefix: channelCode,
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    })

    return NextResponse.json({
      success: true,
      logoUrl: result.url,
      storage: result.storage
    })
  } catch (error) {
    console.error('Upload payment logo error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}
