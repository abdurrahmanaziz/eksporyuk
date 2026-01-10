import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

interface PageProps {
  params: Promise<{ username: string; slug?: string[] }>
}

/**
 * Redirect page untuk short links
 * Path: /go/[username] atau /go/[username]/[...slug]
 */
export default async function ShortLinkRedirectPage({ params }: PageProps) {
  const resolvedParams = await params
  const { username, slug: slugArray } = resolvedParams
  const slug = slugArray ? slugArray.join('/') : null

  try {
    // Find the short link
    const shortLink = await prisma.affiliateShortLink.findFirst({
      where: {
        username,
        slug,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        domain: true,
        affiliate: {
          include: {
            user: true
          }
        },
        affiliateLink: true
      }
    })

    if (!shortLink) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
            <p className="text-gray-600">This short link does not exist or has expired.</p>
          </div>
        </div>
      )
    }

    // Build target URL
    let targetUrl: string
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'

    if (shortLink.targetType === 'custom') {
      targetUrl = shortLink.targetUrl || '/'
    } else {
      // Build URL based on target type
      const baseUrl = process.env.NEXT_PUBLIC_URL || `https://${host}`
      
      switch (shortLink.targetType) {
        case 'product':
          targetUrl = `${baseUrl}/checkout?type=product&id=${shortLink.targetId}`
          break
        case 'course':
          targetUrl = `${baseUrl}/checkout?type=course&id=${shortLink.targetId}`
          break
        case 'membership':
          targetUrl = `${baseUrl}/checkout?type=membership&id=${shortLink.targetId}`
          break
        default:
          targetUrl = baseUrl
      }
      
      // Add affiliate code to URL
      if (shortLink.affiliate?.affiliateCode) {
        const separator = targetUrl.includes('?') ? '&' : '?'
        targetUrl += `${separator}ref=${shortLink.affiliate.affiliateCode}`
      }
      
      // Add coupon code if available
      if (shortLink.couponCode) {
        targetUrl += `&coupon=${shortLink.couponCode}`
      }
    }

    // Track click in background (non-blocking)
    trackClick(shortLink, headersList).catch(err => 
      console.error('Error tracking click:', err)
    )

    // Redirect to target URL
    redirect(targetUrl)
  } catch (error) {
    console.error('Error processing short link:', error)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">Failed to process this short link.</p>
        </div>
      </div>
    )
  }
}

/**
 * Track click statistics
 */
async function trackClick(shortLink: any, headersList: Headers) {
  try {
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    const referrer = headersList.get('referer') || null
    
    // Update short link stats
    await prisma.affiliateShortLink.update({
      where: { id: shortLink.id },
      data: {
        clicks: { increment: 1 }
      }
    })
    
    // Update domain stats
    await prisma.shortLinkDomain.update({
      where: { id: shortLink.domainId },
      data: {
        totalClicks: { increment: 1 }
      }
    })
    
    // Update affiliate stats
    await prisma.affiliateProfile.update({
      where: { id: shortLink.affiliateId },
      data: {
        totalClicks: { increment: 1 }
      }
    })
    
    // Track click record if affiliateLink exists
    if (shortLink.affiliateLinkId) {
      await prisma.affiliateClick.create({
        data: {
          linkId: shortLink.affiliateLinkId,
          affiliateId: shortLink.affiliateId,
          ipAddress,
          userAgent,
          referrer,
          productId: shortLink.targetType === 'product' ? shortLink.targetId : null,
          membershipId: shortLink.targetType === 'membership' ? shortLink.targetId : null
        }
      })
      
      // Update affiliate link clicks
      await prisma.affiliateLink.update({
        where: { id: shortLink.affiliateLinkId },
        data: {
          clicks: { increment: 1 }
        }
      })
    }
  } catch (error) {
    console.error('Error tracking click:', error)
    // Don't throw - tracking failure shouldn't break redirect
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params
  const { username } = resolvedParams
  
  return {
    title: `Redirecting... | ${username}`,
    robots: 'noindex, nofollow'
  }
}
