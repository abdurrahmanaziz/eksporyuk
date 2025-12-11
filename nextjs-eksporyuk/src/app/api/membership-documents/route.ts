import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

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

// GET /api/membership-documents - List documents for member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Get user's active membership level
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

    // Build where clause - only show documents user has access to
    const where: any = {
      isActive: true,
    }

    // Filter by accessible documents
    const accessibleLevels = Object.keys(LEVEL_HIERARCHY).filter(
      (level) => LEVEL_HIERARCHY[level] <= userLevelValue
    )
    where.minimumLevel = { in: accessibleLevels }

    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const documents = await prisma.membershipDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        minimumLevel: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        viewCount: true,
        downloadCount: true,
        createdAt: true,
      },
    })

    // Get user's download history for these documents
    const documentIds = documents.map((d) => d.id)
    const userDownloads = await prisma.documentDownloadLog.findMany({
      where: {
        userId: session.user.id,
        documentId: { in: documentIds },
      },
      select: {
        documentId: true,
        downloadedAt: true,
      },
      orderBy: {
        downloadedAt: 'desc',
      },
    })

    const downloadMap = new Map(userDownloads.map((d) => [d.documentId, d.downloadedAt]))

    // Add download status to documents
    const documentsWithStatus = documents.map((doc) => ({
      ...doc,
      hasDownloaded: downloadMap.has(doc.id),
      lastDownloadedAt: downloadMap.get(doc.id) || null,
    }))

    return NextResponse.json({
      documents: documentsWithStatus,
      userLevel,
      membership: userMembership
        ? {
            name: userMembership.membership.name,
            duration: userMembership.membership.duration,
            endDate: userMembership.endDate,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
