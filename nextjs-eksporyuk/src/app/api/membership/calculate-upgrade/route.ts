import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'

// Helper function to convert MembershipDuration enum to days
function getDurationInDays(duration: string): number {
  switch (duration) {
    case 'ONE_MONTH': return 30
    case 'THREE_MONTHS': return 90
    case 'SIX_MONTHS': return 180
    case 'TWELVE_MONTHS': return 365
    case 'LIFETIME': return 0
    default: return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetPackageId } = await request.json()

    console.log('[Calculate Upgrade] User:', session.user.id, 'Target Package:', targetPackageId)

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
      orderBy: {
        endDate: 'desc'
      }
    })

    // Get target package
    const targetPackage = await prisma.membership.findUnique({
      where: { id: targetPackageId }
    })

    console.log('[Calculate Upgrade] Target package found:', !!targetPackage)

    if (!targetPackage) {
      return NextResponse.json({ error: 'Target package not found' }, { status: 404 })
    }

    // If no current membership, return full price
    if (!currentMembership) {
      return NextResponse.json({
        canUpgrade: true,
        isNewPurchase: true,
        targetPackage: {
          id: targetPackage.id,
          name: targetPackage.name,
          price: targetPackage.price,
          duration: targetPackage.duration
        },
        upgradePrice: targetPackage.price,
        discount: 0,
        remainingValue: 0,
        message: 'Pembelian paket baru'
      })
    }

    // Get current package details
    const currentPackage = await prisma.membership.findUnique({
      where: { id: currentMembership.membershipId }
    })

    if (!currentPackage) {
      return NextResponse.json({ error: 'Current package not found' }, { status: 404 })
    }

    // Check if already same package
    if (currentPackage.id === targetPackage.id) {
      return NextResponse.json({ 
        canUpgrade: false, 
        error: 'Anda sudah memiliki paket ini' 
      }, { status: 400 })
    }

    // Check if current is LIFETIME
    if (currentPackage.duration === 'LIFETIME') {
      return NextResponse.json({ 
        canUpgrade: false, 
        error: 'Paket Lifetime tidak dapat diupgrade' 
      }, { status: 400 })
    }

    // Calculate remaining days
    const now = new Date()
    const endDate = new Date(currentMembership.endDate)
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (remainingDays <= 0) {
      return NextResponse.json({
        canUpgrade: false,
        error: 'Membership sudah expired'
      }, { status: 400 })
    }

    const currentTotalDays = getDurationInDays(currentPackage.duration)
    const currentPrice = Number(currentPackage.price)
    const targetPrice = Number(targetPackage.price)

    console.log('[Calculate Upgrade] Prices - Current:', currentPrice, 'Target:', targetPrice)
    console.log('[Calculate Upgrade] Days - Total:', currentTotalDays, 'Remaining:', remainingDays)

    // Calculate prorata value
    const remainingValue = currentTotalDays > 0 
      ? (currentPrice / currentTotalDays) * remainingDays 
      : 0

    // Check if upgrade to LIFETIME
    const isLifetimeUpgrade = targetPackage.duration === 'LIFETIME'
    
    // If upgrading to LIFETIME, no discount
    const upgradePrice = isLifetimeUpgrade 
      ? targetPrice 
      : Math.max(0, targetPrice - remainingValue)
    
    const discount = isLifetimeUpgrade ? 0 : remainingValue

    console.log('[Calculate Upgrade] Current:', currentPackage.name, 'Target:', targetPackage.name)
    console.log('[Calculate Upgrade] Remaining days:', remainingDays, 'Value:', remainingValue)
    console.log('[Calculate Upgrade] Upgrade price:', upgradePrice)

    return NextResponse.json({
      canUpgrade: true,
      isNewPurchase: false,
      isLifetimeUpgrade,
      currentPackage: {
        id: currentPackage.id,
        name: currentPackage.name,
        price: currentPrice,
        duration: currentPackage.duration,
        endDate: currentMembership.endDate.toISOString(),
        remainingDays
      },
      targetPackage: {
        id: targetPackage.id,
        name: targetPackage.name,
        price: targetPrice,
        duration: targetPackage.duration
      },
      upgradePrice,
      discount,
      remainingValue,
      remainingDays,
      message: isLifetimeUpgrade 
        ? 'Upgrade ke Lifetime selalu harga penuh, sisa masa aktif tidak dihitung'
        : `Hemat Rp ${Math.round(remainingValue).toLocaleString('id-ID')} dari sisa ${remainingDays} hari paket aktif`
    })

  } catch (error) {
    console.error('[Calculate Upgrade Error]:', error)
    console.error('[Calculate Upgrade Error Stack]:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to calculate upgrade price',
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}
