import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Force dynamic
export const dynamic = 'force-dynamic'

// Access level hierarchy
const MEMBERSHIP_LEVELS = {
  LIFETIME: 4,
  PLATINUM: 3,
  GOLD: 2,
  SILVER: 1,
  FREE: 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        title: true,
        visibility: true,
        active: true,
        views: true,
        downloads: true
      }
    })

    if (!document || !document.active) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check access based on membership level
    if (document.visibility !== 'LIFETIME') {
      const userMembership = await prisma.userMembership.findFirst({
        where: { userId: session.user.id, isActive: true },
        select: {
          membership: {
            select: { name: true }
          }
        }
      })

      let userLevel = MEMBERSHIP_LEVELS.FREE

      if (userMembership?.membership) {
        const membershipName = userMembership.membership.name.toUpperCase()
        if (membershipName.includes('LIFETIME')) userLevel = MEMBERSHIP_LEVELS.LIFETIME
        else if (membershipName.includes('PLATINUM')) userLevel = MEMBERSHIP_LEVELS.PLATINUM
        else if (membershipName.includes('GOLD')) userLevel = MEMBERSHIP_LEVELS.GOLD
        else if (membershipName.includes('SILVER')) userLevel = MEMBERSHIP_LEVELS.SILVER
      }

      const requiredLevel = MEMBERSHIP_LEVELS[document.visibility as keyof typeof MEMBERSHIP_LEVELS] || 0

      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { error: 'Insufficient membership level' },
          { status: 403 }
        )
      }
    }

    // Read file
    const filepath = join(process.cwd(), 'public', document.fileName)
    let fileContent: Buffer

    try {
      fileContent = await readFile(filepath)
    } catch (e) {
      console.error('File read error:', e)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Log download
    await Promise.all([
      prisma.documentDownloadLog.create({
        data: {
          documentId: id,
          userId: session.user.id,
          membershipLevel: document.visibility,
          downloadDate: new Date(),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          status: 'SUCCESS'
        }
      }),
      prisma.document.update({
        where: { id },
        data: {
          downloads: { increment: 1 },
          views: { increment: 1 }
        }
      })
    ])

    // Return file
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': document.fileType,
        'Content-Disposition': `attachment; filename="${document.title}${getFileExtension(document.fileType)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('[DOCUMENT DOWNLOAD ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/zip': '.zip'
  }
  return extensions[mimeType] || ''
}
