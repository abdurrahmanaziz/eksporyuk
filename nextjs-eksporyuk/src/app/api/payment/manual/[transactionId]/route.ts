import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const metadata = transaction.metadata as any
    
    // CHECK: If this should be automated payment (VA/E-wallet), create Xendit invoice instead
    const paymentMethodType = metadata?.paymentMethodType
    const paymentChannel = metadata?.paymentChannel
    
    // If it's bank_transfer with specific channel (BCA, BRI, etc) and no Xendit reference,
    // this should go through Xendit invoice flow, not manual
    if (paymentMethodType === 'bank_transfer' && 
        paymentChannel && 
        paymentChannel !== 'manual' && 
        !transaction.reference) {
      
      console.log(`🔄 [Manual Payment API] Transaction ${transactionId} should use Xendit, creating invoice...`)
      
      try {
        const { xenditProxy } = await import('@/lib/xendit-proxy')
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { name: true, email: true, phone: true }
        })
        
        if (!user) {
          console.error('[Manual Payment API] User not found for transaction')
        } else {
          // Create Xendit invoice
          const invoiceData = await xenditProxy.createInvoice({
            external_id: transaction.id,
            payer_email: user.email,
            description: transaction.description || 'Payment',
            amount: Number(transaction.amount),
            currency: 'IDR',
            invoice_duration: 24 * 3600, // 24 hours
            customer: {
              given_names: user.name || 'Customer',
              email: user.email,
              mobile_number: user.phone || '',
            },
            // Add payment method hint
            payment_methods: [`BANK_${paymentChannel}`],
          })

          if (invoiceData?.invoice_url) {
            // Update transaction with Xendit details
            await prisma.transaction.update({
              where: { id: transactionId },
              data: {
                reference: invoiceData.id,
                paymentUrl: invoiceData.invoice_url,
                paymentProvider: 'XENDIT',
                paymentMethod: `INVOICE_${paymentChannel}`,
                metadata: {
                  ...metadata,
                  xenditInvoiceId: invoiceData.id,
                  xenditInvoiceUrl: invoiceData.invoice_url,
                  redirectedFromManual: true
                }
              }
            })
            
            console.log(`✅ [Manual Payment API] Created Xendit invoice for ${transactionId}: ${invoiceData.invoice_url}`)
            
            // Return redirect instruction
            return NextResponse.json({
              shouldRedirectToXendit: true,
              xenditUrl: invoiceData.invoice_url,
              transactionId: transactionId,
              message: 'Redirecting to Xendit payment...'
            })
          }
        }
      } catch (xenditError) {
        console.error('[Manual Payment API] Failed to create Xendit invoice:', xenditError)
        // Fall through to manual payment
      }
    }

    // Get user data manually
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId },
      select: {
        name: true,
        email: true,
        whatsapp: true,
        phone: true
      }
    })

    // Get membership/product data if applicable
    let membership = null
    let product = null
    let coupon = null
    
    if (metadata?.membershipId) {
      membership = await prisma.membership.findUnique({
        where: { id: metadata.membershipId },
        select: { name: true, duration: true }
      })
    }
    
    if (metadata?.productId) {
      product = await prisma.product.findUnique({
        where: { id: metadata.productId },
        select: { name: true }
      })
    }
    
    if (transaction.couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: transaction.couponId },
        select: {
          code: true,
          discountType: true,
          discountValue: true
        }
      })
    }

    // Get manual bank accounts from payment methods
    const paymentMethodsConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'payment_methods' }
    })

    let bankAccounts: any[] = []
    if (paymentMethodsConfig?.config) {
      const config = paymentMethodsConfig.config as any
      if (config.manual?.bankAccounts) {
        bankAccounts = config.manual.bankAccounts.filter((acc: any) => acc.isActive)
      }
    }

    // If no bank accounts from config, use default
    if (bankAccounts.length === 0) {
      bankAccounts = [
        {
          id: 'default-bca',
          bankName: 'BCA',
          bankCode: 'BCA',
          accountNumber: '1234567890',
          accountName: 'PT Ekspor Yuk Indonesia',
          isActive: true
        }
      ]
    }

    // Get settings for expiry
    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    const paymentExpiryHours = settings?.paymentExpiryHours || 72

    // Calculate amounts
    const originalAmount = metadata?.originalAmount || transaction.amount
    const discountAmount = metadata?.discountAmount || 0

    // Get item name
    let itemName = 'Unknown Product'
    if (membership) {
      itemName = membership.name
    } else if (product) {
      itemName = product.name
    } else if (metadata?.itemName) {
      itemName = metadata.itemName
    }

    // Get selected bank code from metadata
    const selectedBankCode = metadata?.manualBankCode || metadata?.paymentChannel || bankAccounts[0]?.bankCode

    return NextResponse.json({
      transactionId: transaction.id,
      invoiceNumber: transaction.invoiceNumber || `INV-${transaction.id.slice(0, 8).toUpperCase()}`,
      amount: Number(transaction.amount),
      originalAmount: Number(originalAmount),
      discountAmount: Number(discountAmount),
      status: transaction.status,
      type: transaction.type,
      itemName,
      description: transaction.description || '',
      
      // Customer Details
      customerName: user?.name || metadata?.customerName || 'Customer',
      customerEmail: user?.email || metadata?.customerEmail || '',
      customerWhatsapp: user?.whatsapp || user?.phone || metadata?.customerWhatsapp || '',
      
      // Time Details
      createdAt: transaction.createdAt.toISOString(),
      expiredAt: transaction.expiredAt?.toISOString() || new Date(Date.now() + paymentExpiryHours * 60 * 60 * 1000).toISOString(),
      paymentExpiryHours,
      
      // Coupon Details
      coupon: coupon ? {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue)
      } : null,
      
      // Bank Accounts
      bankAccounts,
      selectedBankCode
    })

  } catch (error) {
    console.error('Error fetching manual payment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}
