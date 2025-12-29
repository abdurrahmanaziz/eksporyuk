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
      where: { id: transactionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            whatsapp: true,
            phone: true
          }
        },
        membership: {
          select: {
            name: true,
            duration: true
          }
        },
        product: {
          select: {
            name: true
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
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
    const metadata = transaction.metadata as any
    const originalAmount = metadata?.originalAmount || transaction.amount
    const discountAmount = metadata?.discountAmount || 0

    // Get item name
    let itemName = 'Unknown Product'
    if (transaction.membership) {
      itemName = transaction.membership.name
    } else if (transaction.product) {
      itemName = transaction.product.name
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
      customerName: transaction.user?.name || metadata?.customerName || 'Customer',
      customerEmail: transaction.user?.email || metadata?.customerEmail || '',
      customerWhatsapp: transaction.user?.whatsapp || transaction.user?.phone || metadata?.customerWhatsapp || '',
      
      // Time Details
      createdAt: transaction.createdAt.toISOString(),
      expiredAt: transaction.expiredAt?.toISOString() || new Date(Date.now() + paymentExpiryHours * 60 * 60 * 1000).toISOString(),
      paymentExpiryHours,
      
      // Coupon Details
      coupon: transaction.coupon ? {
        code: transaction.coupon.code,
        discountType: transaction.coupon.discountType,
        discountValue: Number(transaction.coupon.discountValue)
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
