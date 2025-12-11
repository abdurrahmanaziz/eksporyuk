import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    // Fetch transaction with full relations
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            whatsapp: true,
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get payment settings for expiry hours
    const settings = await prisma.settings.findFirst({
      select: {
        paymentExpiryHours: true,
      }
    })
    const paymentExpiryHours = settings?.paymentExpiryHours || 72

    // Extract VA details from metadata
    const metadata = transaction.metadata as any
    
    // Check if we have VA number
    const vaNumber = metadata?.vaNumber || metadata?.accountNumber || metadata?.xenditVANumber
    
    // If VA number is a URL (invoice fallback), redirect to that URL
    if (vaNumber && vaNumber.startsWith('http')) {
      return NextResponse.json({
        redirect: true,
        redirectUrl: vaNumber,
        message: 'VA tidak tersedia, gunakan Xendit checkout',
      })
    }
    
    if (!vaNumber) {
      // Check if there's a paymentUrl fallback
      if (transaction.paymentUrl) {
        return NextResponse.json({
          redirect: true,
          redirectUrl: transaction.paymentUrl,
          message: 'Detail Virtual Account tidak ditemukan, redirect ke halaman pembayaran',
        })
      }
      
      return NextResponse.json(
        { error: 'Detail Virtual Account tidak ditemukan' },
        { status: 400 }
      )
    }

    // Calculate expiry based on settings
    const createdAt = new Date(transaction.createdAt)
    const expiredAt = transaction.expiredAt || new Date(createdAt.getTime() + paymentExpiryHours * 60 * 60 * 1000)

    // Get product/membership name from description or metadata
    let itemName = transaction.description || 'Pembelian'
    let membershipDuration = 0
    
    // For MEMBERSHIP type, get membership name
    if (metadata?.membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: metadata.membershipId },
        select: { name: true, duration: true }
      })
      if (membership) {
        itemName = membership.name
        // Convert enum duration to number (months)
        membershipDuration = convertDurationToMonths(membership.duration)
      }
    }
    
    // For PRODUCT type, get product name from metadata or productId
    if (transaction.type === 'PRODUCT') {
      if (metadata?.productName) {
        itemName = metadata.productName
      } else if (transaction.productId) {
        const product = await prisma.product.findUnique({
          where: { id: transaction.productId },
          select: { name: true }
        })
        if (product) {
          itemName = product.name
        }
      }
    }

    const response = {
      // VA Details
      vaNumber: vaNumber,
      bankCode: metadata?.bankCode || metadata?.xenditBankCode,
      bankName: getBankName(metadata?.bankCode || metadata?.xenditBankCode),
      
      // Amount Details
      amount: Number(transaction.amount),
      originalAmount: Number(transaction.originalAmount || metadata?.originalAmount || transaction.amount),
      discountAmount: Number(transaction.discountAmount || metadata?.discountAmount || 0),
      
      // Invoice Details
      invoiceNumber: transaction.invoiceNumber || transaction.id.slice(0, 8).toUpperCase(),
      transactionId: transaction.id,
      type: transaction.type,
      itemName: itemName,
      membershipDuration: membershipDuration,
      description: transaction.description,
      status: transaction.status,
      
      // Customer Details
      customerName: transaction.customerName || transaction.user?.name || 'Customer',
      customerEmail: transaction.customerEmail || transaction.user?.email || '',
      customerWhatsapp: transaction.customerWhatsapp || transaction.user?.whatsapp || '',
      
      // Time Details
      createdAt: transaction.createdAt.toISOString(),
      expiredAt: expiredAt.toISOString(),
      paymentExpiryHours: paymentExpiryHours,
      
      // Coupon Details
      coupon: transaction.coupon ? {
        code: transaction.coupon.code,
        discountType: transaction.coupon.discountType,
        discountValue: Number(transaction.coupon.discountValue),
      } : null,
      
      // Payment Method
      paymentMethod: transaction.paymentMethod,
      paymentChannelName: metadata?.paymentChannelName || getBankName(metadata?.bankCode || metadata?.xenditBankCode),
      
      // Flags
      isFallback: metadata?.xenditFallback || false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[VA Details API] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat detail pembayaran' },
      { status: 500 }
    )
  }
}

function getBankName(bankCode: string): string {
  if (!bankCode) return 'Virtual Account'
  
  const bankNames: Record<string, string> = {
    BCA: 'Bank Central Asia (BCA)',
    MANDIRI: 'Bank Mandiri',
    BNI: 'Bank Negara Indonesia (BNI)',
    BRI: 'Bank Rakyat Indonesia (BRI)',
    PERMATA: 'Bank Permata',
    BSI: 'Bank Syariah Indonesia (BSI)',
    CIMB: 'Bank CIMB Niaga',
    SAHABAT_SAMPOERNA: 'Bank Sahabat Sampoerna',
    BJB: 'Bank BJB',
  }
  return bankNames[bankCode] || bankCode
}

// Convert MembershipDuration enum to number of months
function convertDurationToMonths(duration: string | null | undefined): number {
  if (!duration) return 0
  
  const durationMap: Record<string, number> = {
    'ONE_MONTH': 1,
    'THREE_MONTHS': 3,
    'SIX_MONTHS': 6,
    'TWELVE_MONTHS': 12,
    'LIFETIME': 999, // Selamanya
  }
  
  return durationMap[duration] || 0
}
