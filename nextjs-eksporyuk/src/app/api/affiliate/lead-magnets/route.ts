import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate/lead-magnets
 * Get all active lead magnets for affiliate selection
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get only active lead magnets
    const leadMagnets = await prisma.leadMagnet.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        thumbnailUrl: true,
        _count: {
          select: { optinForms: true }
        }
      }
    })

    return NextResponse.json({ leadMagnets })
  } catch (error) {
    console.error('[AFFILIATE] Error fetching lead magnets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead magnets' },
      { status: 500 }
    )
  }
}
