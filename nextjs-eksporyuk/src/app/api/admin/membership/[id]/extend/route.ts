import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Extend membership duration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { days, reason } = body

    if (!days || days <= 0) {
      return NextResponse.json(
        { error: 'Invalid days value' },
        { status: 400 }
      )
    }

    // Check if membership exists
    const existingMembership = await prisma.userMembership.findUnique({
      where: { id }
    })

    if (!existingMembership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Fetch related data manually
    const [existingUser, existingMembershipPlan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: existingMembership.userId },
        select: { id: true, name: true, email: true }
      }),
      prisma.membership.findUnique({
        where: { id: existingMembership.membershipId },
        select: { id: true, name: true, duration: true }
      })
    ])

    // Calculate new end date
    const currentEndDate = new Date(existingMembership.endDate)
    const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000)

    // Update membership
    const updatedMembership = await prisma.userMembership.update({
      where: { id },
      data: {
        endDate: newEndDate,
        updatedAt: new Date()
      }
    })

    // Log the extension (optional - you can add an activity log model later)
    console.log(`Membership extended by ${days} days for user ${existingUser?.name || 'Unknown'} by admin ${session.user.name}`)

    // Send notification to user about membership extension
    await notificationService.send({
      userId: existingMembership.userId,
      type: 'MEMBERSHIP' as any,
      title: '🎉 Membership Anda Diperpanjang!',
      message: `Selamat! Membership ${existingMembershipPlan?.name || 'Anda'} telah diperpanjang ${days} hari. Berlaku hingga ${newEndDate.toLocaleDateString('id-ID')}.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      channels: ['pusher', 'onesignal', 'email'],
      metadata: {
        membershipId: existingMembership.membershipId,
        membershipName: existingMembershipPlan?.name,
        extensionDays: days,
        newEndDate: newEndDate.toISOString(),
        reason: reason || 'Extended by admin'
      }
    })

    return NextResponse.json({
      message: `Membership extended by ${days} days successfully`,
      userMembership: {
        ...updatedMembership,
        user: existingUser,
        membership: existingMembershipPlan
      },
      extension: {
        days,
        oldEndDate: currentEndDate,
        newEndDate,
        reason: reason || 'Extended by admin'
      }
    })

  } catch (error) {
    console.error('Error extending membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}