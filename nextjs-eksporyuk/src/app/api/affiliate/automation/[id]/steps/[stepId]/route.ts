import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PATCH - Update step
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
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

    const { id: automationId, stepId } = params
    const { stepOrder, delayHours, emailSubject, emailBody, isActive } = await request.json()

    // Verify step exists and automation ownership
    const step = await prisma.affiliateAutomationStep.findFirst({
      where: {
        id: stepId,
        automationId,
        automation: {
          affiliateId: affiliate.id,
        },
      },
    })

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (stepOrder !== undefined) updateData.stepOrder = stepOrder
    if (delayHours !== undefined) updateData.delayHours = delayHours
    if (emailSubject !== undefined) updateData.emailSubject = emailSubject
    if (emailBody !== undefined) updateData.emailBody = emailBody
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedStep = await prisma.affiliateAutomationStep.update({
      where: { id: stepId },
      data: updateData,
    })

    return NextResponse.json({ step: updatedStep })
  } catch (error) {
    console.error('Error updating step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove step
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
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

    const { id: automationId, stepId } = params

    // Verify step exists and automation ownership
    const step = await prisma.affiliateAutomationStep.findFirst({
      where: {
        id: stepId,
        automationId,
        automation: {
          affiliateId: affiliate.id,
        },
      },
    })

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    await prisma.affiliateAutomationStep.delete({
      where: { id: stepId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
