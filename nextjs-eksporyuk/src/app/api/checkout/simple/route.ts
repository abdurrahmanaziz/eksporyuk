import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

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
    console.log('[Simple Checkout] ===== START =====')
    console.log('[Simple Checkout] Environment:', process.env.NODE_ENV)
    console.log('[Simple Checkout] Database URL exists:', !!process.env.DATABASE_URL)
    
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[Simple Checkout] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Simple Checkout] ✅ User authenticated:', session.user.email, 'ID:', session.user.id)
    
    // CRITICAL: Ensure user exists in database before checkout
    let dbUser
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      console.log('[Simple Checkout] User in DB:', !!dbUser)
    } catch (dbUserErr) {
      console.error('[Simple Checkout] ❌ Failed to fetch user from DB:', dbUserErr)
      return NextResponse.json(
        { error: 'Database error', message: 'Gagal mengakses user data' },
        { status: 500 }
      )
    }

    if (!dbUser) {
      console.log(`[Simple Checkout] ⚠️ User not in DB, auto-creating: ${session.user.id}`)
      try {
        dbUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || 'unknown@example.com',
            name: session.user.name || 'User',
            role: 'MEMBER_FREE',
            emailVerified: true,
            avatar: (session.user as any).image || null,
          },
        })
        // Create wallet separately (no nested relation)
        await prisma.wallet.create({
          data: {
            id: createId(),
            userId: dbUser.id,
            balance: 0,
            updatedAt: new Date()
          },
        })
        console.log(`[Simple Checkout] User auto-created: ${dbUser.id}`)
      } catch (createUserErr) {
        console.error('[Simple Checkout] ❌ Failed to create user:', createUserErr)
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }
    }

    // Parse request body with error handling
    let body: any
    try {
      body = await request.json()
      console.log('[Simple Checkout] ✅ Body parsed successfully')
      console.log('[Simple Checkout] Body keys:', Object.keys(body))
    } catch (parseErr) {
      console.error('[Simple Checkout] ❌ Failed to parse request body:', parseErr)
      return NextResponse.json(
        { error: 'Invalid request', message: 'Request body tidak valid' },
        { status: 400 }
      )
    }
    
    console.log('[Simple Checkout] Body:', JSON.stringify(body, null, 2))
    
    const { 
      planId, 
      priceOption, 
      finalPrice, 
      name, 
      email, 
      phone, 
      whatsapp,
      membershipSlug,
      couponCode,
      paymentMethod = 'bank_transfer', // Default to bank_transfer
      paymentChannel = 'BCA' // Default to BCA
    } = body

    console.log('[Simple Checkout] Parsed values:', {
      planId,
      name,
      email,
      whatsapp,
      paymentMethod,
      paymentChannel,
      finalPrice
    })

    // Validate required fields
    if (!planId) {
      console.log('[Simple Checkout] ❌ Missing planId')
      return NextResponse.json(
        { error: 'Plan ID tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!name || !email || !whatsapp) {
      console.log('[Simple Checkout] ❌ Missing required fields:', { name, email, whatsapp })
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan nama, email, dan nomor WhatsApp sudah diisi.' },
        { status: 400 }
      )
    }

    // Get plan with error handling
    let plan
    try {
      console.log('[Simple Checkout] Fetching membership plan:', planId)
      plan = await prisma.membership.findUnique({
        where: { id: planId }
      })
      console.log('[Simple Checkout] Plan found:', !!plan, plan?.name)
    } catch (planErr) {
      console.error('[Simple Checkout] ❌ Failed to fetch plan:', planErr)
      return NextResponse.json(
        { error: 'Database error', message: 'Gagal mengakses data membership' },
        { status: 500 }
      )
    }

    if (!plan) {
      console.log('[Simple Checkout] ❌ Plan not found:', planId)
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }
    
    if (!plan.isActive) {
      console.log('[Simple Checkout] ❌ Plan inactive:', planId)
      return NextResponse.json(
        { error: 'Plan not active' },
        { status: 404 }
      )
    }



    console.log('[Simple Checkout] Plan found:', plan.name)

    // Calculate amounts
    const originalAmount = priceOption?.price || plan.price || 0
    const discount = priceOption?.discount || 0
    const discountAmount = discount > 0 ? (originalAmount * discount / 100) : 0
    const amountNum = finalPrice || (originalAmount - discountAmount)
    const amountStr = String(amountNum)
    
    console.log('[Simple Checkout] Original:', originalAmount, 'Discount:', discountAmount, 'Final:', amountStr)

    // Generate invoice number using centralized invoice generator
    let invoiceNumber: string
    try {
      const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
      invoiceNumber = await getNextInvoiceNumber()
      console.log('[Simple Checkout] Invoice number generated:', invoiceNumber)
    } catch (invoiceErr) {
      console.error('[Simple Checkout] ⚠️ Invoice generation failed, using fallback:', invoiceErr)
      // Fallback invoice number
      invoiceNumber = `INV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`
      console.log('[Simple Checkout] Using fallback invoice:', invoiceNumber)
    }

    // Create transaction with Decimal amount
    let transaction
    try {
      console.log('[Simple Checkout] Creating transaction in database...')
      console.log('[Simple Checkout] Transaction data:', {
        invoiceNumber,
        userId: session.user.id,
        type: 'MEMBERSHIP',
        status: 'PENDING',
        amount: amountStr,
        originalAmount: String(originalAmount),
        discountAmount: String(discountAmount),
        customerName: name || session.user.name || '',
        customerEmail: email || session.user.email || '',
        customerPhone: phone || '',
        customerWhatsapp: whatsapp || phone || '',
      })
      
      transaction = await prisma.transaction.create({
        data: {
          id: createId(),
          invoiceNumber: invoiceNumber,
          userId: session.user.id,
          type: 'MEMBERSHIP',
          status: 'PENDING',
          amount: amountStr,
          originalAmount: String(originalAmount),
          discountAmount: String(discountAmount),
          customerName: name || session.user.name || '',
          customerEmail: email || session.user.email || '',
          customerPhone: phone || '',
          customerWhatsapp: whatsapp || phone || '',
          description: `Membership: ${plan.name} - ${priceOption?.label || ''}`,
          externalId: `TXN-${Date.now()}-${session.user.id.slice(0, 8)}`, // For Xendit
          updatedAt: new Date(),
          metadata: {
            membershipId: plan.id,
            membershipSlug: membershipSlug || plan.slug,
            membershipType: priceOption?.label || plan.name,
            membershipDuration: priceOption?.duration || '',
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            discountPercentage: discount,
            paymentMethodType: paymentMethod || 'bank_transfer',
            paymentChannel: paymentChannel || 'MANDIRI',
            paymentChannelName: getPaymentChannelName(paymentChannel || 'MANDIRI'),
            expiryHours: 72 // 3 days default
          }
        }
      })
      console.log('[Simple Checkout] ✅ Transaction created successfully:', transaction.id)
    } catch (createErr: any) {
      console.error('[Simple Checkout] ❌ Transaction create error:', createErr)
      console.error('[Simple Checkout] ❌ Error name:', createErr?.name)
      console.error('[Simple Checkout] ❌ Error message:', createErr?.message)
      console.error('[Simple Checkout] ❌ Error code:', createErr?.code)
      console.error('[Simple Checkout] ❌ Error stack:', createErr?.stack)
      
      // Return specific error message
      return NextResponse.json(
        { 
          error: 'Database error',
          message: `Gagal membuat transaksi: ${createErr?.message || 'Unknown error'}`,
          details: process.env.NODE_ENV === 'development' ? createErr?.stack : undefined
        },
        { status: 500 }
      )
    }

    // === XENDIT PAYMENT INTEGRATION ===
    let paymentUrl = ''
    let xenditData: any = null

    try {
      console.log('[Simple Checkout] Payment integration - Method:', paymentMethod, 'Channel:', paymentChannel)
      
      if (paymentChannel && paymentMethod === 'bank_transfer') {
        // Create Virtual Account
        console.log('[Simple Checkout] Creating Xendit VA for bank:', paymentChannel)
        
        try {
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
                xenditExpiry: vaResult.data.expiration_date || (vaResult.data as any).expirationDate,
                xenditPaymentMethod: vaResult.data.payment_method,
                xenditFallback: vaResult.data._fallback || false,
              }
            }
          })

          // Determine where to redirect
          if (isCheckoutLink) {
            // Redirect to Xendit checkout (fallback scenario)
            paymentUrl = vaResult.data.account_number;
            console.log('[Simple Checkout] ⚠️ Using Xendit checkout link:', paymentUrl);
          } else {
            // Show VA number on our payment page
            paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`;
            console.log('[Simple Checkout] ✅ Xendit VA created:', vaResult.data.account_number);
          }
        } else {
          console.error('[Simple Checkout] ❌ Xendit VA creation failed:', (vaResult as any).error)
          // Fallback to manual payment page
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }
        } catch (vaError: any) {
          console.error('[Simple Checkout] ❌ Xendit VA exception:', vaError.message)
          console.error('[Simple Checkout] ❌ VA Error stack:', vaError.stack)
          // Fallback to manual payment page
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel && paymentMethod === 'ewallet') {
        // Create E-Wallet Payment
        console.log('[Simple Checkout] Creating Xendit E-Wallet payment:', paymentChannel)
        
        try {
          const ewalletResult = await (xenditService as any).createEWalletPayment(
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
          console.log('[Simple Checkout] ✅ Xendit E-Wallet created, checkout URL:', paymentUrl)
        } else {
          console.error('[Simple Checkout] ❌ Xendit E-Wallet creation failed:', ewalletResult.error)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }
        } catch (ewalletError: any) {
          console.error('[Simple Checkout] ❌ E-Wallet exception:', ewalletError.message)
          console.error('[Simple Checkout] ❌ E-Wallet error stack:', ewalletError.stack)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel === 'QRIS' && paymentMethod === 'qris') {
        // Create QRIS Payment
        console.log('[Simple Checkout] Creating Xendit QRIS payment')
        
        try {
          const qrisResult = await xenditService.createQRCode(
            transaction.externalId!,
            amountNum
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
          console.log('[Simple Checkout] ✅ Xendit QRIS created')
        } else {
          console.error('[Simple Checkout] ❌ Xendit QRIS creation failed:', (qrisResult as any).error)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }
        } catch (qrisError: any) {
          console.error('[Simple Checkout] ❌ QRIS exception:', qrisError.message)
          console.error('[Simple Checkout] ❌ QRIS error stack:', qrisError.stack)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else {
        // Default: Manual bank transfer or no specific method
        paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
      }

    } catch (xenditError) {
      console.error('[Simple Checkout] ❌ Xendit error:', xenditError)
      // Fallback to manual payment
      paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
    }

    // Return payment URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    console.log('[Simple Checkout] ENV - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[Simple Checkout] ENV - APP_URL:', process.env.APP_URL)
    console.log('[Simple Checkout] Using appUrl:', appUrl)
    
    if (!paymentUrl) {
      paymentUrl = `${appUrl}/payment/va/${transaction.id}`
    }
    
    console.log('[Simple Checkout] Payment URL:', paymentUrl)
    console.log('[Simple Checkout] END')

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
    console.error('[Simple Checkout] ❌ ===== MAIN ERROR =====')
    console.error('[Simple Checkout] ❌ Error type:', error?.constructor?.name)
    console.error('[Simple Checkout] ❌ Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Simple Checkout] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // Try to extract more details
    if (error && typeof error === 'object') {
      console.error('[Simple Checkout] ❌ Error keys:', Object.keys(error))
      console.error('[Simple Checkout] ❌ Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    }
    
    return NextResponse.json(
      { 
        error: 'Checkout failed',
        message: error instanceof Error ? error.message : 'Gagal membuat transaksi. Silakan coba lagi.',
        errorType: error?.constructor?.name || 'UnknownError',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}