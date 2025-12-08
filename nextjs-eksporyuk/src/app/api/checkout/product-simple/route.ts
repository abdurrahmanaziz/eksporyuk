import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

// Helper: Get full payment channel name
function getPaymentChannelName(code: string): string {
  const names: Record<string, string> = {
    'BCA': 'Bank Central Asia (BCA)',
    'MANDIRI': 'Bank Mandiri',
    'BNI': 'Bank Negara Indonesia (BNI)',
    'BRI': 'Bank Rakyat Indonesia (BRI)',
    'BSI': 'Bank Syariah Indonesia (BSI)',
    'CIMB': 'CIMB Niaga',
    'PERMATA': 'Bank Permata',
    'OVO': 'OVO',
    'DANA': 'DANA',
    'GOPAY': 'GoPay',
    'LINKAJA': 'LinkAja',
    'SHOPEEPAY': 'ShopeePay',
    'QRIS': 'QRIS',
    'ALFAMART': 'Alfamart',
    'INDOMARET': 'Indomaret'
  }
  return names[code] || code
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Product Simple Checkout] START')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[Product Simple Checkout] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Product Simple Checkout] User:', session.user.email)
    
    // CRITICAL: Ensure user exists in database before checkout
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      console.log(`[Product Simple Checkout] ⚠️ User not in DB, auto-creating: ${session.user.id}`)
      try {
        dbUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || 'unknown@example.com',
            name: session.user.name || 'User',
            role: 'MEMBER_FREE',
            emailVerified: true,
            avatar: session.user.image || null,
            wallet: {
              create: {
                balance: 0,
              },
            },
          },
        })
        console.log(`[Product Simple Checkout] User auto-created: ${dbUser.id}`)
      } catch (createUserErr) {
        console.error('[Product Simple Checkout] ❌ Failed to create user:', createUserErr)
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }
    }

    const body = await request.json()
    console.log('[Product Simple Checkout] Body:', JSON.stringify(body, null, 2))
    
    const { 
      productId,
      productSlug,
      finalPrice, 
      name, 
      email, 
      phone, 
      whatsapp,
      couponCode,
      paymentMethod, // 'bank_transfer', 'ewallet', 'qris'  
      paymentChannel // 'BCA', 'MANDIRI', 'OVO', 'DANA', 'QRIS', etc
    } = body

    // Validate required fields
    if (!name || !email || !whatsapp) {
      console.log('[Product Simple Checkout] ❌ Missing required fields')
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan nama, email, dan nomor WhatsApp sudah diisi.' },
        { status: 400 }
      )
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true }
    })

    if (!product) {
      console.log('[Product Simple Checkout] ❌ Product not found:', productId)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('[Product Simple Checkout] Product found:', product.name)

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

      if (coupon) {
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

        console.log('[Product Simple Checkout] ✅ Coupon applied:', {
          code: coupon.code,
          discount,
          affiliateId
        })
      }
    }

    // Check for affiliate cookie (if no coupon)
    if (!affiliateId) {
      const affiliateCookie = request.cookies.get('affiliate_ref')
      if (affiliateCookie) {
        try {
          const cookieData = JSON.parse(affiliateCookie.value)
          affiliateId = cookieData.userId
          console.log('[Product Simple Checkout] ✅ Affiliate from cookie:', affiliateId)
        } catch (e) {
          console.error('[Product Simple Checkout] Failed to parse affiliate cookie:', e)
        }
      }
    }

    // Calculate amounts
    const originalAmount = Number(product.price)
    const discountAmount = discount
    const amountNum = finalPrice || (originalAmount - discountAmount)
    const amountStr = String(amountNum)
    
    console.log('[Product Simple Checkout] Original:', originalAmount, 'Discount:', discountAmount, 'Final:', amountStr)

    // Generate invoice number using centralized invoice generator
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    console.log('[Product Simple Checkout] Invoice number:', invoiceNumber)

    // Create transaction with Decimal amount
    let transaction
    try {
      const transactionData: any = {
        invoiceNumber: invoiceNumber,
        userId: session.user.id,
        type: 'PRODUCT',
        status: 'PENDING',
        amount: amountStr,
        originalAmount: String(originalAmount),
        discountAmount: String(discountAmount),
        customerName: name || session.user.name || '',
        customerEmail: email || session.user.email || '',
        customerPhone: phone || '',
        customerWhatsapp: whatsapp || phone || '',
        description: `Product: ${product.name}`,
        externalId: `PROD-${Date.now()}-${session.user.id.slice(0, 8)}`, // For Xendit
        metadata: {
          productId: product.id,
          productSlug: productSlug || product.slug,
          productName: product.name,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          paymentMethodType: paymentMethod || 'bank_transfer',
          paymentChannel: paymentChannel || 'MANDIRI',
          paymentChannelName: getPaymentChannelName(paymentChannel || 'MANDIRI'),
          expiryHours: 72, // 3 days default
          affiliateId: affiliateId || null,
          couponCode: couponCode || null
        }
      }

      // Only add productId if product exists
      if (product?.id) transactionData.productId = product.id

      // Only add foreign keys if they have values
      if (coupon?.id) transactionData.couponId = coupon.id
      if (affiliateId) transactionData.affiliateId = affiliateId

      transaction = await prisma.transaction.create({
        data: transactionData
      })
      console.log('[Product Simple Checkout] Transaction created:', transaction.id)
    } catch (createErr) {
      console.error('[Product Simple Checkout] ❌ Transaction create error:', createErr)
      throw createErr
    }

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
        console.log('[Product Simple Checkout] ✅ Updated user profile:', updateData)
      } catch (error) {
        console.error('[Product Simple Checkout] Failed to update user profile:', error)
      }
    }

    // === XENDIT PAYMENT INTEGRATION ===
    let paymentUrl = ''
    let xenditData: any = null

    try {
      if (paymentChannel && paymentMethod === 'bank_transfer') {
        // Create Virtual Account
        console.log('[Product Simple Checkout] Creating Xendit VA for bank:', paymentChannel)
        
        const vaResult = await xenditService.createVirtualAccount({
          externalId: transaction.externalId!,
          bankCode: paymentChannel,
          name: name || session.user.name || 'Customer',
          amount: amountNum,
          isSingleUse: true,
          expirationDate: new Date(Date.now() + (72 * 60 * 60 * 1000)) // 72 hours
        })

        if (vaResult.success && vaResult.data) {
          xenditData = vaResult.data
          
          // Check if it's a real VA number or checkout link
          const isVANumber = vaResult.data.payment_method === 'VIRTUAL_ACCOUNT' && 
                            vaResult.data.account_number &&
                            !vaResult.data.account_number.startsWith('http');
          
          const isCheckoutLink = vaResult.data.payment_method === 'INVOICE' || 
                                vaResult.data.account_number?.startsWith('http');
          
          // Update transaction with Xendit VA info
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: vaResult.data.id,
              paymentProvider: 'XENDIT',
              paymentMethod: `VA_${paymentChannel}`,
              paymentUrl: isCheckoutLink ? vaResult.data.account_number : undefined,
              metadata: {
                ...(transaction.metadata as any),
                xenditVAId: vaResult.data.id,
                xenditVANumber: vaResult.data.account_number,
                xenditBankCode: paymentChannel,
                xenditExpiry: vaResult.data.expiration_date || vaResult.data.expirationDate,
                xenditPaymentMethod: vaResult.data.payment_method,
                xenditFallback: vaResult.data._fallback || false,
              }
            }
          })

          // Determine where to redirect
          if (isCheckoutLink) {
            // Redirect to Xendit checkout (fallback scenario)
            paymentUrl = vaResult.data.account_number;
            console.log('[Product Simple Checkout] ⚠️ Using Xendit checkout link:', paymentUrl);
          } else {
            // Show VA number on our payment page (same as membership)
            paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`;
            console.log('[Product Simple Checkout] ✅ Xendit VA created:', vaResult.data.account_number);
          }
        } else {
          console.error('[Product Simple Checkout] ❌ Xendit VA creation failed:', vaResult.error)
          // Fallback to manual payment page
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel && paymentMethod === 'ewallet') {
        // Create E-Wallet Payment
        console.log('[Product Simple Checkout] Creating Xendit E-Wallet payment:', paymentChannel)
        
        const ewalletResult = await xenditService.createEWalletPayment(
          transaction.externalId!,
          amountNum,
          phone || whatsapp || '',
          paymentChannel as any
        )

        if (ewalletResult.success && ewalletResult.data) {
          xenditData = ewalletResult.data
          
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: ewalletResult.data.id,
              paymentProvider: 'XENDIT',
              paymentMethod: `EWALLET_${paymentChannel}`,
              paymentUrl: (ewalletResult.data as any).actions?.mobile_web_checkout_url || (ewalletResult.data as any).checkout_url,
              metadata: {
                ...(transaction.metadata as any),
                xenditEWalletId: ewalletResult.data.id,
                xenditCheckoutUrl: (ewalletResult.data as any).actions?.mobile_web_checkout_url || (ewalletResult.data as any).checkout_url
              }
            }
          })

          // Redirect to Xendit checkout URL
          paymentUrl = (ewalletResult.data as any).actions?.mobile_web_checkout_url || (ewalletResult.data as any).checkout_url
          console.log('[Product Simple Checkout] ✅ Xendit E-Wallet created, checkout URL:', paymentUrl)
        } else {
          console.error('[Product Simple Checkout] ❌ Xendit E-Wallet creation failed:', ewalletResult.error)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel === 'QRIS' && paymentMethod === 'qris') {
        // Create QRIS Payment
        console.log('[Product Simple Checkout] Creating Xendit QRIS payment')
        
        const qrisResult = await xenditService.createQRCode(
          transaction.externalId!,
          amountNum,
          'DYNAMIC'
        )

        if (qrisResult.success && qrisResult.data) {
          xenditData = qrisResult.data
          
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: qrisResult.data.id,
              paymentProvider: 'XENDIT',
              paymentMethod: 'QRIS',
              metadata: {
                ...(transaction.metadata as any),
                xenditQRISId: qrisResult.data.id,
                xenditQRISString: (qrisResult.data as any).qr_string
              }
            }
          })

          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
          console.log('[Product Simple Checkout] ✅ Xendit QRIS created')
        } else {
          console.error('[Product Simple Checkout] ❌ Xendit QRIS creation failed:', qrisResult.error)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else {
        // Default: Manual bank transfer or no specific method
        paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
      }

    } catch (xenditError) {
      console.error('[Product Simple Checkout] ❌ Xendit error:', xenditError)
      // Fallback to manual payment
      paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
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
          amount: amountNum
        })
      }
    })

    // Return payment URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    console.log('[Product Simple Checkout] ENV - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[Product Simple Checkout] ENV - APP_URL:', process.env.APP_URL)
    console.log('[Product Simple Checkout] Using appUrl:', appUrl)
    
    if (!paymentUrl) {
      paymentUrl = `${appUrl}/payment/va/${transaction.id}`
    }
    
    console.log('[Product Simple Checkout] Payment URL:', paymentUrl)
    console.log('[Product Simple Checkout] END')

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: amountNum,
      invoiceNumber: invoiceNumber,
      xenditData: xenditData ? {
        accountNumber: xenditData.accountNumber || xenditData.account_number || xenditData.virtual_account_number,
        bankCode: xenditData.bank_code || xenditData.bankCode,
        checkoutUrl: (xenditData as any).actions?.mobile_web_checkout_url || (xenditData as any).checkout_url,
        qrString: (xenditData as any).qr_string
      } : null
    })

  } catch (error) {
    console.error('[Product Simple Checkout] ❌ MAIN ERROR:', error instanceof Error ? error.message : String(error))
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      console.error('[Product Simple Checkout] Prisma Error Code:', prismaError.code)
      console.error('[Product Simple Checkout] Prisma Error Meta:', prismaError.meta)
      
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
        error: 'Checkout failed',
        message: 'Gagal membuat transaksi. Silakan coba lagi.'
      },
      { status: 500 }
    )
  }
}
