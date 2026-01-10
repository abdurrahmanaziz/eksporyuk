import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's products with product details
    const userProducts = await prisma.userProduct.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        purchaseDate: 'desc'
      },
      take: 100
    })

    // If no products, return empty
    if (!userProducts || userProducts.length === 0) {
      return NextResponse.json({
        success: true,
        products: []
      })
    }

    // Get all product details
    const productIds = userProducts.map(up => up.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    })

    // Create map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]))

    // Format response
    const formattedProducts = userProducts.map(up => {
      const product = productMap.get(up.productId)
      if (!product) return null

      return {
        id: up.id,
        userId: up.userId,
        productId: up.productId,
        transactionId: up.transactionId,
        purchaseDate: up.purchaseDate,
        expiresAt: up.expiresAt,
        price: parseFloat(up.price.toString()),
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          thumbnail: product.thumbnail || '',
          type: product.productType || 'DIGITAL',
          price: parseFloat(product.price.toString()),
          
          // Event fields
          eventDate: product.eventDate,
          eventTime: product.eventTime,
          eventLocation: product.eventLocation,
          eventUrl: product.eventUrl,
          eventVisibility: product.eventVisibility,
          
          // Files
          downloadableFiles: product.downloadableFiles ? 
            (typeof product.downloadableFiles === 'string' ? 
              JSON.parse(product.downloadableFiles) : 
              product.downloadableFiles
            ) : []
        }
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      products: formattedProducts
    })

  } catch (error) {
    console.error('[API User Products] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat produk', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
