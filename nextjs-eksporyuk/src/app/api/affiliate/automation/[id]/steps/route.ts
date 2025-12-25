import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Add step to automation
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id: automationId } = params
    const { stepOrder, delayHours, emailSubject, emailBody } = await request.json()

    // Verify automation ownership
    const automation = await prisma.affiliateAutomation.findFirst({
      where: {
        id: automationId,
        affiliateId: affiliate.id,
      },
    })

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if (!emailSubject || !emailBody) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    const step = await prisma.affiliateAutomationStep.create({
      data: {
        automationId,
        stepOrder: stepOrder || 1,
        delayHours: delayHours || 0,
        emailSubject,
        emailBody,
        isActive: true,
      },
    })

    return NextResponse.json({ step })
  } catch (error) {
    console.error('Error creating step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
