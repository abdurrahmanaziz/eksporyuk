import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'
import { generateTransactionId, getCurrentTimestamp } from '@/lib/transaction-helper'
import { validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('[API Checkout Product] === START ===')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[API Checkout Product] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API Checkout Product] ✅ User authenticated:', session.user.email)

    // Verify user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      console.log('[API Checkout Product] ⚠️ User not found in DB, creating new user:', session.user.id)
      try {
        dbUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name || '',
            avatar: (session.user as any).avatar || session.user.avatar || null,
            emailVerified: null,
            whatsapp: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('[API Checkout Product] ✅ New user created:', dbUser.email)
      } catch (createError) {
        console.error('[API Checkout Product] ❌ Failed to create user:', createError)
        return NextResponse.json(
          { error: 'User creation failed', message: 'Gagal membuat akun. Silakan logout dan login kembali.' },
          { status: 400 }
        )
      }
    }

    console.log('[API Checkout Product] ✅ User verified in DB:', dbUser.email)

    const body = await request.json()
    console.log('[API Checkout Product] Request body:', JSON.stringify(body, null, 2))
    
    const { productId, couponCode, finalPrice, name, email, phone, whatsapp, paymentMethod, paymentChannel } = body

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true }
    })

    if (!product) {
      console.log('[API Checkout Product] ❌ Product not found:', productId)
      return NextResponse.json(
        { error: 'Invalid product' },
        { status: 404 }
      )
    }

    console.log('[API Checkout Product] ✅ Product found:', product.name)

    // Check event quota (if this is an event product)
    if (product.productType === 'EVENT' && product.maxParticipants) {
      // Count ONLY SUCCESS (paid) transactions for quota
      const paidParticipantCount = await prisma.transaction.count({
        where: {
          productId: product.id,
          status: 'SUCCESS'
        }
      })

      // Also count pending for logging
      const pendingCount = await prisma.transaction.count({
        where: {
          productId: product.id,
          status: 'PENDING_CONFIRMATION'
        }
      })

      const percentFull = (paidParticipantCount / product.maxParticipants) * 100
      const remaining = product.maxParticipants - paidParticipantCount

      console.log('[API Checkout Product] Event quota check:', {
        maxParticipants: product.maxParticipants,
        paidCount: paidParticipantCount,
        pendingCount: pendingCount,
        remaining: remaining,
        percentFull: percentFull.toFixed(1) + '%',
        note: 'Only SUCCESS transactions count toward quota'
      })

      // QUOTA FULL - REJECT
      if (paidParticipantCount >= product.maxParticipants) {
        console.log('[API Checkout Product] ❌ Event quota FULL:', product.name)
        
        // Send admin notification about full quota
        try {
          const creator = await prisma.user.findUnique({
            where: { id: product.creatorId },
            select: { email: true, whatsapp: true, name: true }
          })
          
          if (creator?.email) {
            // Log notification (real integration would use notificationService)
            console.log('[API Checkout Product] 🔔 QUOTA FULL ALERT:', {
              event: product.name,
              adminEmail: creator.email,
              paidRegistrations: `${paidParticipantCount}/${product.maxParticipants}`,
              pendingRegistrations: pendingCount,
              action: 'Admin should increase maxParticipants or close registrations'
            })
          }
        } catch (notifError) {
          console.error('[API Checkout Product] Notification error:', notifError)
        }
        
        return NextResponse.json(
          {
            error: 'Event quota full',
            message: `Kuota event "${product.name}" sudah penuh. Total peserta (BAYAR): ${paidParticipantCount}/${product.maxParticipants}`
          },
          { status: 400 }
        )
      }

      // WARNING: Quota almost full (80%)
      if (percentFull >= 80 && percentFull < 100) {
        console.log('[API Checkout Product] ⚠️ Event quota ALMOST FULL (80%+):', product.name)
        
        // Send admin warning notification
        try {
          const creator = await prisma.user.findUnique({
            where: { id: product.creatorId },
            select: { email: true, whatsapp: true, name: true }
          })
          
          if (creator?.email) {
            console.log('[API Checkout Product] 🟡 QUOTA WARNING ALERT:', {
              event: product.name,
              adminEmail: creator.email,
              paidRegistrations: `${paidParticipantCount}/${product.maxParticipants}`,
              pendingRegistrations: pendingCount,
              percentFull: percentFull.toFixed(1) + '%',
              remaining: remaining,
              action: 'Consider increasing maxParticipants soon'
            })
          }
        } catch (notifError) {
          console.error('[API Checkout Product] Warning notification error:', notifError)
        }
      }
    }

    // Check if user already purchased this product
    const existingPurchase = await prisma.userProduct.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { 
          error: 'Product already purchased',
          message: 'Anda sudah membeli produk ini'
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
          isActive: true
        }
      })

      if (!coupon) {
        return NextResponse.json(
          { error: 'Invalid or expired coupon code' },
          { status: 400 }
        )
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'Coupon usage limit reached' },
          { status: 400 }
        )
      }

      // Apply discount
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.round((Number(product.price) * Number(coupon.discountValue)) / 100)
      } else {
        discount = Number(coupon.discountValue)
      }

      // Get affiliate from coupon
      if (coupon.affiliateId) {
        affiliateId = coupon.affiliateId
      }

      console.log('[API Checkout Product] ✅ Coupon applied:', {
        code: coupon.code,
        discount,
        affiliateId
      })
    }

    // Check for affiliate cookie (if no coupon)
    if (!affiliateId) {
      const affiliateCookie = request.cookies.get('affiliate_ref')
      if (affiliateCookie) {
        try {
          const cookieData = JSON.parse(affiliateCookie.value)
          affiliateId = cookieData.userId
          console.log('[API Checkout Product] ✅ Affiliate from cookie:', affiliateId)
        } catch (e) {
          console.error('[API Checkout Product] Failed to parse affiliate cookie:', e)
        }
      }
    }

    // Calculate final amount
    const amount = Math.max(0, finalPrice || (Number(product.price) - discount))
    
    // Validate payment amount with settings
    if (amount > 0) {
      const amountValidation = await validatePaymentAmount(amount)
      if (!amountValidation.valid) {
        return NextResponse.json({ 
          error: amountValidation.error 
        }, { status: 400 })
      }
    }
    
    // Generate unique transaction ID
    const externalId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const expiryHours = 24

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    console.log('[API Checkout Product] Invoice number:', invoiceNumber)

    // Calculate commission
    let commissionAmount = 0
    if (affiliateId) {
      if (product.commissionType === 'PERCENTAGE') {
        commissionAmount = Math.round((amount * Number(product.affiliateCommissionRate)) / 100)
      } else {
        commissionAmount = Number(product.affiliateCommissionRate)
      }
    }

    // Create transaction record - IMPORTANT: Don't include null foreign keys
    const transactionData: any = {
      invoiceNumber: invoiceNumber,
      externalId: externalId,
      userId: session.user.id,
      type: 'PRODUCT',
      status: 'PENDING',
      amount: amount,
      description: `Product: ${product.name}`,
      paymentProvider: 'XENDIT',
      customerName: name || session.user.name || '',
      customerEmail: email || session.user.email || '',
      customerPhone: phone || '',
      customerWhatsapp: whatsapp || phone || '',
      metadata: JSON.stringify({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        originalAmount: product.price,
        discountAmount: discount,
        couponCode: couponCode || null,
        affiliateId: affiliateId || null,
        paymentMethod: paymentMethod || 'bank_transfer',
        paymentChannel: paymentChannel || 'BCA',
        expiryHours: expiryHours
      })
    }

    // Only add productId if product exists
    if (product?.id) transactionData.productId = product.id

    // Only add optional amounts if they exist
    if (product.price) transactionData.originalAmount = product.price
    if (discount > 0) transactionData.discountAmount = discount

    // Only add foreign keys if they have values
    if (coupon?.id) transactionData.couponId = coupon.id
    if (affiliateId) transactionData.affiliateId = affiliateId

    const transaction = await prisma.transaction.create({
      data: transactionData
    })

    console.log('[API Checkout Product] ✅ Transaction created:', transaction.id)

    // Update coupon usage
    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } }
      })
    }

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
        console.log('[API Checkout Product] ✅ Updated user profile:', updateData)
      } catch (error) {
        console.error('[API Checkout Product] Failed to update user profile:', error)
      }
    }

    // Generate Xendit invoice
    let paymentUrl = ''
    let xenditSuccess = false
    
    try {
      const invoiceResult = await xenditService.createInvoice({
        external_id: externalId,
        payer_email: email || session.user.email || '',
        description: `Product: ${product.name}`,
        amount: amount,
        currency: 'IDR',
        invoice_duration: expiryHours * 3600, // Convert hours to seconds
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?transaction_id=${transaction.id}`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failed?transaction_id=${transaction.id}`,
        customer: {
          given_names: name || session.user.name || '',
          email: email || session.user.email || '',
          mobile_number: whatsapp || phone || ''
        }
      })

      if (invoiceResult && invoiceResult.invoice_url) {
        paymentUrl = invoiceResult.invoice_url
        xenditSuccess = true
        
        // Update transaction with Xendit invoice URL
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paymentUrl: paymentUrl,
            reference: invoiceResult.id,
            expiredAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
          }
        })
        console.log('[API Checkout Product] ✅ Xendit invoice created')
      } else {
        console.error('[API Checkout Product] Failed to create Xendit invoice: no invoice_url returned')
      }
    } catch (xenditError) {
      console.error('[API Checkout Product] Xendit integration error:', xenditError)
    }

    // If Xendit failed, return error
    if (!xenditSuccess || !paymentUrl) {
      console.error('[API Checkout Product] ❌ Payment URL not generated')
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
        action: 'CHECKOUT_PRODUCT',
        entity: 'TRANSACTION',
        entityId: transaction.id,
        metadata: JSON.stringify({
          productId: product.id,
          amount: amount
        })
      }
    })

    console.log('[API Checkout Product] ✅ Payment URL:', paymentUrl)
    console.log('[API Checkout Product] === END ===')

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: amount
    })

  } catch (error) {
    console.error('[API Checkout Product] ❌ ERROR:', error)
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      console.error('[API Checkout Product] Prisma Error Code:', prismaError.code)
      console.error('[API Checkout Product] Prisma Error Meta:', prismaError.meta)
      
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
      { 
        error: 'Internal server error',
        message: 'Terjadi kesalahan saat memproses checkout'
      },
      { status: 500 }
    )
  }
}
