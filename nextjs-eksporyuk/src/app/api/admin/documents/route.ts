import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

// Force dynamic
export const dynamic = 'force-dynamic'

const UPLOAD_DIR = 'public/documents'

// GET - List documents with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const visibility = searchParams.get('visibility')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (category) whereClause.category = category
    if (visibility) whereClause.visibility = visibility
    if (status === 'active') whereClause.active = true
    if (status === 'inactive') whereClause.active = false

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { uploadDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        visibility: true,
        uploadDate: true,
        views: true,
        downloads: true,
        active: true,
        fileType: true,
        fileSize: true
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[DOCUMENT LIST ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from storage
    try {
      const filepath = join(process.cwd(), 'public', document.fileName)
      await unlink(filepath)
    } catch (e) {
      console.error('File deletion error:', e)
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    // Delete logs
    await prisma.documentDownloadLog.deleteMany({
      where: { documentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DOCUMENT DELETE ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}

// PUT - Update document
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id, title, description, category, visibility, active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(visibility && { visibility }),
        ...(active !== undefined && { active })
      }
    })

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('[DOCUMENT UPDATE ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}
