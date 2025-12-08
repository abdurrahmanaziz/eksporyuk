import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's products with full product details
    const userProducts = await prisma.userProduct.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        product: true,
        transaction: {
          select: {
            id: true,
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })
    
    // Get target membership for upsell
    const membershipIds = userProducts
      .map(up => up.product.upsaleTargetMemberships)
      .filter(Boolean) as string[]
    
    const targetMemberships = membershipIds.length > 0 
      ? await prisma.membership.findMany({
          where: { id: { in: membershipIds } },
          select: { id: true, name: true, slug: true, price: true }
        })
      : []
    
    // Check user's current membership
    const userMembership = await prisma.userMembership.findFirst({
      where: { 
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        membership: { select: { id: true, name: true } }
      }
    })

    // Format response with nested relationships
    const formattedProducts = userProducts.map(up => {
      // Find target membership for this product
      const targetMembership = targetMemberships.find(
        m => m.id === up.product.upsaleTargetMemberships
      )
      
      return {
        id: up.id,
        userId: up.userId,
        productId: up.productId,
        transactionId: up.transactionId,
        purchaseDate: up.purchaseDate,
        price: up.price,
        product: {
          id: up.product.id,
          name: up.product.name,
          slug: up.product.slug,
          checkoutSlug: up.product.checkoutSlug,
          description: up.product.description || '',
          shortDescription: up.product.shortDescription || '',
          thumbnail: up.product.thumbnail || '',
          productType: up.product.productType,
          price: Number(up.product.price),
          
          // Event fields
          eventDate: up.product.eventDate,
          eventEndDate: up.product.eventEndDate,
          eventUrl: up.product.eventUrl,
          meetingId: up.product.meetingId,
          meetingPassword: up.product.meetingPassword,
          eventVisibility: up.product.eventVisibility,
          
          // Upsell membership
          targetMembership: targetMembership || null,
          upsaleMessage: up.product.upsaleMessage,
          upsaleDiscount: up.product.upsaleDiscount,
          
          // Files
          downloadableFiles: up.product.downloadableFiles ? 
            (typeof up.product.downloadableFiles === 'string' ? 
              JSON.parse(up.product.downloadableFiles) : 
              up.product.downloadableFiles
            ) : []
        }
      }
    })

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      userMembership: userMembership ? {
        id: userMembership.id,
        membershipId: userMembership.membershipId,
        membershipName: userMembership.membership.name
      } : null
    })

  } catch (error) {
    console.error('[API User Products] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
