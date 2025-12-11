import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

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
    console.log('[Simple Checkout] START')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('[Simple Checkout] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Simple Checkout] User:', session.user.email)
    
    // CRITICAL: Ensure user exists in database before checkout
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

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
            avatar: session.user.image || null,
            wallet: {
              create: {
                balance: 0,
              },
            },
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

    const body = await request.json()
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
      paymentMethod, // 'bank_transfer', 'ewallet', 'qris'  
      paymentChannel // 'BCA', 'MANDIRI', 'OVO', 'DANA', 'QRIS', etc
    } = body

    // Validate required fields
    if (!name || !email || !whatsapp) {
      console.log('[Simple Checkout] ❌ Missing required fields')
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan nama, email, dan nomor WhatsApp sudah diisi.' },
        { status: 400 }
      )
    }

    // Get plan
    const plan = await prisma.membership.findUnique({
      where: { id: planId, isActive: true }
    })

    if (!plan) {
      console.log('[Simple Checkout] ❌ Plan not found:', planId)
      return NextResponse.json(
        { error: 'Plan not found' },
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
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    console.log('[Simple Checkout] Invoice number:', invoiceNumber)

    // Create transaction with Decimal amount
    let transaction
    try {
      transaction = await prisma.transaction.create({
        data: {
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
      console.log('[Simple Checkout] Transaction created:', transaction.id)
    } catch (createErr) {
      console.error('[Simple Checkout] ❌ Transaction create error:', createErr)
      throw createErr
    }

    // === XENDIT PAYMENT INTEGRATION ===
    let paymentUrl = ''
    let xenditData: any = null

    try {
      if (paymentChannel && paymentMethod === 'bank_transfer') {
        // Create Virtual Account
        console.log('[Simple Checkout] Creating Xendit VA for bank:', paymentChannel)
        
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
            console.log('[Simple Checkout] ⚠️ Using Xendit checkout link:', paymentUrl);
          } else {
            // Show VA number on our payment page
            paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`;
            console.log('[Simple Checkout] ✅ Xendit VA created:', vaResult.data.account_number);
          }
        } else {
          console.error('[Simple Checkout] ❌ Xendit VA creation failed:', vaResult.error)
          // Fallback to manual payment page
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel && paymentMethod === 'ewallet') {
        // Create E-Wallet Payment
        console.log('[Simple Checkout] Creating Xendit E-Wallet payment:', paymentChannel)
        
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
          console.log('[Simple Checkout] ✅ Xendit E-Wallet created, checkout URL:', paymentUrl)
        } else {
          console.error('[Simple Checkout] ❌ Xendit E-Wallet creation failed:', ewalletResult.error)
          paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
        }

      } else if (paymentChannel === 'QRIS' && paymentMethod === 'qris') {
        // Create QRIS Payment
        console.log('[Simple Checkout] Creating Xendit QRIS payment')
        
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
          console.log('[Simple Checkout] ✅ Xendit QRIS created')
        } else {
          console.error('[Simple Checkout] ❌ Xendit QRIS creation failed:', qrisResult.error)
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
    console.error('[Simple Checkout] ❌ MAIN ERROR:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: 'Checkout failed',
        message: 'Gagal membuat transaksi. Silakan coba lagi.'
      },
      { status: 500 }
    )
  }
}