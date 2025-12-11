import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Membership level hierarchy
const LEVEL_HIERARCHY: Record<string, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
  LIFETIME: 4,
}

// GET /api/membership-documents/[id]/download - Download document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document
    const document = await prisma.membershipDocument.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.isActive) {
      return NextResponse.json({ error: 'Document is not active' }, { status: 403 })
    }

    // Get user's membership level
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        isActive: true,
      },
      include: {
        membership: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    // Determine user's effective level
    let userLevel = 'FREE'
    if (userMembership?.membership) {
      const duration = userMembership.membership.duration
      if (duration === 'LIFETIME') userLevel = 'LIFETIME'
      else if (duration === 'TWELVE_MONTHS') userLevel = 'PLATINUM'
      else if (duration === 'SIX_MONTHS') userLevel = 'GOLD'
      else if (duration === 'THREE_MONTHS') userLevel = 'SILVER'
    }

    const userLevelValue = LEVEL_HIERARCHY[userLevel] || 0
    const requiredLevelValue = LEVEL_HIERARCHY[document.minimumLevel] || 0

    // Check access permission
    if (userLevelValue < requiredLevelValue) {
      return NextResponse.json(
        {
          error: 'Insufficient membership level',
          required: document.minimumLevel,
          current: userLevel,
        },
        { status: 403 }
      )
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create download log
    try {
      await prisma.documentDownloadLog.create({
        data: {
          userId: session.user.id,
          documentId: document.id,
          membershipLevel: userLevel,
          ipAddress,
          userAgent,
          status: 'SUCCESS',
        },
      })

      // Increment download count
      await prisma.membershipDocument.update({
        where: { id: document.id },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      })
    } catch (error) {
      console.error('Error logging download:', error)
      // Continue with download even if logging fails
    }

    // Read file
    const filepath = join(process.cwd(), 'public', document.fileUrl)
    const fileBuffer = await readFile(filepath)

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', document.fileType)
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`)
    headers.set('Content-Length', document.fileSize.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error('Error downloading document:', error)

    // Log failed download attempt - note: session may not be available here
    // so we just log to console
    console.error('Failed download attempt for document:', params.id)

    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/membership-documents/[id]/view - Increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Increment view count
    await prisma.membershipDocument.update({
      where: { id: params.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
