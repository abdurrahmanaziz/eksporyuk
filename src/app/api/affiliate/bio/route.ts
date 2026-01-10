import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/services/starsenderService'
import { sendAffiliateBioPageNotification } from '@/lib/branded-template-helpers'

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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    console.log('GET /api/affiliate/bio - User:', {
      email: session.user.email,
      userId: user?.id,
      hasAffiliateProfile: !!affiliateProfile,
      affiliateId: affiliateProfile?.id
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Get bio page manually
    const bioPage = await (prisma as any).affiliateBioPage.findUnique({
      where: { affiliateId: affiliateProfile.id }
    })

    // Get CTA buttons if bio page exists
    let ctaButtons: any[] = []
    if (bioPage) {
      ctaButtons = await (prisma as any).bioPageCtaButton.findMany({
        where: { bioPageId: bioPage.id, isActive: true },
        orderBy: { displayOrder: 'asc' }
      })
    }

    console.log('GET /api/affiliate/bio - hasBioPage:', !!bioPage)

    return NextResponse.json({
      bioPage: bioPage ? { ...bioPage, ctaButtons } : null,
      username: affiliateProfile.shortLinkUsername,
      affiliateCode: affiliateProfile.affiliateCode
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    console.log('POST /api/affiliate/bio - User:', {
      email: session.user.email,
      userId: user?.id,
      hasAffiliateProfile: !!affiliateProfile,
      affiliateId: affiliateProfile?.id
    })

    if (!affiliateProfile) {
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
      where: { affiliateId: affiliateProfile.id },
      create: {
        affiliateId: affiliateProfile.id,
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

    // Send multi-channel notifications for bio page update
    try {
      const bioUrl = `${process.env.NEXTAUTH_URL}/bio/${affiliateProfile.shortLinkUsername}`
      const isNewBio = !bioPage.createdAt || (Date.now() - new Date(bioPage.createdAt).getTime() < 30000)
      
      // Email notification
      await notificationService.sendEmail({
        to: user.email,
        template: 'bio-page-updated',
        data: {
          userName: displayName || user.email,
          bioUrl,
          displayName: displayName || 'Bio Page Anda',
          action: isNewBio ? 'dibuat' : 'diperbarui',
          features: [
            avatarUrl ? 'Foto profil ditambahkan' : null,
            coverImage ? 'Cover image ditambahkan' : null,
            whatsappNumber ? 'WhatsApp contact ditambahkan' : null,
            showSocialIcons ? 'Social media links aktif' : null
          ].filter(Boolean)
        }
      })
      
      // WhatsApp notification
      if (user.whatsapp) {
        await starsenderService.sendMessage({
          to: user.whatsapp,
          message: `🎉 Bio Page Anda ${isNewBio ? 'berhasil dibuat' : 'telah diperbarui'}!\n\n` +
                   `📄 ${displayName || 'Bio Page Anda'}\n` +
                   `🔗 Link: ${bioUrl}\n\n` +
                   `Sekarang Anda bisa share link bio page ini untuk meningkatkan engagement dengan audience!`
        })
      }
      
      // Push notification dengan branded template
      await sendAffiliateBioPageNotification({
        userId: user.id,
        action: isNewBio ? 'created' : 'updated',
        bioName: displayName || 'Bio Page Anda',
        details: `${isNewBio ? 'Siap untuk dishare' : 'Telah diperbarui'} dengan fitur: ${[
          avatarUrl ? 'foto profil' : null,
          coverImage ? 'cover image' : null,
          whatsappNumber ? 'WhatsApp contact' : null
        ].filter(Boolean).join(', ')}`
      })
      
      console.log('✅ Bio page notifications sent successfully')
    } catch (notifError) {
      console.error('⚠️ Failed to send bio page notifications:', notifError)
      // Don't fail the main request for notification errors
    }

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
