import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetPackageId, affiliateCode, couponCode } = await request.json()

    if (!targetPackageId) {
      return NextResponse.json({ error: 'Target package ID required' }, { status: 400 })
    }

    // Get current active membership
    const currentMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        membership: true
      },
      orderBy: {
        endDate: 'desc'
      }
    })

    // Get target package
    const targetPackage = await prisma.membership.findUnique({
      where: { id: targetPackageId }
    })

    if (!targetPackage) {
      return NextResponse.json({ error: 'Target package not found' }, { status: 404 })
    }

    // Check if current is LIFETIME
    if (currentMembership?.membership.durationType === 'LIFETIME') {
      return NextResponse.json({ 
        error: 'Paket Lifetime tidak dapat diupgrade' 
      }, { status: 400 })
    }

    // Calculate upgrade price
    let upgradePrice = Number(targetPackage.price)
    let discount = 0
    let isLifetimeUpgrade = targetPackage.durationType === 'LIFETIME'

    if (currentMembership && !isLifetimeUpgrade) {
      const now = new Date()
      const endDate = new Date(currentMembership.endDate)
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      const currentPackage = currentMembership.membership
      const currentTotalDays = currentPackage.durationType === 'YEAR' 
        ? currentPackage.duration * 365
        : currentPackage.durationType === 'MONTH'
          ? currentPackage.duration * 30
          : currentPackage.duration

      const currentPrice = Number(currentMembership.price || currentPackage.price)
      const remainingValue = (currentPrice / currentTotalDays) * remainingDays

      upgradePrice = Math.max(0, Number(targetPackage.price) - remainingValue)
      discount = remainingValue
    }

    // Create transaction for upgrade
    const transactionId = `UPG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const transaction = await prisma.transaction.create({
      data: {
        id: transactionId,
        userId: session.user.id,
        type: 'MEMBERSHIP',
        membershipId: targetPackage.id,
        amount: Math.round(upgradePrice),
        status: 'PENDING',
        paymentMethod: 'PENDING',
        metadata: {
          isUpgrade: true,
          previousMembershipId: currentMembership?.membershipId,
          discountFromProrata: Math.round(discount),
          isLifetimeUpgrade
        }
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status
      },
      checkoutUrl: `/checkout/membership/${targetPackage.slug || targetPackage.id}?transaction=${transaction.id}&upgrade=true`
    })

  } catch (error) {
    console.error('[Process Upgrade Error]:', error)
    return NextResponse.json({ 
      error: 'Failed to process upgrade',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
