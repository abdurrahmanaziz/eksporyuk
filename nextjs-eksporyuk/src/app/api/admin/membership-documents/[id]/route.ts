import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/membership-documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await prisma.membershipDocument.findUnique({
      where: { id: params.id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        downloadLogs: {
          take: 10,
          orderBy: { downloadedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            downloadLogs: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/membership-documents/[id] - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, minimumLevel, isActive } = body

    const document = await prisma.membershipDocument.update({
      where: { id: params.id },
      data: {
        title,
        description,
        category,
        minimumLevel,
        isActive,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      document,
      message: 'Document updated successfully',
    })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/membership-documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get document to delete file
    const document = await prisma.membershipDocument.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', document.fileUrl)
      await unlink(filepath)
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continue even if file deletion fails
    }

    // Delete document record (cascade will delete download logs)
    await prisma.membershipDocument.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
