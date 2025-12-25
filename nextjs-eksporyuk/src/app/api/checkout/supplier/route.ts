import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'
import { xenditService } from '@/lib/xendit'
import { getNextInvoiceNumber } from '@/lib/invoice-generator'
import { validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const { 
      packageId, 
      name, 
      email, 
      phone, 
      whatsapp,
      couponCode 
    } = body

    // Validate required fields
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    let userId = session?.user?.id

    // If not logged in, check if user exists by email
    if (!userId && email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'Email already registered. Please login first.',
          requireLogin: true
        }, { status: 400 })
      }
    }

    // Get package details
    const supplierPackage = await prisma.supplierPackage.findUnique({
      where: { id: packageId }
    })

    if (!supplierPackage || !supplierPackage.isActive) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
    }

    let finalAmount = Number(supplierPackage.price)
    let discount = 0
    let couponId: string | undefined
    let affiliateId: string | undefined

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      })

      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = finalAmount * (Number(coupon.discountValue) / 100)
        } else {
          discount = Number(coupon.discountValue)
        }
        finalAmount -= discount
        couponId = coupon.id
      }
    }

    // Check affiliate from cookies if no coupon
    if (!affiliateId) {
      const cookies = request.cookies
      const affiliateCookie = cookies.get('affiliate_id')
      if (affiliateCookie) {
        affiliateId = affiliateCookie.value
      }
    }

    // Get invoice number
    const invoiceNumber = await getNextInvoiceNumber()

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId || 'guest',
        amount: finalAmount,
        type: 'SUPPLIER_MEMBERSHIP' as any,
        status: 'PENDING',
        invoiceNumber,
        description: `Supplier Membership: ${supplierPackage.name}`,
        externalId: `SUPP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          packageId: supplierPackage.id,
          packageName: supplierPackage.name,
          originalPrice: Number(supplierPackage.price),
          discount,
          couponCode: couponCode || null,
          couponId: couponId || null,
          affiliateId: affiliateId || null,
          customerName: name || session?.user?.name,
          customerEmail: email || session?.user?.email,
          customerPhone: phone || whatsapp
        }
      }
    })

    // Get payment settings
    const settings = await prisma.settings.findFirst()
    const expiryHours = settings?.paymentExpiryHours || 72

    // Create Xendit invoice
    let paymentUrl = ''
    
    try {
      const invoiceResult = await xenditService.createInvoice({
        external_id: transaction.externalId!,
        amount: finalAmount,
        payer_email: email || session?.user?.email || '',
        description: `Supplier Membership: ${supplierPackage.name}`,
        invoice_duration: expiryHours * 3600,
        currency: 'IDR',
        customer: {
          given_names: name || session?.user?.name || '',
          email: email || session?.user?.email || '',
          mobile_number: whatsapp || phone || ''
        }
      })

      if (invoiceResult && (invoiceResult as any).invoice_url) {
        paymentUrl = (invoiceResult as any).invoice_url
        
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paymentUrl: paymentUrl,
            reference: (invoiceResult as any).id,
            expiredAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000)
          }
        })
      }
    } catch (xenditError) {
      console.error('[Supplier Checkout] Xendit error:', xenditError)
      // Continue with manual payment
      paymentUrl = `/payment/va/${transaction.id}`
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentUrl: paymentUrl || `/payment/va/${transaction.id}`,
      amount: finalAmount,
      invoiceNumber,
      packageName: supplierPackage.name
    })

  } catch (error) {
    console.error('[Supplier Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
