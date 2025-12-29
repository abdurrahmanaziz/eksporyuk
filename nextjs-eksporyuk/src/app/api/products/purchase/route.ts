import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditProxy } from '@/lib/xendit-proxy'
import { validatePaymentAmount } from '@/lib/payment-methods'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/products/purchase
 * Create product purchase transaction
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      productId,
      customerName,
      customerEmail,
      customerPhone,
      couponCode,
      affiliateRef
    } = body

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productCourses: {
          include: {
            course: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check stock
    if (product.stock !== null && product.stock <= 0) {
      return NextResponse.json(
        { error: 'Product out of stock' },
        { status: 400 }
      )
    }

    // Check max participants (for events)
    if (product.maxParticipants) {
      const currentParticipants = await prisma.userProduct.count({
        where: { productId }
      })
      
      if (currentParticipants >= product.maxParticipants) {
        return NextResponse.json(
          { error: 'Event is full' },
          { status: 400 }
        )
      }
    }

    // Calculate price
    let finalPrice = Number(product.discountPrice || product.price)
    let appliedCoupon = null

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          expiresAt: {
            gte: new Date()
          }
        }
      })

      if (coupon) {
        // Check if coupon is valid for this product
        const couponProducts = coupon.applicableProducts as string[] || []
        if (couponProducts.length === 0 || couponProducts.includes(productId)) {
          if (coupon.discountType === 'PERCENTAGE') {
            finalPrice = finalPrice * (1 - Number(coupon.discountValue) / 100)
          } else {
            finalPrice = finalPrice - Number(coupon.discountValue)
          }
          appliedCoupon = coupon
        }
      }
    }

    finalPrice = Math.max(0, finalPrice)

    // Get or create user
    let userId = session?.user?.id

    if (!userId) {
      // User will be created via registration in checkout
      // For now, create a pending transaction with customer info
    } else {
      // Check if user already purchased this product
      const existingPurchase = await prisma.userProduct.findFirst({
        where: {
          userId,
          productId
        }
      })

      if (existingPurchase) {
        return NextResponse.json(
          { error: 'You already own this product' },
          { status: 400 }
        )
      }
    }

    // Find affiliate link if ref provided
    let affiliateLinkId = null
    if (affiliateRef) {
      const affiliateLink = await prisma.affiliateLink.findFirst({
        where: {
          OR: [
            { slug: affiliateRef },
            { code: affiliateRef }
          ],
          targetId: productId,
          targetType: 'PRODUCT'
        }
      })
      
      if (affiliateLink) {
        affiliateLinkId = affiliateLink.id
        
        // Increment click if not yet tracked
        await prisma.affiliateLink.update({
          where: { id: affiliateLink.id },
          data: {
            clicks: {
              increment: 1
            }
          }
        })
      }
    }

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId || 'pending', // Will be updated after registration
        type: 'PRODUCT_PURCHASE',
        amount: finalPrice,
        status: 'PENDING',
        invoiceNumber,
        productId,
        couponId: appliedCoupon?.id,
        affiliateLinkId,
        customerName,
        customerEmail,
        customerPhone,
        description: `Pembelian ${product.name}`,
        metadata: {
          productName: product.name,
          productType: product.type,
          originalPrice: Number(product.price),
          discountPrice: Number(product.discountPrice || product.price),
          finalPrice,
          couponApplied: appliedCoupon?.code
        }
      }
    })

    // Create Xendit invoice
    const invoice = await xenditProxy.createInvoice({
      external_id: transaction.id,
      amount: finalPrice,
      description: `${product.name}`,
      customer: {
        given_names: customerName || session?.user?.name || 'Guest',
        email: customerEmail || session?.user?.email || '',
        mobile_number: customerPhone || session?.user?.phone || ''
      }
    })

    // Update transaction with Xendit info
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        externalId: invoice.id,
        paymentUrl: invoice.invoice_url,
        metadata: {
          ...(transaction.metadata as any),
          xenditInvoiceId: invoice.id,
          xenditInvoiceUrl: invoice.invoice_url
        }
      }
    })

    // Update product stock
    if (product.stock !== null) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: 1
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: finalPrice,
        status: transaction.status
      },
      paymentUrl: invoice.invoice_url
    })

  } catch (error) {
    console.error('[PRODUCT PURCHASE ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create product purchase' },
      { status: 500 }
    )
  }
}
