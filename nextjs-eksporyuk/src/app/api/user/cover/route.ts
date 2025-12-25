import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('cover') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: 'covers',
      prefix: `cover-${user.id}`,
      maxSize: 10 * 1024 * 1024, // 10MB for cover images
    })

    // Update user cover image in database
    await prisma.user.update({
      where: { id: user.id },
      data: { coverImage: result.url }
    })

    return NextResponse.json({
      success: true,
      coverUrl: result.url,
      storage: result.storage
    })

  } catch (error) {
    console.error('Error uploading cover image:', error)
    return NextResponse.json(
      { error: 'Failed to upload cover image' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove cover image
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user to remove cover image
    await prisma.user.update({
      where: { id: user.id },
      data: { coverImage: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Cover image removed'
    })

  } catch (error) {
    console.error('Error removing cover image:', error)
    return NextResponse.json(
      { error: 'Failed to remove cover image' },
      { status: 500 }
    )
  }
}
