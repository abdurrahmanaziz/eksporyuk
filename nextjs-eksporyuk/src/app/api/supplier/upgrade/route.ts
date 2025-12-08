import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { validatePaymentAmount } from '@/lib/payment-methods'

/**
 * POST /api/supplier/upgrade
 * Upgrade supplier membership to a higher tier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Get target package
    const targetPackage = await prisma.supplierPackage.findUnique({
      where: { id: packageId },
    })

    if (!targetPackage || !targetPackage.isActive) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      )
    }

    // Get current active membership
    const currentMembership = await prisma.supplierMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        package: true,
      },
    })

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'No active membership found' },
        { status: 400 }
      )
    }

    // Check if upgrade is valid
    const currentType = currentMembership.package.type
    const targetType = targetPackage.type

    const typeHierarchy = { FREE: 0, PREMIUM: 1, ENTERPRISE: 2 }
    
    if (typeHierarchy[targetType] <= typeHierarchy[currentType]) {
      return NextResponse.json(
        { error: 'You can only upgrade to a higher tier' },
        { status: 400 }
      )
    }

    // Check if it's the same package
    if (currentMembership.packageId === packageId) {
      return NextResponse.json(
        { error: 'You are already on this package' },
        { status: 400 }
      )
    }

    console.log('[SUPPLIER_UPGRADE] User:', session.user.id)
    console.log('[SUPPLIER_UPGRADE] Current package:', currentMembership.package.name)
    console.log('[SUPPLIER_UPGRADE] Target package:', targetPackage.name)

    // Calculate upgrade price with remaining days credit
    let upgradePrice = Number(targetPackage.price)
    let creditAmount = 0

    if (currentMembership.endDate && Number(currentMembership.package.price) > 0) {
      const now = new Date()
      const endDate = new Date(currentMembership.endDate)
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      if (daysRemaining > 0) {
        // Calculate daily rate of current package
        const currentDuration = currentMembership.package.duration
        const daysInDuration = currentDuration === 'MONTHLY' ? 30 : currentDuration === 'YEARLY' ? 365 : 0

        if (daysInDuration > 0) {
          const dailyRate = Number(currentMembership.package.price) / daysInDuration
          creditAmount = Math.round(dailyRate * daysRemaining)
          upgradePrice = Math.max(0, Number(targetPackage.price) - creditAmount)

          console.log('[SUPPLIER_UPGRADE] Days remaining:', daysRemaining)
          console.log('[SUPPLIER_UPGRADE] Credit amount:', creditAmount)
          console.log('[SUPPLIER_UPGRADE] Upgrade price:', upgradePrice)
        }
      }
    }

    // If upgrade price is 0 (e.g., enough credit), activate immediately
    if (upgradePrice === 0) {
      console.log('[SUPPLIER_UPGRADE] Free upgrade with credit, activating immediately')

      await prisma.$transaction(async (tx) => {
        // Deactivate current membership
        await tx.supplierMembership.update({
          where: { id: currentMembership.id },
          data: { isActive: false },
        })

        // Calculate new end date
        const startDate = new Date()
        let endDate: Date | null = null

        if (targetPackage.duration === 'MONTHLY') {
          endDate = new Date(startDate)
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (targetPackage.duration === 'YEARLY') {
          endDate = new Date(startDate)
          endDate.setFullYear(endDate.getFullYear() + 1)
        }
        // LIFETIME: endDate remains null

        // Create new membership
        await tx.supplierMembership.create({
          data: {
            userId: session.user.id,
            packageId: targetPackage.id,
            startDate,
            endDate,
            isActive: true,
            autoRenew: false,
            price: 0, // Paid with credit
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Membership upgraded successfully with credit',
        requiresPayment: false,
      })
    }

    // Create transaction and Xendit invoice for paid upgrade
    console.log('[SUPPLIER_UPGRADE] Creating transaction for paid upgrade')

    // Validate payment amount with settings
    if (upgradePrice > 0) {
      const amountValidation = await validatePaymentAmount(upgradePrice)
      if (!amountValidation.valid) {
        return NextResponse.json({ 
          error: amountValidation.error 
        }, { status: 400 })
      }
    }

    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: upgradePrice,
        type: 'SUPPLIER_MEMBERSHIP' as any,
        status: 'PENDING',
        invoiceNumber,
        description: `Supplier Upgrade: ${targetPackage.name}`,
        externalId: `SUPP-UPG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerName: session.user.name || '',
        customerEmail: session.user.email || '',
        customerPhone: '',
        customerWhatsapp: '',
        metadata: {
          upgradeFrom: currentMembership.packageId,
          upgradeTo: targetPackage.id,
          fromPackageName: currentMembership.package.name,
          toPackageName: targetPackage.name,
          originalPrice: targetPackage.price,
          creditAmount,
          upgradePrice,
        },
      },
    })

    console.log('[SUPPLIER_UPGRADE] Transaction created:', transaction.id)

    // Get payment settings from database
    const settings = await prisma.settings.findFirst()
    const expiryHours = settings?.paymentExpiryHours || 72
    console.log('[SUPPLIER_UPGRADE] Payment expiry hours:', expiryHours)

    // Create Xendit invoice
    try {
      const { xenditService } = await import('@/lib/xendit')
      console.log('[SUPPLIER_UPGRADE] Creating Xendit invoice...')

      const xenditResult = await xenditService.createInvoice({
        external_id: transaction.id,
        payer_email: session.user.email || '',
        description: `Upgrade to ${targetPackage.name}${creditAmount > 0 ? ` (Credit: Rp ${creditAmount.toLocaleString('id-ID')})` : ''}`,
        amount: Number(upgradePrice),
        currency: 'IDR',
        invoice_duration: expiryHours * 3600,
        customer: {
          given_names: session.user.name || '',
          email: session.user.email || '',
          mobile_number: '',
        },
      })

      console.log('[SUPPLIER_UPGRADE] Xendit result:', xenditResult?.id)

      if (xenditResult && xenditResult.id) {
        const invoiceUrl = (xenditResult as any).invoice_url || (xenditResult as any).invoiceUrl

        // Update transaction with Xendit reference
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditResult.id,
            paymentUrl: invoiceUrl,
          },
        })

        console.log('[SUPPLIER_UPGRADE] Payment URL:', invoiceUrl)

        return NextResponse.json({
          success: true,
          message: 'Please complete payment to upgrade',
          requiresPayment: true,
          paymentUrl: invoiceUrl,
          transactionId: transaction.id,
          packageName: targetPackage.name,
          upgradePrice,
          creditAmount,
          originalPrice: targetPackage.price,
        })
      } else {
        throw new Error('Xendit invoice creation returned invalid result')
      }
    } catch (xenditError: any) {
      console.error('[SUPPLIER_UPGRADE] Xendit error:', xenditError)

      // Cleanup transaction
      await prisma.transaction.delete({
        where: { id: transaction.id },
      })

      return NextResponse.json(
        { error: 'Payment setup failed: ' + xenditError.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error upgrading supplier membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
