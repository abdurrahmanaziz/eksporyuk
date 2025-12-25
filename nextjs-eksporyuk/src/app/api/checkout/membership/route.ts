import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'
import { validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('[API Checkout] === START ===')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[API Checkout] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API Checkout] ✅ User authenticated:', session.user.email)

    // Verify user exists in database, create if not exists
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      console.log('[API Checkout] ⚠️ User not found in DB, creating new user:', session.user.id)
      try {
        dbUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name || '',
            image: session.user.image || null,
            emailVerified: null,
            role: 'CUSTOMER',
            whatsapp: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('[API Checkout] ✅ New user created:', dbUser.email)
      } catch (createError) {
        console.error('[API Checkout] ❌ Failed to create user:', createError)
        return NextResponse.json(
          { error: 'User creation failed', message: 'Gagal membuat akun. Silakan logout dan login kembali.' },
          { status: 400 }
        )
      }
    }

    console.log('[API Checkout] ✅ User verified in DB:', dbUser.email)

    const body = await request.json()
    console.log('[API Checkout] Request body:', JSON.stringify(body, null, 2))
    
    const { planId, priceOption, couponCode, finalPrice, name, email, phone, whatsapp } = body

    // Validate plan exists
    const plan = await prisma.membership.findUnique({
      where: { id: planId, isActive: true }
    })

    if (!plan) {
      console.log('[API Checkout] ❌ Plan not found:', planId)
      return NextResponse.json(
        { error: 'Invalid membership plan' },
        { status: 404 }
      )
    }

    console.log('[API Checkout] ✅ Plan found:', plan.name)

    // Check if user already has active membership
    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { 
          error: 'You already have an active membership',
          message: 'Silakan upgrade atau tunggu membership Anda berakhir'
        },
        { status: 400 }
      )
    }

    // Validate and apply coupon if provided
    let discount = 0
    let affiliateId = null
    let coupon = null

    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      })

      if (coupon) {
        // Check usage limit
        const usageCount = await prisma.transaction.count({
          where: { couponId: coupon.id }
        })

        if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
          return NextResponse.json(
            { error: 'Coupon usage limit exceeded' },
            { status: 400 }
          )
        }

        // Calculate discount
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (priceOption.price * coupon.discountValue) / 100
        } else {
          discount = coupon.discountValue
        }

        affiliateId = coupon.createdBy || null
      }
    }

    // Calculate final amount
    const amount = Math.max(finalPrice || (priceOption.price - discount), 0)

    // Validate payment amount with settings
    if (amount > 0) {
      const amountValidation = await validatePaymentAmount(amount)
      if (!amountValidation.valid) {
        return NextResponse.json({ 
          error: amountValidation.error 
        }, { status: 400 })
      }
    }

    // Create external ID for Xendit
    const externalId = `MEMBERSHIP-${session.user.id}-${Date.now()}`

    console.log('[Checkout] Creating transaction with data:', {
      userId: session.user.id,
      type: 'MEMBERSHIP',
      amount,
      couponId: coupon?.id || null,
      affiliateId: affiliateId,
      planId
    })

    // Generate invoice number using centralized invoice generator
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Map membership duration to human-readable type
    const membershipTypeMap: Record<string, string> = {
      'ONE_MONTH': '1 Bulan',
      'THREE_MONTHS': '3 Bulan',
      'SIX_MONTHS': '6 Bulan',
      'TWELVE_MONTHS': '12 Bulan',
      'LIFETIME': 'Lifetime'
    }
    const membershipType = membershipTypeMap[plan.duration] || plan.duration

    // Get payment expiry hours from settings (default 72 hours = 3 days)
    const settings = await prisma.settings.findFirst()
    const expiryHours = settings?.paymentExpiryHours || 72

    // Create transaction record - IMPORTANT: Don't include null foreign keys
    const transactionData: any = {
      invoiceNumber: invoiceNumber,
      userId: session.user.id,
      type: 'MEMBERSHIP',
      status: 'PENDING',
      amount: amount,
      description: `Membership: ${plan.name}`,
      externalId: externalId,
      paymentProvider: 'XENDIT',
      customerName: name || session.user.name || '',
      customerEmail: email || session.user.email || '',
      customerPhone: phone || '',
      customerWhatsapp: whatsapp || phone || '',
      metadata: JSON.stringify({
        priceOption: priceOption,
        membershipId: planId,
        membershipType: membershipType,
        membershipDuration: plan.duration,
        originalAmount: priceOption.price,
        discountAmount: discount,
        expiryHours: expiryHours
      })
    }

    // Only add optional amounts if they exist
    if (priceOption.price) transactionData.originalAmount = priceOption.price
    if (discount > 0) transactionData.discountAmount = discount

    // Only add foreign keys if they have values
    if (coupon?.id) transactionData.couponId = coupon.id
    if (affiliateId) transactionData.affiliateId = affiliateId

    const transaction = await prisma.transaction.create({
      data: transactionData
    })

    console.log('[Checkout] Transaction created:', transaction.id)

    // Update user profile if needed
    const updateData: any = {}
    if (whatsapp && !session.user.whatsapp) {
      updateData.whatsapp = whatsapp
    }
    if (name && name !== session.user.name) {
      updateData.name = name
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: updateData
        })
        console.log('[Checkout] Updated user profile:', updateData)
      } catch (error) {
        console.error('[Checkout] Failed to update user profile:', error)
        // Don't block checkout if profile update fails
      }
    }

    // Generate Xendit invoice
    let paymentUrl = ''
    let xenditSuccess = false
    
    try {
      const invoiceResult = await xenditService.createInvoice({
        externalId: externalId,
        payerEmail: email || session.user.email || '',
        description: `Membership: ${plan.name} - ${priceOption.label}`,
        amount: amount,
        currency: 'IDR',
        invoiceDuration: expiryHours * 3600, // Convert hours to seconds
        successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?transaction_id=${transaction.id}`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failed?transaction_id=${transaction.id}`,
        customerName: name || session.user.name || '',
        customerEmail: email || session.user.email || '',
        customerPhone: whatsapp || phone || '',
        items: [{
          name: `${plan.name} - ${priceOption.label}`,
          quantity: 1,
          price: amount,
          category: 'Membership'
        }]
      })

      if (invoiceResult.success && invoiceResult.data) {
        paymentUrl = invoiceResult.data.invoiceUrl
        xenditSuccess = true
        
        // Update transaction with Xendit invoice URL
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paymentUrl: paymentUrl,
            reference: invoiceResult.data.id,
            expiredAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
          }
        })
      } else {
        console.error('Failed to create Xendit invoice:', invoiceResult.error)
      }
    } catch (xenditError) {
      console.error('Xendit integration error:', xenditError)
    }

    // If Xendit failed, return error
    if (!xenditSuccess || !paymentUrl) {
      console.error('[Checkout] ❌ Payment URL not generated')
      return NextResponse.json(
        { 
          success: false,
          error: 'Gagal membuat link pembayaran',
          message: 'Terjadi kesalahan saat membuat invoice pembayaran. Silakan coba lagi atau hubungi admin.'
        },
        { status: 500 }
      )
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CHECKOUT_MEMBERSHIP',
        entity: 'TRANSACTION',
        entityId: transaction.id,
        metadata: JSON.stringify({
          planId: planId,
          amount: amount,
          priceOption: priceOption.label
        })
      }
    })

    console.log('[API Checkout] ✅ Transaction created:', transaction.id)
    console.log('[API Checkout] Payment URL:', paymentUrl)
    console.log('[API Checkout] === END ===')

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: amount
    })

  } catch (error) {
    console.error('[API Checkout] ❌ ERROR:', error)
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      console.error('[API Checkout] Prisma Error Code:', prismaError.code)
      console.error('[API Checkout] Prisma Error Meta:', prismaError.meta)
      
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { 
            error: 'Database constraint error',
            message: 'Ada masalah dengan data. Silakan logout dan login kembali, atau hubungi admin.',
            details: prismaError.meta
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process checkout', message: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
