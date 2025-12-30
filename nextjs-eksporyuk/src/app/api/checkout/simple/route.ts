import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

import { generateTransactionId, getCurrentTimestamp } from '@/lib/transaction-helper'

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
          id: generateTransactionId(),
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
          updatedAt: getCurrentTimestamp(),
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

    // === PAYMENT INTEGRATION ===
    let paymentUrl = ''
    let xenditData: any = null
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://eksporyuk.com'

    // === MANUAL PAYMENT - Skip Xendit, redirect to manual payment page ===
    if (paymentMethod === 'manual') {
      console.log('[Simple Checkout] Manual payment selected - skipping Xendit')
      
      // Update transaction for manual payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentProvider: 'MANUAL',
          paymentMethod: 'MANUAL_TRANSFER',
          paymentUrl: `${appUrl}/payment/manual/${transaction.id}`,
          metadata: {
            ...(transaction.metadata as any),
            paymentType: 'manual',
            manualBankCode: paymentChannel,
          }
        }
      })

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        paymentUrl: `${appUrl}/payment/manual/${transaction.id}`,
        amount: amountNum,
        invoiceNumber: invoiceNumber,
        paymentType: 'manual'
      })
    }

    // === XENDIT PAYMENT - Create Invoice for redirect to Xendit checkout ===
    try {
      console.log('[Simple Checkout] Creating Xendit Invoice for redirect...')
      console.log('[Simple Checkout] APP_URL:', process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'NOT SET')
      
      // Create Xendit Invoice - this will redirect to Xendit checkout page
      const invoice = await xenditService.createInvoice({
        external_id: transaction.externalId!,
        amount: amountNum,
        payer_email: email || session.user.email || 'customer@eksporyuk.com',
        description: `Membership: ${plan.name} - ${priceOption?.label || ''}`,
        invoice_duration: 72 * 3600, // 72 hours in seconds
        currency: 'IDR',
        customer: {
          given_names: name || session.user.name || 'Customer',
          email: email || session.user.email || '',
          mobile_number: whatsapp || phone || ''
        },
        success_redirect_url: `${appUrl}/checkout/success?transaction_id=${transaction.id}`,
        failure_redirect_url: `${appUrl}/checkout/failed?transaction_id=${transaction.id}`
      })


      console.log('[Simple Checkout] Invoice response:', invoice);
      if (invoice && invoice.invoiceUrl) {
        xenditData = invoice;
        paymentUrl = invoice.invoiceUrl;
        
        // Prepare metadata - ensure it's an object
        const existingMetadata = typeof transaction.metadata === 'object' && transaction.metadata !== null 
          ? transaction.metadata 
          : {};
        
        // Update transaction with Xendit invoice info
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: invoice.id,
            paymentProvider: 'XENDIT',
            paymentMethod: 'INVOICE',
            paymentUrl: invoice.invoiceUrl,
            expiredAt: invoice.expiryDate ? new Date(invoice.expiryDate) : new Date(Date.now() + 72 * 60 * 60 * 1000),
            metadata: {
              ...(existingMetadata as any),
              xenditInvoiceId: invoice.id,
              xenditInvoiceUrl: invoice.invoiceUrl,
              xenditExternalId: invoice.externalId,
              xenditExpiry: invoice.expiryDate,
              preferredPaymentMethod: paymentMethod,
              preferredPaymentChannel: paymentChannel,
            }
          }
        });
        console.log('[Simple Checkout] ✅ Xendit Invoice created:', invoice.id);
        console.log('[Simple Checkout] ✅ Payment URL:', invoice.invoiceUrl);
      } else {
        console.error('[Simple Checkout] ❌ Invoice object:', JSON.stringify(invoice, null, 2));
        throw new Error('Xendit Invoice creation failed - no invoiceUrl in response');
      }

    } catch (xenditError: any) {
      console.error('[Simple Checkout] ❌ Xendit Invoice error:', xenditError.message)
      console.error('[Simple Checkout] ❌ Error stack:', xenditError.stack)
      
      // Delete transaction if Xendit fails
      await prisma.transaction.delete({ where: { id: transaction.id } })
      
      return NextResponse.json(
        { error: 'Gagal membuat invoice pembayaran Xendit', details: xenditError.message },
        { status: 500 }
      )
    }

    // Return payment URL
    console.log('[Simple Checkout] ENV - NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[Simple Checkout] ENV - APP_URL:', process.env.APP_URL)
    console.log('[Simple Checkout] Using appUrl:', appUrl)
    
    if (!paymentUrl) {
      throw new Error('Payment URL not generated')
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