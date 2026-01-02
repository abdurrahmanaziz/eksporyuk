import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'
import { randomBytes } from 'crypto'

import { generateTransactionId, getCurrentTimestamp } from '@/lib/transaction-helper'
import { notificationService } from '@/lib/services/notificationService'
import { mailketingService } from '@/lib/services/mailketingService'

// Helper to generate unique ID
const createId = () => randomBytes(12).toString('hex')

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
      paymentChannel = 'BCA', // Default to BCA
      affiliateCode // Affiliate code from cookie
    } = body

    console.log('[Simple Checkout] Parsed values:', {
      planId,
      name,
      email,
      whatsapp,
      paymentMethod,
      paymentChannel,
      finalPrice,
      affiliateCode
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

    // Get payment expiry settings from database BEFORE creating transaction
    const globalSettings = await prisma.settings.findFirst({
      select: {
        paymentExpiryHours: true,
        paymentUniqueCodeEnabled: true,
        paymentUniqueCodeType: true,
        paymentUniqueCodeMin: true,
        paymentUniqueCodeMax: true,
      }
    })
    const paymentExpiryHours = globalSettings?.paymentExpiryHours || 72 // Default 72 hours (3 days)
    const paymentExpiryMs = paymentExpiryHours * 60 * 60 * 1000
    const paymentExpirySeconds = paymentExpiryHours * 60 * 60
    
    console.log('[Simple Checkout] Payment expiry hours:', paymentExpiryHours)

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

    // Lookup affiliate from code
    let affiliateId: string | null = null
    let affiliateName: string | null = null
    let affiliateCommissionRate = plan.affiliateCommissionRate || 0
    
    if (affiliateCode) {
      console.log('[Simple Checkout] Looking up affiliate with code:', affiliateCode)
      try {
        // First try to find by AffiliateLink.code (e.g., "abdurrahmanaziz-CWM3HN")
        const affiliateLink = await prisma.affiliateLink.findFirst({
          where: { code: affiliateCode },
          include: { user: { select: { id: true, name: true, email: true } } }
        })
        
        if (affiliateLink?.user) {
          affiliateId = affiliateLink.user.id
          affiliateName = affiliateLink.user.name
          console.log('[Simple Checkout] ✅ Affiliate found from AffiliateLink:', affiliateName, affiliateId)
        } else {
          // Fallback: try to find by username
          const affiliateUser = await prisma.user.findFirst({
            where: { 
              username: affiliateCode,
              role: { in: ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER', 'MENTOR'] }
            },
            select: { id: true, name: true, email: true }
          })
          
          if (affiliateUser) {
            affiliateId = affiliateUser.id
            affiliateName = affiliateUser.name
            console.log('[Simple Checkout] ✅ Affiliate found from username:', affiliateName, affiliateId)
          } else {
            console.log('[Simple Checkout] ⚠️ Affiliate not found for code:', affiliateCode)
          }
        }
      } catch (affErr) {
        console.error('[Simple Checkout] ⚠️ Error looking up affiliate:', affErr)
      }
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
        affiliateId,
        affiliateName,
      })
      
      // Calculate affiliate commission for metadata
      const affiliateCommission = affiliateId && affiliateCommissionRate > 0 
        ? Math.round(amountNum * affiliateCommissionRate / 100)
        : 0
      
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
          affiliateId: affiliateId, // Store affiliate ID directly on transaction
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
            expiryHours: paymentExpiryHours, // Use dynamic expiry from settings
            // Affiliate data in metadata for reference
            affiliateId: affiliateId,
            affiliateName: affiliateName,
            affiliateCode: affiliateCode,
            affiliateCommissionRate: affiliateCommissionRate,
            affiliateCommission: affiliateCommission
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
      
      // Generate unique code if enabled
      let uniqueCode = 0
      let finalAmount = amountNum
      
      if (globalSettings?.paymentUniqueCodeEnabled) {
        const min = globalSettings.paymentUniqueCodeMin || 1
        const max = globalSettings.paymentUniqueCodeMax || 999
        uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min
        
        if (globalSettings.paymentUniqueCodeType === 'subtract') {
          finalAmount = amountNum - uniqueCode
        } else {
          finalAmount = amountNum + uniqueCode
        }
        
        console.log(`[Simple Checkout] Unique code generated: ${uniqueCode}, Final amount: ${finalAmount}`)
      }
      
      // Update transaction for manual payment with unique code
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          amount: finalAmount,
          paymentProvider: 'MANUAL',
          paymentMethod: 'MANUAL_TRANSFER',
          paymentUrl: `${appUrl}/payment/manual/${transaction.id}`,
          expiredAt: new Date(Date.now() + paymentExpiryMs),
          metadata: {
            ...(transaction.metadata as any),
            paymentType: 'manual',
            manualBankCode: paymentChannel,
            uniqueCode: uniqueCode,
            uniqueCodeType: globalSettings?.paymentUniqueCodeType || 'add',
            originalAmountBeforeUniqueCode: amountNum,
            paymentExpiryHours: paymentExpiryHours,
          }
        }
      })

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        paymentUrl: `${appUrl}/payment/manual/${transaction.id}`,
        amount: finalAmount,
        originalAmount: amountNum,
        uniqueCode: uniqueCode,
        invoiceNumber: invoiceNumber,
        paymentType: 'manual'
      })
    }

    // === BANK TRANSFER (VA) - Use PaymentRequest API for direct VA number ===
    if (paymentMethod === 'bank_transfer' && paymentChannel) {
      console.log('[Simple Checkout] Creating Virtual Account for bank:', paymentChannel)
      
      try {
        const vaResult = await xenditService.createVirtualAccount({
          externalId: transaction.externalId!,
          bankCode: paymentChannel, // BCA, MANDIRI, BNI, BRI, PERMATA, BSI
          name: name || session.user.name || 'Customer',
          amount: amountNum,
          isSingleUse: true,
          expirationDate: new Date(Date.now() + paymentExpiryMs) // Use dynamic expiry
        })

        console.log('[Simple Checkout] VA Result:', JSON.stringify(vaResult, null, 2))

        if (!vaResult || !vaResult.success) {
          throw new Error('Gagal membuat Virtual Account (Empty response)')
        }

        // Extract data from nested response { success: true, data: {...} }
        const vaData = vaResult.data
        const vaNumber = vaData.account_number
        const isInvoiceFallback = vaNumber && vaNumber.startsWith('http')

        // Prepare metadata
        const existingMetadata = typeof transaction.metadata === 'object' && transaction.metadata !== null 
          ? transaction.metadata 
          : {}

        // Update transaction with VA details
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: vaData.id,
            externalId: vaData.external_id || transaction.externalId,
            paymentProvider: 'XENDIT',
            paymentMethod: `VA_${paymentChannel}`,
            paymentUrl: isInvoiceFallback ? vaNumber : `${appUrl}/payment/va/${transaction.id}`,
            expiredAt: vaData.expiration_date ? new Date(vaData.expiration_date) : new Date(Date.now() + paymentExpiryMs),
            metadata: {
              ...(existingMetadata as any),
              vaNumber: vaNumber,
              bankCode: paymentChannel,
              bankName: getPaymentChannelName(paymentChannel),
              accountNumber: vaNumber,
              vaId: vaData.id,
              xenditVANumber: vaNumber,
              xenditBankCode: paymentChannel,
              xenditPaymentMethod: 'VIRTUAL_ACCOUNT',
            }
          }
        })

        // If VA number is actually an invoice URL (fallback), redirect there
        if (isInvoiceFallback) {
          paymentUrl = vaNumber
        } else {
          // Otherwise, redirect to our custom VA page
          paymentUrl = `${appUrl}/payment/va/${transaction.id}`
        }

        console.log('[Simple Checkout] ✅ VA Created:', {
          vaNumber: vaNumber,
          bank: paymentChannel,
          redirectUrl: paymentUrl,
          isFallback: isInvoiceFallback
        })

        return NextResponse.json({
          success: true,
          transactionId: transaction.id,
          paymentUrl: paymentUrl,
          amount: amountNum,
          invoiceNumber: invoiceNumber,
          paymentType: 'virtual_account',
          vaNumber: isInvoiceFallback ? null : vaNumber,
          bankCode: paymentChannel,
          bankName: getPaymentChannelName(paymentChannel)
        })

      } catch (vaError: any) {
        console.error('[Simple Checkout] VA creation failed:', vaError.message)
        console.log('[Simple Checkout] Falling back to Invoice...')
        // Fall through to Invoice creation as fallback
      }
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
        invoice_duration: paymentExpirySeconds, // Use dynamic expiry from settings
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
            expiredAt: invoice.expiryDate ? new Date(invoice.expiryDate) : new Date(Date.now() + paymentExpiryMs),
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

    // === SEND NOTIFICATIONS ===
    // Send welcome + payment pending notifications
    try {
      const userName = name || session.user.name || 'Member'
      const userEmail = email || session.user.email || ''
      
      // 1. In-App & Push Notification via Pusher/OneSignal
      await notificationService.send({
        userId: session.user.id,
        type: 'TRANSACTION',
        title: '🎉 Pesanan Berhasil Dibuat!',
        message: `Hai ${userName}, pesanan ${plan.name} sudah dibuat. Segera selesaikan pembayaran sebelum kadaluarsa.`,
        link: paymentUrl,
        transactionId: transaction.id,
        channels: ['pusher', 'onesignal'],
        metadata: {
          invoiceNumber,
          amount: amountNum,
          planName: plan.name,
        }
      })
      
      // 2. Email Notification - Payment Pending
      if (userEmail) {
        const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
        
        await mailketingService.sendEmail({
          to: userEmail,
          subject: `[EksporYuk] Pesanan #${invoiceNumber} - Menunggu Pembayaran`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Pesanan Berhasil Dibuat!</h1>
              </div>
              <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151;">Hai <strong>${userName}</strong>,</p>
                <p style="color: #6b7280;">Terima kasih sudah mendaftar di EksporYuk! Pesanan Anda sudah berhasil dibuat.</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px; color: #111827;">Detail Pesanan:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #6b7280;">No. Invoice</td><td style="text-align: right; font-weight: bold;">${invoiceNumber}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6b7280;">Produk</td><td style="text-align: right; font-weight: bold;">${plan.name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6b7280;">Total Bayar</td><td style="text-align: right; font-weight: bold; color: #059669;">${formatCurrency(amountNum)}</td></tr>
                  </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentUrl}" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Bayar Sekarang</a>
                </div>
                
                <p style="color: #ef4444; font-size: 14px; text-align: center;">⚠️ Selesaikan pembayaran dalam 72 jam sebelum kadaluarsa</p>
              </div>
              <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p>EksporYuk - Platform Pembelajaran Ekspor #1 Indonesia</p>
              </div>
            </div>
          `
        })
      }
      
      console.log('[Simple Checkout] ✅ Notifications sent successfully')
    } catch (notifError) {
      // Don't fail checkout if notification fails
      console.error('[Simple Checkout] ⚠️ Notification error (non-blocking):', notifError)
    }

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