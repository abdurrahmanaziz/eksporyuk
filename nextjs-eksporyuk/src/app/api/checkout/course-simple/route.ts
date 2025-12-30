import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
    console.log('[Course Simple Checkout] START')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[Course Simple Checkout] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Course Simple Checkout] User:', session.user.email)
    
    // CRITICAL: Ensure user exists in database before checkout
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      console.log(`[Course Simple Checkout] ⚠️ User not in DB, auto-creating: ${session.user.id}`)
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
        console.log(`[Course Simple Checkout] User auto-created: ${dbUser.id}`)
      } catch (createUserErr) {
        console.error('[Course Simple Checkout] ❌ Failed to create user:', createUserErr)
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }
    }

    const body = await request.json()
    console.log('[Course Simple Checkout] Body:', JSON.stringify(body, null, 2))
    
    const { 
      courseId,
      courseSlug,
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
      console.log('[Course Simple Checkout] ❌ Missing required fields')
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan nama, email, dan nomor WhatsApp sudah diisi.' },
        { status: 400 }
      )
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { id: courseId, isPublished: true }
    })

    if (!course) {
      console.log('[Course Simple Checkout] ❌ Course not found:', courseId)
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    console.log('[Course Simple Checkout] Course found:', course.title)

    // Check if user already purchased this course
    const existingPurchase = await prisma.courseEnrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { 
          error: 'Already enrolled',
          message: 'Anda sudah terdaftar di kelas ini'
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
          discount = Math.round((Number(course.price) * Number(coupon.discountValue)) / 100)
        } else {
          discount = Number(coupon.discountValue)
        }

        // Get affiliate from coupon
        if (coupon.affiliateId) {
          affiliateId = coupon.affiliateId
        }

        console.log('[Course Simple Checkout] ✅ Coupon applied:', {
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
          console.log('[Course Simple Checkout] ✅ Affiliate from cookie:', affiliateId)
        } catch (e) {
          console.error('[Course Simple Checkout] Failed to parse affiliate cookie:', e)
        }
      }
    }

    // Calculate amounts
    const originalAmount = Number(course.price)
    const discountAmount = discount
    const amountNum = finalPrice || (originalAmount - discountAmount)
    const amountStr = String(amountNum)
    
    console.log('[Course Simple Checkout] Original:', originalAmount, 'Discount:', discountAmount, 'Final:', amountStr)

    // === HANDLE FREE COURSE ===
    if (amountNum === 0) {
      console.log('[Course Simple Checkout] 🆓 Free course enrollment')
      
      // Create enrollment directly
      await prisma.courseEnrollment.create({
        data: {
          id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: session.user.id,
          courseId: course.id,
          enrolledAt: new Date(),
          progress: 0,
          updatedAt: new Date()
        }
      })

      // Create free transaction record
      await prisma.transaction.create({
        data: {
          externalId: `COURSE-FREE-${Date.now()}`,
          userId: session.user.id,
          type: 'COURSE',
          courseId: course.id,
          amount: 0,
          discount: discount,
          status: 'SUCCESS',
          paymentMethod: 'FREE',
          customerName: name || session.user.name || '',
          customerEmail: email || session.user.email || '',
          customerPhone: whatsapp || phone || '',
          paidAt: new Date(),
          metadata: JSON.stringify({
            courseTitle: course.title,
            courseSlug: course.slug
          })
        }
      })

      // Activity log
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'ENROLL_FREE_COURSE',
          entity: 'COURSE',
          entityId: course.id,
          metadata: JSON.stringify({
            courseTitle: course.title
          })
        }
      })

      return NextResponse.json({
        success: true,
        isFree: true,
        courseSlug: course.slug,
        message: 'Berhasil mendaftar kelas gratis'
      })
    }

    // === PAID COURSE ===
    // Generate invoice number using centralized invoice generator
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    console.log('[Course Simple Checkout] Invoice number:', invoiceNumber)

    // Create transaction with Decimal amount
    let transaction
    try {
      const transactionData: any = {
        invoiceNumber: invoiceNumber,
        userId: session.user.id,
        type: 'COURSE',
        status: 'PENDING',
        amount: amountStr,
        originalAmount: String(originalAmount),
        discountAmount: String(discountAmount),
        customerName: name || session.user.name || '',
        customerEmail: email || session.user.email || '',
        customerPhone: phone || '',
        customerWhatsapp: whatsapp || phone || '',
        description: `Course: ${course.title}`,
        externalId: `COURSE-${Date.now()}-${session.user.id.slice(0, 8)}`, // For Xendit
        metadata: {
          courseId: course.id,
          courseSlug: courseSlug || course.slug,
          courseTitle: course.title,
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

      // Only add courseId if course exists
      if (course?.id) transactionData.courseId = course.id

      // Only add foreign keys if they have values
      if (coupon?.id) transactionData.couponId = coupon.id
      if (affiliateId) transactionData.affiliateId = affiliateId

      transaction = await prisma.transaction.create({
        data: transactionData
      })
      console.log('[Course Simple Checkout] Transaction created:', transaction.id)
    } catch (createErr) {
      console.error('[Course Simple Checkout] ❌ Transaction create error:', createErr)
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
        console.log('[Course Simple Checkout] ✅ Updated user profile:', updateData)
      } catch (error) {
        console.error('[Course Simple Checkout] Failed to update user profile:', error)
      }
    }

    // === XENDIT PAYMENT INTEGRATION ===
    let paymentUrl = ''
    let xenditData: any = null

    try {
      if (paymentChannel && paymentMethod === 'bank_transfer') {
        // Create Virtual Account
        console.log('[Course Simple Checkout] Creating Xendit VA for bank:', paymentChannel)
        
        const vaResult = await xenditProxy.createVirtualAccount({
          external_id: transaction.externalId!,
          bank_code: paymentChannel,
          name: name || session.user.name || 'Customer',
          amount: amountNum,
          is_single_use: true,
          expiration_date: new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString() // 72 hours
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
            console.log('[Course Simple Checkout] ⚠️ Using Xendit checkout link:', paymentUrl);
          } else {
            // Show VA number on our payment page (same as membership)
            paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/manual/${transaction.id}`;
            console.log('[Course Simple Checkout] ✅ Xendit VA created:', vaResult.data.account_number);
          }
        } else {
          console.error('[Course Simple Checkout] ❌ Xendit VA creation failed:', vaResult.error)
          // Fallback to manual payment page
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/manual/${transaction.id}`
        }

      } else if (paymentChannel && paymentMethod === 'ewallet') {
        // Create E-Wallet Payment
        console.log('[Course Simple Checkout] Creating Xendit E-Wallet payment:', paymentChannel)
        
        const ewalletResult = await xenditProxy.createEWalletPayment({
          reference_id: transaction.externalId!,
          currency: 'IDR',
          amount: amountNum,
          checkout_method: 'ONE_TIME_PAYMENT',
          channel_code: paymentChannel,
          channel_properties: {
            success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?transaction_id=${transaction.id}`,
            failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failed?transaction_id=${transaction.id}`,
            mobile_number: phone || whatsapp || ''
          }
        })

        if (ewalletResult && ewalletResult.id) {
          xenditData = ewalletResult
          
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: ewalletResult.id,
              paymentProvider: 'XENDIT',
              paymentMethod: `EWALLET_${paymentChannel}`,
              paymentUrl: ewalletResult.actions?.mobile_web_checkout_url || ewalletResult.checkout_url,
              metadata: {
                ...(transaction.metadata as any),
                xenditEWalletId: ewalletResult.id,
                xenditCheckoutUrl: ewalletResult.actions?.mobile_web_checkout_url || ewalletResult.checkout_url
              }
            }
          })

          // Redirect to Xendit checkout URL
          paymentUrl = ewalletResult.actions?.mobile_web_checkout_url || ewalletResult.checkout_url
          console.log('[Course Simple Checkout] ✅ Xendit E-Wallet created, checkout URL:', paymentUrl)
        } else {
          console.error('[Course Simple Checkout] ❌ Xendit E-Wallet creation failed')
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/manual/${transaction.id}`
        }

      } else if (paymentChannel === 'QRIS' && paymentMethod === 'qris') {
        // Create QRIS Payment
        console.log('[Course Simple Checkout] Creating Xendit QRIS payment')
        
        const qrisResult = await xenditProxy.createQRCode({
          reference_id: transaction.externalId!,
          type: 'DYNAMIC',
          currency: 'IDR',
          amount: amountNum
        })

        if (qrisResult && qrisResult.id) {
          xenditData = qrisResult
          
          // Update transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: qrisResult.id,
              paymentProvider: 'XENDIT',
              paymentMethod: 'QRIS',
              metadata: {
                ...(transaction.metadata as any),
                xenditQRISId: qrisResult.id,
                xenditQRISString: qrisResult.qr_string
              }
            }
          })

          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
          console.log('[Course Simple Checkout] ✅ Xendit QRIS created')
        } else {
          console.error('[Course Simple Checkout] ❌ Xendit QRIS creation failed')
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else {
        // Default: Manual bank transfer or no specific method
        paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
      }

    } catch (xenditError) {
      console.error('[Course Simple Checkout] ❌ Xendit error:', xenditError)
      // Fallback to manual payment
      paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CHECKOUT_COURSE',
        entity: 'TRANSACTION',
        entityId: transaction.id,
        metadata: JSON.stringify({
          courseId: course.id,
          amount: amountNum
        })
      }
    })

    // Return payment URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    console.log('[Course Simple Checkout] ENV - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[Course Simple Checkout] ENV - APP_URL:', process.env.APP_URL)
    console.log('[Course Simple Checkout] Using appUrl:', appUrl)
    
    if (!paymentUrl) {
      paymentUrl = `${appUrl}/payment/va/${transaction.id}`
    }
    
    console.log('[Course Simple Checkout] Payment URL:', paymentUrl)
    console.log('[Course Simple Checkout] END')

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
    console.error('[Course Simple Checkout] ❌ MAIN ERROR:', error instanceof Error ? error.message : String(error))
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      console.error('[Course Simple Checkout] Prisma Error Code:', prismaError.code)
      console.error('[Course Simple Checkout] Prisma Error Meta:', prismaError.meta)
      
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
