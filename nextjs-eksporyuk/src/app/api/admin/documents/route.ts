import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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
    const minimumLevel = searchParams.get('minimumLevel')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (category) whereClause.category = category
    if (minimumLevel) whereClause.minimumLevel = minimumLevel
    if (status === 'active') whereClause.isActive = true
    if (status === 'inactive') whereClause.isActive = false

    const documents = await prisma.membershipDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        minimumLevel: true,
        createdAt: true,
        viewCount: true,
        downloadCount: true,
        isActive: true,
        fileType: true,
        fileSize: true,
        fileName: true,
        fileUrl: true
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

    const document = await prisma.membershipDocument.findUnique({
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
    await prisma.membershipDocument.delete({
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

    const { id, title, description, category, minimumLevel, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const document = await prisma.membershipDocument.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(minimumLevel && { minimumLevel }),
        ...(isActive !== undefined && { isActive })
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
