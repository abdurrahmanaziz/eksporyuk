import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/short-links
 * Get affiliate's short links
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
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
    
    // Get short links
    const shortLinks = await prisma.affiliateShortLink.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' }
    })
    
    // Get domains and affiliate links separately (no relation in schema)
    const domainIds = [...new Set(shortLinks.map(s => s.domainId).filter(Boolean))]
    const affiliateLinkIds = [...new Set(shortLinks.map(s => s.affiliateLinkId).filter(Boolean))] as string[]
    
    const [domains, affiliateLinks] = await Promise.all([
      domainIds.length > 0 ? prisma.shortLinkDomain.findMany({
        where: { id: { in: domainIds } }
      }) : [],
      affiliateLinkIds.length > 0 ? prisma.affiliateLink.findMany({
        where: { id: { in: affiliateLinkIds } }
      }) : []
    ])
    
    const domainMap = new Map(domains.map(d => [d.id, d]))
    const affiliateLinkMap = new Map(affiliateLinks.map(a => [a.id, a]))
    
    // Enrich short links with domain and affiliateLink data
    const enrichedShortLinks = shortLinks.map(sl => ({
      ...sl,
      domain: sl.domainId ? domainMap.get(sl.domainId) || null : null,
      affiliateLink: sl.affiliateLinkId ? affiliateLinkMap.get(sl.affiliateLinkId) || null : null
    }))
    
    return NextResponse.json({ shortLinks: enrichedShortLinks })
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
    
    if (!session?.user) {
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
      couponCode,
      expiresAt
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
      const affiliateLink = await prisma.affiliateLink.findFirst({
        where: {
          affiliateId: affiliate.id,
          [`${targetType}Id`]: targetId
        }
      })
      
      affiliateLinkId = affiliateLink?.id || null
    }
    
    const shortLink = await prisma.affiliateShortLink.create({
      data: {
        affiliateId: affiliate.id,
        domainId,
        username,
        slug,
        targetType,
        targetId,
        targetUrl,
        fullShortUrl,
        affiliateLinkId,
        couponCode,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })
    
    // Get domain and affiliate link for response (no relation in schema)
    const affiliateLinkData = affiliateLinkId 
      ? await prisma.affiliateLink.findUnique({ where: { id: affiliateLinkId } })
      : null
    
    // Update domain stats
    await prisma.shortLinkDomain.update({
      where: { id: domainId },
      data: {
        totalLinks: { increment: 1 }
      }
    })
    
    // Return enriched short link
    return NextResponse.json({ 
      shortLink: {
        ...shortLink,
        domain,
        affiliateLink: affiliateLinkData
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating short link:', error)
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    )
  }
}
