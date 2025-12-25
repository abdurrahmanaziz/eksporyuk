import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all automations for affiliate
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const automations = await prisma.affiliateAutomation.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ automations })
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new automation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { name, triggerType } = await request.json()

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'Name and trigger type are required' },
        { status: 400 }
      )
    }

    const validTriggers = ['AFTER_OPTIN', 'AFTER_ZOOM', 'PENDING_PAYMENT', 'WELCOME']
    if (!validTriggers.includes(triggerType)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
    }

    const automation = await prisma.affiliateAutomation.create({
      data: {
        affiliateId: affiliate.id,
        name,
        triggerType,
        isActive: false, // Start as inactive until steps are added
      },
      include: {
        steps: true,
      },
    })

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
