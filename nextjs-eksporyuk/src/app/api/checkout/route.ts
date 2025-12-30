import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { xenditProxy } from '@/lib/xendit-proxy'
import { prisma } from '@/lib/prisma'
import { getNextInvoiceNumber } from '@/lib/invoice-generator'
import { isPaymentMethodAvailable, validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Helper function to get payment channel full name
function getPaymentChannelName(code: string | null): string {
  if (!code) return 'Unknown'
  
  const channelNames: Record<string, string> = {
    // Banks
    'BCA': 'Bank Central Asia (BCA)',
    'BRI': 'Bank Rakyat Indonesia (BRI)',
    'BNI': 'Bank Negara Indonesia (BNI)',
    'MANDIRI': 'Bank Mandiri',
    'PERMATA': 'Bank Permata',
    'CIMB': 'CIMB Niaga',
    'BSI': 'Bank Syariah Indonesia (BSI)',
    'BJB': 'Bank BJB',
    'SAHABAT_SAMPOERNA': 'Bank Sahabat Sampoerna',
    // E-wallets
    'OVO': 'OVO',
    'DANA': 'DANA',
    'GOPAY': 'GoPay',
    'LINKAJA': 'LinkAja',
    'SHOPEEPAY': 'ShopeePay',
    // Retail
    'ALFAMART': 'Alfamart',
    'INDOMARET': 'Indomaret',
    // Others
    'QRIS': 'QRIS',
    'KREDIVO': 'Kredivo',
    'AKULAKU': 'Akulaku',
  }
  
  return channelNames[code] || code
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 POST /api/checkout called')
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    const {
      type,
      productId,
      membershipId,
      courseId,
      amount,
      customerData,
      customerInfo, // Alternative field name
      couponCode,
      affiliateCode,
      salesPageId,
      notes,
      paymentChannel, // Bank yang dipilih user (BCA, BNI, dll)
      paymentMethod // Metode pembayaran (bank_transfer, ewallet, qris, retail, paylater, free)
    } = body

    // Use customerInfo if customerData is not provided
    const customerDetails = customerData || customerInfo
    
    console.log('👤 Customer details:', customerDetails)
    console.log('💰 Amount:', amount, 'Payment method:', paymentMethod)

    // Validate required fields - allow amount 0 for free courses
    if (!type || !customerDetails?.name || !customerDetails?.email) {
      console.error('❌ Validation failed:', { type, amount, paymentMethod, hasName: !!customerDetails?.name, hasEmail: !!customerDetails?.email })
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Validate amount for non-free payments
    if (paymentMethod !== 'free' && (amount === undefined || amount === null)) {
      console.error('❌ Amount validation failed for non-free payment')
      return NextResponse.json({ 
        success: false, 
        error: 'Amount is required for paid courses' 
      }, { status: 400 })
    }

    // Validate payment amount with settings
    if (paymentMethod !== 'free' && amount > 0) {
      const amountValidation = await validatePaymentAmount(amount)
      if (!amountValidation.valid) {
        return NextResponse.json({ 
          success: false, 
          error: amountValidation.error 
        }, { status: 400 })
      }
    }

    // Validate payment channel availability (only if using Xendit)
    if (paymentChannel && paymentMethod !== 'free' && paymentMethod !== 'manual') {
      const channelAvailable = await isPaymentMethodAvailable(paymentChannel)
      if (!channelAvailable) {
        console.error('❌ Payment channel not available:', paymentChannel)
        return NextResponse.json({ 
          success: false, 
          error: `Payment method ${paymentChannel} is currently unavailable. Please choose another method.` 
        }, { status: 400 })
      }
    }

    // Get payment expiry settings
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.settings.create({
        data: {
          id: 1,
          paymentExpiryHours: 72, // 3 days default
          followUpEnabled: true,
          followUp1HourEnabled: true,
          followUp24HourEnabled: true,
          followUp48HourEnabled: true
        }
      })
    }
    const expiryHours = settings.paymentExpiryHours || 72

    // Create customer (user) record
    let customer
    try {
      // Check if user exists
      customer = await prisma.user.findUnique({
        where: { email: customerDetails.email }
      })

      if (!customer) {
        // Create new user
        customer = await prisma.user.create({
          data: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            whatsapp: customerDetails.whatsapp || customerDetails.phone,
            role: 'MEMBER_FREE',
            isActive: true,
            emailVerified: true,
          }
        })
      } else {
        // Update existing user info
        customer = await prisma.user.update({
          where: { id: customer.id },
          data: {
            name: customerDetails.name,
            phone: customerDetails.phone,
            whatsapp: customerDetails.whatsapp || customerDetails.phone,
          }
        })
      }
    } catch (error) {
      console.error('Error creating/updating customer:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create customer record' 
      }, { status: 500 })
    }

    // Find affiliate if code provided
    let affiliate = null
    // TODO: Implement affiliate tracking when AffiliateProfile is ready
    /*
    if (affiliateCode) {
      try {
        affiliate = await prisma.affiliateProfile.findFirst({
          where: {
            OR: [
              { shortLink: affiliateCode },
              { affiliateCode: affiliateCode }
            ]
          }
        })
      } catch (error) {
        console.error('Error finding affiliate:', error)
      }
    }
    */

    // Find coupon if code provided
    let coupon = null
    let couponDiscount = 0
    if (couponCode) {
      try {
        coupon = await prisma.coupon.findFirst({
          where: {
            code: couponCode,
            isActive: true,
            OR: [
              { validUntil: null },
              { validUntil: { gt: new Date() } },
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        })

        if (coupon) {
          const discountValue = Number(coupon.discountValue)
          if (coupon.discountType === 'PERCENTAGE') {
            couponDiscount = amount * (discountValue / 100)
          } else {
            couponDiscount = discountValue
          }
        }
      } catch (error) {
        console.error('Error finding coupon:', error)
      }
    }

    // Apply coupon discount if applicable
    const discountedAmount = Math.max(0, amount - couponDiscount)
    
    // Set final amount: 0 for free courses, otherwise apply discounts
    const finalAmount = paymentMethod === 'free' ? 0 : discountedAmount

    // Generate invoice number (INV001, INV002, etc.)
    const invoiceNumber = await getNextInvoiceNumber()

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber: invoiceNumber,
        userId: customer.id,
        type: type,
        amount: finalAmount,
        originalAmount: amount,
        discountAmount: couponDiscount,
        status: 'PENDING',
        paymentMethod: paymentChannel || paymentMethod || 'ONLINE', // Simpan bank yang dipilih user (BCA, BNI, GOPAY, dll)
        paymentProvider: 'XENDIT',
        productId: productId || null,
        courseId: courseId || null,
        couponId: coupon?.id || null,
        description: type === 'MEMBERSHIP' ? 
                    `Pembelian ${membershipId?.includes('lifetime') ? 'membership lifetime' : 'membership'}` :
                    type === 'COURSE' ?
                    `Pembelian kursus ${courseId}` :
                    `Pembelian produk ${productId}`,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerWhatsapp: customer.whatsapp || customer.phone,
        notes: notes || '',
        metadata: {
          salesPageId: salesPageId,
          salesPageSlug: salesPageId?.split('-').slice(1).join('-') || '',
          userAgent: request.headers.get('user-agent') || '',
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1',
          checkoutSource: 'sales_page',
          affiliateCode: affiliateCode || null,
          productId: productId || null,
          courseId: courseId || null,
          originalAmount: amount,
          discountAmount: couponDiscount,
          paymentMethodType: paymentMethod || 'bank_transfer', // bank_transfer, ewallet, qris, retail, paylater
          paymentChannel: paymentChannel || null, // BCA, BNI, GOPAY, QRIS, ALFAMART, dll
          paymentChannelName: getPaymentChannelName(paymentChannel), // Nama lengkap bank
          expiryHours: expiryHours
        }
      }
    })

    // If membership purchase, create membership record
    if (type === 'MEMBERSHIP' && membershipId) {
      try {
        // Calculate expiry date based on membership type
        let expiresAt = null
        if (membershipId.includes('lifetime')) {
          // Lifetime membership - no expiry
          expiresAt = null
        } else if (membershipId.includes('6-months')) {
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 6)
        } else {
          // Default 1 month
          expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)
        }

        await prisma.userMembership.create({
          data: {
            userId: customer.id,
            membershipId: membershipId,
            startDate: new Date(),
            endDate: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
            status: 'PENDING',
            activatedAt: null,
            price: finalAmount,
            transactionId: transaction.id,
            isActive: false,
            autoRenew: false
          }
        })
      } catch (error) {
        console.error('Error creating membership:', error)
        // Don't fail the whole transaction for this
      }
    }

    // If course purchase, create course enrollment
    if (type === 'COURSE' && courseId) {
      try {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: customer.id,
            courseId: courseId,
            transactionId: transaction.id,
            progress: 0,
            completed: false,
            updatedAt: new Date(),
          }
        })
      } catch (error) {
        console.error('Error creating course enrollment:', error)
        // Don't fail the whole transaction for this
      }
    }

    // Update affiliate statistics if applicable
    // TODO: Implement when AffiliateProfile system is ready
    /*
    if (affiliate) {
      try {
        await prisma.affiliateProfile.update({
          where: { id: affiliate.id },
          data: {
            totalClicks: { increment: 1 },
            totalConversions: { increment: 1 },
            totalEarnings: { increment: finalAmount * 0.1 }
          }
        })
      } catch (error) {
        console.error('Error updating affiliate stats:', error)
      }
    }
    */

    // Handle free courses - skip payment and complete enrollment
    if (type === 'COURSE' && (finalAmount === 0 || paymentMethod === 'free')) {
      console.log('🆓 Processing free course enrollment')
      
      try {
        // Update transaction to completed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS', // Use valid TransactionStatus enum value
            paidAt: new Date(),
            paymentUrl: `/dashboard?enrolled=success`,
            reference: `FREE_${transaction.id}`
          }
        })

        // Course enrollment is already created above, no need to update
        console.log('✅ Free course enrollment completed for user:', customer.id)

        // Activate membership if this was a course with membership upgrade
        if (membershipId) {
          await prisma.userMembership.updateMany({
            where: {
              userId: customer.id,
              transactionId: transaction.id
            },
            data: {
              status: 'ACTIVE',
              isActive: true,
              activatedAt: new Date()
            }
          })
        }
        
        return NextResponse.json({
          success: true,
          status: 'COMPLETED',
          type: 'free_enrollment',
          isFree: true,
          message: 'Pendaftaran kursus gratis berhasil!'
        })
        
      } catch (error) {
        console.error('Error completing free course enrollment:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to complete free course enrollment' 
        }, { status: 500 })
      }
    }

    // Create Xendit payment (VA or Invoice)
    let xenditPayment: any
    let paymentUrl: string
    
    console.log('💳 Creating payment for channel:', paymentChannel)
    
    // Always use Invoice flow (both VA and E-Wallet) to avoid IP allowlist issues
    console.log('💳 Creating Xendit Invoice for payment channel:', paymentChannel || 'all methods')
    
    {
      // Create Invoice (works for all payment methods including VA)
      const invoiceData = await xenditProxy.createInvoice({
        external_id: transaction.id,
        payer_email: customer.email,
        description: transaction.description || 'Purchase',
        amount: finalAmount,
        currency: 'IDR',
        invoice_duration: expiryHours * 3600,
        customer: {
          given_names: customer.name,
          email: customer.email,
          mobile_number: customer.phone || '',
        },
        // Add payment method hint for VA
        ...(paymentChannel && {
          payment_methods: [`BANK_${paymentChannel}`],
          success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?transaction_id=${transaction.id}`,
          failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failed?transaction_id=${transaction.id}`
        })
      })

      if (!invoiceData || !invoiceData.invoice_url) {
        console.error('Failed to create Xendit invoice')
        xenditPayment = { success: false, error: 'No invoice_url returned' }
      } else {
        xenditPayment = { 
          success: true, 
          data: {
            id: invoiceData.id,
            invoiceUrl: invoiceData.invoice_url
          }
        }
      }

      // Update transaction with Xendit invoice info
      if (xenditPayment.success && xenditPayment.data) {
        const currentMetadata = transaction.metadata as any || {}
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditPayment.data.id,
            paymentUrl: xenditPayment.data.invoiceUrl,
            metadata: {
              ...currentMetadata,
              xenditInvoiceId: xenditPayment.data.id,
              xenditInvoiceUrl: xenditPayment.data.invoiceUrl,
              preferredPaymentMethod: paymentChannel || 'all'
            }
          }
        })
      }

      paymentUrl = xenditPayment.success && xenditPayment.data 
        ? xenditPayment.data.invoiceUrl 
        : `/payment/manual/${transaction.id}` // Fallback to manual payment
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      amount: finalAmount,
      paymentUrl,
      xenditData: (xenditPayment.success && xenditPayment.data) ? {
        id: xenditPayment.data.id,
        url: xenditPayment.data.invoiceUrl,
        preferredMethod: paymentChannel || 'all'
      } : null,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      }
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get transaction details for payment page
    const url = new URL(request.url)
    const transactionId = url.searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID required' 
      }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        coupon: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 })
    }

    // Get membership if exists
    const membership = await prisma.userMembership.findFirst({
      where: { transactionId: transaction.id }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        amount: Number(transaction.amount),
        originalAmount: transaction.originalAmount ? Number(transaction.originalAmount) : undefined,
        discountAmount: transaction.discountAmount ? Number(transaction.discountAmount) : undefined,
        status: transaction.status,
        type: transaction.type,
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
        membership: membership
      }
    })

  } catch (error) {
    console.error('Get checkout error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}