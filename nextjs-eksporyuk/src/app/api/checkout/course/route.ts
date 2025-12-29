import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'
import { validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('[API Checkout Course] === START ===')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[API Checkout Course] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API Checkout Course] ✅ User authenticated:', session.user.email)

    // Verify user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!dbUser) {
      console.log('[API Checkout Course] ⚠️ User not found in DB, creating new user:', session.user.id)
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
        console.log('[API Checkout Course] ✅ New user created:', dbUser.email)
      } catch (createError) {
        console.error('[API Checkout Course] ❌ Failed to create user:', createError)
        return NextResponse.json(
          { error: 'User creation failed', message: 'Gagal membuat akun. Silakan logout dan login kembali.' },
          { status: 400 }
        )
      }
    }

    console.log('[API Checkout Course] ✅ User verified in DB:', dbUser.email)

    const body = await request.json()
    console.log('[API Checkout Course] Request body:', JSON.stringify(body, null, 2))
    
    const { courseId, couponCode, finalPrice, name, email, phone, whatsapp } = body

    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId, isPublished: true }
    })

    if (!course) {
      console.log('[API Checkout Course] ❌ Course not found:', courseId)
      return NextResponse.json(
        { error: 'Invalid course' },
        { status: 404 }
      )
    }

    console.log('[API Checkout Course] ✅ Course found:', course.title)

    // Check if user already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })

    if (existingEnrollment) {
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
        discount = Math.round((Number(course.price) * Number(coupon.discountValue)) / 100)
      } else {
        discount = Number(coupon.discountValue)
      }

      // Get affiliate from coupon
      if (coupon.affiliateId) {
        affiliateId = coupon.affiliateId
      }

      console.log('[API Checkout Course] ✅ Coupon applied:', {
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
          console.log('[API Checkout Course] ✅ Affiliate from cookie:', affiliateId)
        } catch (e) {
          console.error('[API Checkout Course] Failed to parse affiliate cookie:', e)
        }
      }
    }

    // Calculate final amount
    const amount = Math.max(0, finalPrice || (Number(course.price) - discount))
    
    // Handle FREE courses
    if (amount === 0) {
      console.log('[API Checkout Course] 🆓 Free course enrollment')
      
      // Create enrollment directly
      await prisma.courseEnrollment.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          enrolledAt: new Date(),
          progress: 0
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

    // For PAID courses - create transaction and Xendit invoice
    const externalId = `COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const expiryHours = 24

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    console.log('[API Checkout Course] Invoice number:', invoiceNumber)

    // Calculate commission
    let commissionAmount = 0
    if (affiliateId) {
      // Default 30% commission for courses
      commissionAmount = Math.round(amount * 0.30)
    }

    // Create transaction
    const transactionData: any = {
      invoiceNumber: invoiceNumber,
      externalId: externalId,
      userId: session.user.id,
      type: 'COURSE',
      courseId: course.id,
      amount: amount,
      discount: discount,
      commissionAmount: commissionAmount,
      status: 'PENDING',
      paymentMethod: 'XENDIT',
      customerName: name || session.user.name || '',
      customerEmail: email || session.user.email || '',
      customerPhone: whatsapp || phone || '',
      expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
      metadata: JSON.stringify({
        courseTitle: course.title,
        courseSlug: course.slug,
        couponCode: couponCode || null,
        affiliateId: affiliateId || null
      })
    }

    if (coupon) {
      transactionData.couponId = coupon.id
    }

    if (affiliateId) {
      transactionData.affiliateId = affiliateId
    }

    const transaction = await prisma.transaction.create({
      data: transactionData
    })

    console.log('[API Checkout Course] ✅ Transaction created:', transaction.id)

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
        console.log('[API Checkout Course] ✅ Updated user profile:', updateData)
      } catch (error) {
        console.error('[API Checkout Course] Failed to update user profile:', error)
      }
    }

    // Generate Xendit invoice
    let paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
    
    try {
      const invoiceResult = await xenditProxy.createInvoice({
        external_id: externalId,
        amount: amount,
        payer_email: email || session.user.email || '',
        description: `Course: ${course.title}`,
        invoice_duration: expiryHours * 3600,
        currency: 'IDR',
        customer: {
          given_names: name || session.user.name || '',
          email: email || session.user.email || '',
          mobile_number: whatsapp || phone || ''
        }
      })

      if (invoiceResult && invoiceResult.invoice_url) {
        paymentUrl = invoiceResult.invoice_url
        
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paymentUrl: paymentUrl,
            reference: invoiceResult.id,
            expiredAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
          }
        })
        console.log('[API Checkout Course] ✅ Xendit invoice created')
      } else {
        console.error('[API Checkout Course] Failed to create Xendit invoice')
      }
    } catch (xenditError) {
      console.error('[API Checkout Course] Xendit integration error:', xenditError)
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
          amount: amount
        })
      }
    })

    console.log('[API Checkout Course] ✅ Payment URL:', paymentUrl)
    console.log('[API Checkout Course] === END ===')

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: amount
    })

  } catch (error) {
    console.error('[API Checkout Course] ❌ ERROR:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Terjadi kesalahan saat memproses checkout'
      },
      { status: 500 }
    )
  }
}
