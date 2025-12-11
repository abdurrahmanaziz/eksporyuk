import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

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

    // Validate file size (10MB for cover images - larger than avatar)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `${user.id}-${timestamp}${ext}`
    const filepath = path.join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user cover image in database
    const coverUrl = `/uploads/covers/${filename}`
    await prisma.user.update({
      where: { id: user.id },
      data: { coverImage: coverUrl }
    })

    return NextResponse.json({
      success: true,
      coverUrl
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
