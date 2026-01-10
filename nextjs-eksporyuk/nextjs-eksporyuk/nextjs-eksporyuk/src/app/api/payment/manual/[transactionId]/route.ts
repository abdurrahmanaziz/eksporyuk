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
    
    console.log(`🔍 [Manual Payment API] Checking auto-redirect for ${transactionId}:`, {
      paymentMethodType,
      paymentChannel,
      hasReference: !!transaction.reference,
      shouldRedirect: paymentMethodType === 'bank_transfer' && 
                     paymentChannel && 
                     paymentChannel !== 'manual' && 
                     !transaction.reference
    })
    
    // If it's bank_transfer with specific channel (BCA, BRI, etc) and no Xendit reference,
    // this should go through Xendit invoice flow, not manual
    if (paymentMethodType === 'bank_transfer' && 
        paymentChannel && 
        paymentChannel !== 'manual' && 
        !transaction.reference) {
      
      console.log(`🔄 [Manual Payment API] Transaction ${transactionId} should use Xendit, creating invoice...`)
      
      try {
        const { xenditService } = await import('@/lib/xendit')
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { name: true, email: true, phone: true }
        })
        
        if (!user) {
          console.error('[Manual Payment API] User not found for transaction')
        } else {
          // Create Xendit invoice
          const invoiceData = await xenditService.createInvoice({
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
        console.error('[Manual Payment API] Failed to create Xendit invoice:', {
          transactionId,
          error: xenditError.message,
          stack: xenditError.stack,
          response: xenditError.response?.data
        })
        
        // Return debug info in development
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            error: 'Xendit invoice creation failed',
            details: xenditError.message,
            transactionId,
            shouldRedirect: false
          }, { status: 500 })
        }
        
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

    // Get settings including bank accounts and contact info
    const settings = await prisma.settings.findFirst({
      select: {
        paymentBankAccounts: true,
        paymentExpiryHours: true,
        paymentContactWhatsapp: true,
        paymentContactEmail: true,
        paymentContactPhone: true,
        paymentContactName: true,
      }
    })
    const paymentExpiryHours = settings?.paymentExpiryHours || 72

    // Get bank accounts from settings
    let bankAccounts: any[] = []
    if (settings?.paymentBankAccounts) {
      const accounts = typeof settings.paymentBankAccounts === 'string' 
        ? JSON.parse(settings.paymentBankAccounts)
        : settings.paymentBankAccounts
      
      if (Array.isArray(accounts)) {
        bankAccounts = accounts.filter((acc: any) => acc.isActive)
      }
    }

    // If no bank accounts from settings, try legacy config
    if (bankAccounts.length === 0) {
      const paymentMethodsConfig = await prisma.integrationConfig.findFirst({
        where: { service: 'payment_methods' }
      })

      if (paymentMethodsConfig?.config) {
        const config = paymentMethodsConfig.config as any
        if (config.manual?.bankAccounts) {
          bankAccounts = config.manual.bankAccounts.filter((acc: any) => acc.isActive)
        }
      }
    }

    // If still no bank accounts, show warning (no default dummy data)
    if (bankAccounts.length === 0) {
      console.warn('[Manual Payment API] No bank accounts configured!')
    }

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

    // Build contact info
    const contactInfo = {
      name: settings?.paymentContactName || 'Customer Service',
      whatsapp: settings?.paymentContactWhatsapp || null,
      email: settings?.paymentContactEmail || null,
      phone: settings?.paymentContactPhone || null,
    }
    
    // Extract unique code from metadata
    const uniqueCode = metadata?.uniqueCode || 0
    const uniqueCodeType = metadata?.uniqueCodeType || 'add'
    const originalAmountBeforeUniqueCode = metadata?.originalAmountBeforeUniqueCode || Number(transaction.amount)

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
      
      // Unique Code
      uniqueCode,
      uniqueCodeType,
      originalAmountBeforeUniqueCode,
      
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
      selectedBankCode,
      
      // Contact Info for confirmation
      contactInfo
    })

  } catch (error) {
    console.error('Error fetching manual payment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}
