import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/affiliate/short-links
 * Get affiliate's short links
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id as string }
    })
    
    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }
    
    const shortLinks = await prisma.affiliateShortLink.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        domain: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Build full URLs for response
    const linksWithUrls = shortLinks.map(link => ({
      ...link,
      fullShortUrl: `https://${link.domain.domain}/${link.username}${link.slug ? '/' + link.slug : ''}`
    }))
    
    return NextResponse.json({ shortLinks: linksWithUrls })
  } catch (error) {
    console.error('Error fetching short links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch short links' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate/short-links
 * Create new short link
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const {
      domainId,
      username,
      slug,
      targetType,
      targetId,
      targetUrl,
      couponCode
    } = body
    
    // Validate required fields
    if (!domainId || !username || !targetType) {
      return NextResponse.json(
        { error: 'Domain, username, and target type are required' },
        { status: 400 }
      )
    }
    
    // Validate username format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }
    
    if (targetType === 'custom' && !targetUrl) {
      return NextResponse.json(
        { error: 'Custom URL is required for custom target type' },
        { status: 400 }
      )
    }
    
    if (targetType !== 'custom' && !targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      )
    }
    
    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id as string }
    })
    
    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found. Please contact support.' },
        { status: 404 }
      )
    }
    
    // Check if domain exists and is active
    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id: domainId }
    })
    
    if (!domain || !domain.isActive) {
      return NextResponse.json(
        { error: 'Domain not found or inactive' },
        { status: 400 }
      )
    }
    
    // Check if username is already taken for this domain
    const existing = await prisma.affiliateShortLink.findFirst({
      where: {
        domainId,
        username,
        slug: slug || null
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'This short link URL is already taken' },
        { status: 400 }
      )
    }
    
    // Check if this is the first short link for this affiliate
    // If yes, save username to affiliate profile
    if (!affiliate.shortLinkUsername) {
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: { shortLinkUsername: username }
      })
    }
    
    // Build full short URL
    const slugPart = slug ? `/${slug}` : ''
    const fullShortUrl = `https://${domain.domain}/${username}${slugPart}`
    
    // Create or get affiliate link for tracking
    let affiliateLinkId = null
    if (targetType !== 'custom' && targetId) {
      // Try to find existing affiliate link
      const linkCondition: any = { affiliateId: affiliate.id }
      
      if (targetType === 'membership') {
        linkCondition.membershipId = targetId
      } else if (targetType === 'product') {
        linkCondition.productId = targetId
      } else if (targetType === 'course') {
        linkCondition.courseId = targetId
      }
      
      const affiliateLink = await prisma.affiliateLink.findFirst({
        where: linkCondition
      })
      
      affiliateLinkId = affiliateLink?.id || null
    }
    
    const shortLink = await prisma.affiliateShortLink.create({
      data: {
        affiliateId: affiliate.id,
        domainId,
        username,
        slug: slug || null,
        targetType,
        targetId: targetId || null,
        targetUrl: targetUrl || null,
        fullShortUrl,
        affiliateLinkId,
        couponCode: couponCode || null
      },
      include: {
        domain: true
      }
    })
    
    // Update domain stats
    await prisma.shortLinkDomain.update({
      where: { id: domainId },
      data: {
        totalLinks: { increment: 1 }
      }
    })
    
    return NextResponse.json({ shortLink }, { status: 201 })
  } catch (error) {
    console.error('Error creating short link:', error)
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    )
  }
}
