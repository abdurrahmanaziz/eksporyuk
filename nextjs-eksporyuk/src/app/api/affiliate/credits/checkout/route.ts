import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'
import { validatePaymentAmount } from '@/lib/payment-methods'
import { getXenditConfig } from '@/lib/integration-config'

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
  }
  
  return channelNames[code] || code
}

// POST - Create checkout for credit top-up
export async function POST(request: Request) {
  try {
    console.log('🔵 POST /api/affiliate/credits/checkout called')
    
    // 1. Parse request body
    const body = await request.json()
    const { packageId, credits, price, paymentChannel, paymentMethod } = body

    console.log('📦 Credit package request:', { packageId, credits, price, paymentChannel, paymentMethod })

    // 2. Validate session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // 3. Validate required fields
    if (!packageId || !credits || !price) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // 4. Validate payment amount
    const amountValidation = await validatePaymentAmount(price)
    if (!amountValidation.valid) {
      return NextResponse.json({ 
        success: false,
        error: amountValidation.error 
      }, { status: 400 })
    }

    // 5. Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!affiliate) {
      return NextResponse.json({ 
        success: false,
        error: 'Affiliate profile not found' 
      }, { status: 404 })
    }

    // 6. Get payment settings
    const settings = await prisma.settings.findFirst()
    const expiryHours = settings?.paymentExpiryHours || 72

    // 7. Generate transaction identifiers
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    const timestamp = Date.now()
    const externalId = `CREDIT-${timestamp}-${affiliate.id.slice(0, 8)}`
    
    console.log('[Affiliate Credits Checkout] Invoice number:', invoiceNumber)

    // 8. Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        type: 'PRODUCT' as any,
        amount: price,
        status: 'PENDING',
        paymentMethod: paymentChannel || paymentMethod || 'ONLINE',
        paymentProvider: 'XENDIT',
        description: `Top up ${credits} kredit broadcast email`,
        externalId,
        customerName: affiliate.user.name,
        customerEmail: affiliate.user.email,
        customerPhone: affiliate.user.phone,
        metadata: {
          affiliateId: affiliate.id,
          credits,
          packageId,
          packageName: packageId,
          type: 'CREDIT_TOPUP',
          expiryHours: expiryHours,
          paymentMethodType: paymentMethod || 'bank_transfer',
          paymentChannel: paymentChannel || null,
          paymentChannelName: getPaymentChannelName(paymentChannel)
        },
      },
    })

    console.log('💳 Transaction created:', transaction.id)

    // 9. Create Xendit payment (VA or Invoice) - Same pattern as membership
    let xenditPayment: any
    let paymentUrl: string
    
    console.log('💳 Creating payment for channel:', paymentChannel)
    
    if (paymentChannel) {
      // Create Virtual Account for specific bank (same as membership system)
      console.log('🏦 Creating Virtual Account for:', paymentChannel)
      
      xenditPayment = await xenditProxy.createVirtualAccount({
        external_id: transaction.id,
        bank_code: paymentChannel,
        name: affiliate.user.name,
        amount: price,
        is_single_use: true,
      })

      console.log('✅ Xendit VA Response:', xenditPayment)

      if (xenditPayment.success && xenditPayment.data) {
        const currentMetadata = transaction.metadata as any || {}
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditPayment.data.id,
            paymentUrl: `/payment/va/${transaction.id}`, // Show VA number on our page
            metadata: {
              ...currentMetadata,
              xenditVAId: xenditPayment.data.id,
              xenditVANumber: xenditPayment.data.accountNumber || xenditPayment.data.account_number,
              xenditBankCode: paymentChannel,
              xenditVAData: xenditPayment.data
            }
          }
        })
        paymentUrl = `/payment/va/${transaction.id}` // Will show VA details
        console.log('✅ VA Created successfully:', xenditPayment.data.accountNumber || xenditPayment.data.account_number)
      } else {
        console.error('❌ Failed to create Xendit VA:', xenditPayment.error)
        paymentUrl = `/payment/va/${transaction.id}`
      }
    } else {
      // Create Invoice (general payment with all methods) - Same as membership system
      console.log('🧾 Creating Invoice for general payment')
      
      const invoiceData = await xenditProxy.createInvoice({
        external_id: transaction.id,
        payer_email: affiliate.user.email,
        description: `Top up ${credits} kredit broadcast email - ${packageId}`,
        amount: price,
        currency: 'IDR',
        invoice_duration: expiryHours * 3600,
        customer: {
          given_names: affiliate.user.name || 'Customer',
          email: affiliate.user.email,
          mobile_number: affiliate.user.phone || '',
        }
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
              xenditInvoiceUrl: xenditPayment.data.invoiceUrl
            }
          }
        })
      }

      paymentUrl = xenditPayment.success && xenditPayment.data 
        ? xenditPayment.data.invoiceUrl 
        : `/payment/va/${transaction.id}`
    }

    console.log('✅ Credit checkout successful! Payment URL:', paymentUrl)

    // 10. Return success response - Same pattern as membership
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      invoiceNumber,
      amount: price,
      paymentUrl,
      xenditData: (xenditPayment.success && xenditPayment.data) ? {
        id: xenditPayment.data.id,
        url: paymentChannel ? `/payment/va/${transaction.id}` : xenditPayment.data.invoiceUrl,
        accountNumber: xenditPayment.data.accountNumber,
        bankCode: paymentChannel
      } : null,
      customer: {
        id: affiliate.userId,
        name: affiliate.user.name,
        email: affiliate.user.email
      },
      credits
    })

  } catch (error: any) {
    console.error('❌ Credit checkout error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
