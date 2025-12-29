import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Helper function to get readable payment channel name
function getPaymentChannelName(code: string): string {
  const names: Record<string, string> = {
    // Virtual Account
    'BCA': 'Bank Central Asia (BCA)',
    'MANDIRI': 'Bank Mandiri',
    'BNI': 'Bank Negara Indonesia (BNI)',
    'BRI': 'Bank Rakyat Indonesia (BRI)',
    'PERMATA': 'Bank Permata',
    'BSI': 'Bank Syariah Indonesia (BSI)',
    'CIMB': 'Bank CIMB Niaga',
    'SAHABAT_SAMPOERNA': 'Bank Sahabat Sampoerna',
    'BJB': 'Bank BJB',
    // E-Wallet
    'OVO': 'OVO',
    'DANA': 'DANA',
    'GOPAY': 'GoPay',
    'LINKAJA': 'LinkAja',
    'SHOPEEPAY': 'ShopeePay',
    'ASTRAPAY': 'AstraPay',
    'JENIUSPAY': 'JeniusPay',
    // QRIS
    'QRIS': 'QRIS (Scan QR)',
    // Retail
    'ALFAMART': 'Alfamart',
    'INDOMARET': 'Indomaret',
    // PayLater
    'KREDIVO': 'Kredivo',
    'AKULAKU': 'Akulaku',
  }
  return names[code] || code
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error('[Checkout Process] Unauthorized - No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[Checkout Process] Request body:', JSON.stringify(body, null, 2))
    
    const {
      itemType,
      itemId,
      paymentMethod,
      paymentChannel,
      customerName,
      customerEmail,
      customerWhatsapp,
      couponCode,
    } = body

    // Validate required fields
    if (!itemType || !itemId || !customerName || !customerEmail || !customerWhatsapp) {
      console.error('[Checkout Process] Missing required fields:', {
        itemType: !!itemType,
        itemId: !!itemId,
        customerName: !!customerName,
        customerEmail: !!customerEmail,
        customerWhatsapp: !!customerWhatsapp
      })
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan nama, email, dan nomor WhatsApp sudah diisi.' },
        { status: 400 }
      )
    }

    let item: any
    let transactionType: string
    let itemName: string
    let price: number

    // Fetch item based on type (case insensitive)
    const itemTypeLower = itemType.toLowerCase()
    console.log('[Checkout Process] Item type:', itemTypeLower)
    
    if (itemTypeLower === 'membership') {
      item = await prisma.membership.findUnique({
        where: { id: itemId },
      })
      transactionType = 'MEMBERSHIP'
      itemName = item?.name || 'Membership'
      price = Number(item?.price || 0)
      console.log('[Checkout Process] Membership found:', itemName, 'Price:', price)
    } else if (itemTypeLower === 'product') {
      item = await prisma.product.findUnique({
        where: { id: itemId },
      })
      transactionType = 'PRODUCT'
      itemName = item?.name || 'Product'
      price = Number(item?.price || 0)
    } else if (itemTypeLower === 'course') {
      item = await prisma.course.findUnique({
        where: { id: itemId },
      })
      transactionType = 'COURSE'
      itemName = item?.title || 'Course'
      price = Number(item?.price || 0)
    } else {
      console.error('[Checkout Process] Invalid item type:', itemType)
      return NextResponse.json(
        { error: 'Tipe item tidak valid' },
        { status: 400 }
      )
    }

    if (!item) {
      console.error('[Checkout Process] Item not found:', itemId)
      return NextResponse.json(
        { error: 'Item tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('[Checkout Process] Item found:', item)

    let discountAmount = 0
    let validCoupon: any = null

    // Validate coupon if provided
    if (couponCode) {
      validCoupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      })

      if (validCoupon) {
        if (validCoupon.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((price * Number(validCoupon.discountValue)) / 100)
        } else {
          discountAmount = Number(validCoupon.discountValue)
        }

        // Update coupon usage
        await prisma.coupon.update({
          where: { id: validCoupon.id },
          data: { usageCount: { increment: 1 } }
        })
      }
    }

    const finalAmount = Math.max(0, price - discountAmount)

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    
    // Get payment expiry hours from settings
    const settings = await prisma.settings.findFirst({
      select: { paymentExpiryHours: true }
    })
    const paymentExpiryHours = settings?.paymentExpiryHours || 72
    const expiryDurationMs = paymentExpiryHours * 60 * 60 * 1000 // Convert hours to milliseconds
    
    console.log('[Checkout Process] Creating transaction:', {
      userId: session.user.id,
      type: transactionType,
      invoiceNumber,
      amount: finalAmount,
      originalAmount: price,
      discountAmount,
      customerName,
      customerEmail,
      customerWhatsapp,
      paymentExpiryHours
    })

    // Build metadata with payment info
    const transactionMetadata: any = {
      paymentMethod: paymentMethod,
      paymentChannel: paymentChannel,
      paymentChannelName: getPaymentChannelName(paymentChannel),
      paymentMethodType: paymentMethod,
    }
    
    // Add membership ID if applicable
    if (itemTypeLower === 'membership') {
      transactionMetadata.membershipId = itemId
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber,
        userId: session.user.id,
        type: transactionType,
        status: 'PENDING',
        amount: finalAmount,
        originalAmount: price,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        customerName,
        customerEmail,
        customerWhatsapp,
        paymentMethod: `${paymentMethod}_${paymentChannel}`.toUpperCase(),
        paymentProvider: 'XENDIT',
        description: `Pembelian ${itemName}`,
        metadata: transactionMetadata,
        ...(itemTypeLower === 'product' && { productId: itemId }),
        ...(itemTypeLower === 'course' && { courseId: itemId }),
        ...(validCoupon && { couponId: validCoupon.id }),
      }
    })

    console.log('[Checkout Process] Transaction created:', transaction.id)

    // Create Xendit payment based on method
    console.log('[Checkout Process] Payment method:', paymentMethod, 'Channel:', paymentChannel)
    let paymentUrl = ''
    let xenditReference = ''
    let xenditExternalId = transaction.id
    let xenditExpiryDate: any = null

    // Handle Virtual Account (Bank Transfer)
    if (paymentMethod === 'bank_transfer' && paymentChannel) {
      console.log('[Checkout Process] Creating Virtual Account for bank:', paymentChannel)
      
      const vaResult = await xenditProxy.createVirtualAccount({
        external_id: transaction.id,
        bank_code: paymentChannel, // BCA, MANDIRI, BNI, BRI, PERMATA, BSI
        name: customerName,
        amount: finalAmount,
        is_single_use: true,
        expiration_date: new Date(Date.now() + expiryDurationMs).toISOString() // From payment settings
      })

      console.log('[Checkout Process] VA Result:', JSON.stringify(vaResult, null, 2))

      if (!vaResult.success || !vaResult.data) {
        console.error('[Checkout Process] VA creation failed')
        await prisma.transaction.delete({ where: { id: transaction.id } })
        return NextResponse.json(
          { error: 'Gagal membuat Virtual Account' },
          { status: 500 }
        )
      }

      const vaData = vaResult.data
      xenditReference = vaData.id
      xenditExternalId = vaData.external_id || transaction.id
      xenditExpiryDate = vaData.expiration_date || vaData.expirationDate
      
      // For VA, redirect to our custom page that shows VA number
      paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/va/${transaction.id}`

      // Check if VA number is a URL (fallback to Invoice)
      const vaNumber = vaData.account_number
      const isInvoiceFallback = vaNumber && vaNumber.startsWith('http')

      // Update transaction with VA details
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          reference: xenditReference,
          externalId: xenditExternalId,
          paymentUrl: isInvoiceFallback ? vaNumber : paymentUrl,
          paymentMethod: `VA_${paymentChannel}`,
          expiredAt: xenditExpiryDate ? new Date(xenditExpiryDate) : undefined,
          metadata: {
            ...transactionMetadata,
            vaNumber: vaNumber,
            bankCode: paymentChannel,
            bankName: getPaymentChannelName(paymentChannel),
            accountNumber: vaNumber,
            vaId: vaData.id,
            xenditVANumber: vaNumber,
            xenditBankCode: paymentChannel,
            xenditPaymentMethod: vaData.payment_method || 'VIRTUAL_ACCOUNT',
            xenditFallback: vaData._fallback || false,
          }
        }
      })

      // If fallback to invoice, redirect to Xendit checkout
      if (isInvoiceFallback) {
        paymentUrl = vaNumber
      }

      console.log('[Checkout Process] ✅ VA Created:', {
        vaNumber: vaNumber,
        bank: paymentChannel,
        redirectUrl: paymentUrl,
        isFallback: isInvoiceFallback
      })

    } else {
      // Handle Invoice (e-wallet, QRIS, or general payment)
      console.log('[Checkout Process] Creating Xendit invoice for:', paymentMethod, paymentChannel)
      
      // Determine payment methods to enable based on selection
      let paymentMethods: string[] = []
      if (paymentMethod === 'ewallet') {
        paymentMethods = [paymentChannel] // OVO, DANA, GOPAY, etc
      } else if (paymentMethod === 'qris') {
        paymentMethods = ['QRIS']
      } else if (paymentMethod === 'retail') {
        paymentMethods = [paymentChannel] // ALFAMART, INDOMARET
      }
      
      const invoiceResult = await xenditProxy.createInvoice({
        external_id: transaction.id,
        amount: finalAmount,
        payer_email: customerEmail,
        description: `Pembelian ${itemName}`,
        invoice_duration: paymentExpiryHours * 60 * 60, // From payment settings (in seconds)
        currency: 'IDR',
        payment_methods: paymentMethods.length > 0 ? paymentMethods : undefined,
        customer: {
          given_names: customerName,
          email: customerEmail,
          mobile_number: customerWhatsapp
        }
      })

      console.log('[Checkout Process] Invoice result:', JSON.stringify(invoiceResult, null, 2))

      if (!invoiceResult || !invoiceResult.invoice_url) {
        console.error('[Checkout Process] Invoice creation failed')
        await prisma.transaction.delete({ where: { id: transaction.id } })
        return NextResponse.json(
          { error: 'Gagal membuat invoice pembayaran' },
          { status: 500 }
        )
      }

      paymentUrl = invoiceResult.invoice_url
      xenditReference = invoiceResult.id
      xenditExternalId = invoiceResult.external_id
      xenditExpiryDate = invoiceResult.expiry_date

      // Update transaction with Xendit invoice data
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          reference: xenditReference,
          externalId: xenditExternalId,
          paymentUrl: paymentUrl,
          expiredAt: xenditExpiryDate ? new Date(xenditExpiryDate) : undefined,
          metadata: {
            ...transactionMetadata,
            xenditInvoiceUrl: paymentUrl,
            xenditInvoiceId: xenditReference,
          }
        }
      })

      console.log('[Checkout Process] ✅ Invoice Created:', {
        invoiceUrl: paymentUrl,
        paymentMethod: paymentMethod,
        paymentChannel: paymentChannel
      })
    }

    console.log('[Checkout Process] ✅ Success:', {
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: finalAmount
    })

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl,
      amount: finalAmount,
    })

  } catch (error) {
    console.error('[Checkout Process] ❌ Error:', error)
    console.error('[Checkout Process] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses checkout' },
      { status: 500 }
    )
  }
}
