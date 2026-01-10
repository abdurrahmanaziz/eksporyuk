import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[id]/resources - Get group resources
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // document, video, image, other

    // Get posts with attachments
    const posts = await prisma.post.findMany({
      where: {
        groupId: params.id,
        type: 'RESOURCE',
        ...(type && { content: { contains: type } })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ resources: posts })
  } catch (error) {
    console.error('Get resources error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/resources - Upload resource
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: params.id,
          userId: session.user.id
        }
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'You must be a member to upload resources' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File terlalu besar (maksimal 10MB)' },
        { status: 400 }
      )
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name}`
    const filepath = join(process.cwd(), 'public', 'uploads', 'resources', filename)
    
    await writeFile(filepath, buffer)

    // Create resource post
    const resource = await prisma.post.create({
      data: {
        groupId: params.id,
        authorId: session.user.id,
        type: 'RESOURCE',
        content: description || title,
        images: [`/uploads/resources/${filename}`],
        metadata: JSON.stringify({
          title,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Notify group members
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: params.id,
        userId: { not: session.user.id }
      },
      select: { userId: true }
    })

    await Promise.all(
      members.slice(0, 50).map(m =>
        prisma.notification.create({
          data: {
            userId: m.userId,
            type: 'RESOURCE_SHARED',
            title: 'Resource Baru',
            message: `${session.user.name} membagikan: ${title}`,
            link: `/community/groups/${params.id}`
          }
        })
      )
    )

    return NextResponse.json({ resource, message: 'Resource uploaded successfully' })
  } catch (error) {
    console.error('Upload resource error:', error)
    return NextResponse.json(
      { error: 'Failed to upload resource' },
      { status: 500 }
    )
  }
}
