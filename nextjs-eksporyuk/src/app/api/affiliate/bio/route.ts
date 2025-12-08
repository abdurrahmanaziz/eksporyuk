import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Increase body size limit for base64 images
export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate/bio
 * Get affiliate's bio page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and affiliate profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        affiliateProfile: {
          include: {
            bioPage: {
              include: {
                ctaButtons: {
                  where: { isActive: true },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    }) as any

    console.log('GET /api/affiliate/bio - User:', {
      email: session.user.email,
      userId: user?.id,
      hasAffiliateProfile: !!user?.affiliateProfile,
      affiliateId: user?.affiliateProfile?.id,
      hasBioPage: !!user?.affiliateProfile?.bioPage
    })

    if (!user?.affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    return NextResponse.json({
      bioPage: user.affiliateProfile.bioPage,
      username: user.affiliateProfile.shortLinkUsername,
      affiliateCode: user.affiliateProfile.affiliateCode
    })
  } catch (error) {
    console.error('Error fetching bio page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bio page' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate/bio
 * Create or update affiliate bio page
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      template,
      buttonLayout,
      displayName,
      customHeadline,
      customDescription,
      avatarUrl,
      coverImage,
      whatsappGroupLink,
      whatsappNumber,
      isActive,
      primaryColor,
      secondaryColor,
      fontFamily,
      showSocialIcons,
      socialFacebook,
      socialInstagram,
      socialTwitter,
      socialTiktok,
      socialYoutube
    } = body

    console.log('POST /api/affiliate/bio - Received data:', {
      displayName,
      hasAvatar: !!avatarUrl,
      avatarLength: avatarUrl?.length,
      hasCover: !!coverImage,
      coverLength: coverImage?.length
    })

    // Get affiliate profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliateProfile: true }
    }) as any

    console.log('POST /api/affiliate/bio - User:', {
      email: session.user.email,
      userId: user?.id,
      hasAffiliateProfile: !!user?.affiliateProfile,
      affiliateId: user?.affiliateProfile?.id
    })

    if (!user?.affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Validate WhatsApp number format if provided
    if (whatsappNumber && !/^[0-9]{10,15}$/.test(whatsappNumber.replace(/[^0-9]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid WhatsApp number format' },
        { status: 400 }
      )
    }

    // Create or update bio page
    console.log('🔵 BEFORE PRISMA UPSERT - Data yang akan disimpan:')
    console.log('  avatarUrl:', avatarUrl ? `EXISTS (${avatarUrl.length} chars, starts with: ${avatarUrl.substring(0, 30)}...)` : 'NULL/UNDEFINED')
    console.log('  coverImage:', coverImage ? `EXISTS (${coverImage.length} chars, starts with: ${coverImage.substring(0, 30)}...)` : 'NULL/UNDEFINED')
    console.log('  avatarUrl === null:', avatarUrl === null)
    console.log('  avatarUrl === undefined:', avatarUrl === undefined)
    console.log('  avatarUrl === "":', avatarUrl === '')
    console.log('  coverImage === null:', coverImage === null)
    console.log('  coverImage === undefined:', coverImage === undefined)
    console.log('  coverImage === "":', coverImage === '')
    
    const bioPage = await (prisma as any).affiliateBioPage.upsert({
      where: { affiliateId: user.affiliateProfile.id },
      create: {
        affiliateId: user.affiliateProfile.id,
        template: template || 'modern',
        buttonLayout: buttonLayout || 'stack',
        displayName,
        customHeadline,
        customDescription,
        avatarUrl,
        coverImage,
        whatsappGroupLink,
        whatsappNumber,
        isActive: isActive !== undefined ? isActive : true,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#10B981',
        fontFamily: fontFamily || 'inter',
        showSocialIcons: showSocialIcons !== false,
        socialFacebook,
        socialInstagram,
        socialTwitter,
        socialTiktok,
        socialYoutube
      },
      update: {
        template,
        buttonLayout,
        displayName,
        customHeadline,
        customDescription,
        avatarUrl,
        coverImage,
        whatsappGroupLink,
        whatsappNumber,
        isActive,
        primaryColor,
        secondaryColor,
        fontFamily,
        showSocialIcons,
        socialFacebook,
        socialInstagram,
        socialTwitter,
        socialTiktok,
        socialYoutube
      }
    })

    console.log('POST /api/affiliate/bio - Saved to database:', {
      id: bioPage.id,
      displayName: bioPage.displayName,
      hasAvatar: !!bioPage.avatarUrl,
      avatarLength: bioPage.avatarUrl?.length,
      hasCover: !!bioPage.coverImage,
      coverLength: bioPage.coverImage?.length
    })

    return NextResponse.json({
      message: 'Bio page updated successfully',
      bioPage
    })
  } catch (error) {
    console.error('Error updating bio page:', error)
    return NextResponse.json(
      { error: 'Failed to update bio page' },
      { status: 500 }
    )
  }
}
