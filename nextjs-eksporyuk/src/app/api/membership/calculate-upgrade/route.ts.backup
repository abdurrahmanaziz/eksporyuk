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
          durationType: targetPackage.durationType,
          duration: targetPackage.duration
        },
        upgradePrice: targetPackage.price,
        discount: 0,
        remainingValue: 0,
        message: 'Pembelian paket baru'
      })
    }

    const currentPackage = currentMembership.membership

    // Check if already same or higher package
    if (currentPackage.id === targetPackage.id) {
      return NextResponse.json({ 
        canUpgrade: false, 
        error: 'Anda sudah memiliki paket ini' 
      }, { status: 400 })
    }

    // Check if current is LIFETIME
    if (currentPackage.durationType === 'LIFETIME') {
      return NextResponse.json({ 
        canUpgrade: false, 
        error: 'Paket Lifetime tidak dapat diupgrade' 
      }, { status: 400 })
    }

    // Calculate remaining days
    const now = new Date()
    const endDate = new Date(currentMembership.endDate)
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Calculate total days of current package
    const currentTotalDays = currentPackage.durationType === 'LIFETIME' 
      ? 36500 // 100 years for lifetime
      : currentPackage.durationType === 'YEAR' 
        ? currentPackage.duration * 365
        : currentPackage.durationType === 'MONTH'
          ? currentPackage.duration * 30
          : currentPackage.duration

    // Calculate remaining value (prorata)
    const currentPrice = Number(currentMembership.price || currentPackage.price)
    const remainingValue = (currentPrice / currentTotalDays) * remainingDays

    // IMPORTANT: If target is LIFETIME, NO DISCOUNT/PRORATA
    let upgradePrice: number
    let discount: number
    let isLifetimeUpgrade = false

    if (targetPackage.durationType === 'LIFETIME') {
      // LIFETIME upgrade = full price, no discount
      upgradePrice = Number(targetPackage.price)
      discount = 0
      isLifetimeUpgrade = true
    } else {
      // Non-lifetime upgrade = apply prorata discount
      upgradePrice = Math.max(0, Number(targetPackage.price) - remainingValue)
      discount = remainingValue
    }

    return NextResponse.json({
      canUpgrade: true,
      isNewPurchase: false,
      isLifetimeUpgrade,
      currentPackage: {
        id: currentPackage.id,
        name: currentPackage.name,
        price: currentPrice,
        durationType: currentPackage.durationType,
        duration: currentPackage.duration,
        endDate: currentMembership.endDate,
        remainingDays
      },
      targetPackage: {
        id: targetPackage.id,
        name: targetPackage.name,
        price: Number(targetPackage.price),
        durationType: targetPackage.durationType,
        duration: targetPackage.duration
      },
      upgradePrice: Math.round(upgradePrice),
      discount: Math.round(discount),
      remainingValue: Math.round(remainingValue),
      remainingDays,
      message: isLifetimeUpgrade 
        ? 'Upgrade ke Lifetime selalu harga penuh, sisa masa aktif tidak dihitung'
        : `Hemat Rp ${Math.round(remainingValue).toLocaleString('id-ID')} dari sisa ${remainingDays} hari paket aktif`
    })

  } catch (error) {
    console.error('[Calculate Upgrade Error]:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate upgrade price',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
