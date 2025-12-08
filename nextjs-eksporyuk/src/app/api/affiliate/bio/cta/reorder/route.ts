import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/affiliate/bio/cta/reorder
 * Reorder CTA buttons via drag & drop
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { buttonIds } = await req.json()

    if (!buttonIds || !Array.isArray(buttonIds)) {
      return NextResponse.json(
        { error: 'buttonIds array is required' },
        { status: 400 }
      )
    }

    // Get affiliate profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        affiliateProfile: {
          include: { bioPage: true }
        }
      }
    })

    if (!user?.affiliateProfile?.bioPage) {
      return NextResponse.json({ error: 'Bio page not found' }, { status: 404 })
    }

    // Update display order for each button
    const updatePromises = buttonIds.map((buttonId, index) =>
      prisma.affiliateBioCTA.updateMany({
        where: {
          id: buttonId,
          bioPageId: user.affiliateProfile!.bioPage!.id
        },
        data: {
          displayOrder: index + 1
        }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'CTA buttons reordered successfully'
    })
  } catch (error) {
    console.error('Error reordering CTA buttons:', error)
    return NextResponse.json(
      { error: 'Failed to reorder CTA buttons' },
      { status: 500 }
    )
  }
}
