import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    
    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          id: 1,
          // Website General Settings
          siteTitle: 'Eksporyuk',
          siteDescription: 'Platform Ekspor Indonesia',
          siteLogo: null,
          siteFavicon: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          // Button Colors
          buttonPrimaryBg: '#3B82F6',
          buttonPrimaryText: '#FFFFFF',
          buttonSecondaryBg: '#6B7280',
          buttonSecondaryText: '#FFFFFF',
          buttonSuccessBg: '#10B981',
          buttonSuccessText: '#FFFFFF',
          buttonDangerBg: '#EF4444',
          buttonDangerText: '#FFFFFF',
          buttonBorderRadius: '0.5rem',
          headerText: null,
          footerText: null,
          contactEmail: null,
          contactPhone: null,
          whatsappNumber: null,
          instagramUrl: null,
          facebookUrl: null,
          linkedinUrl: null,
          customCss: null,
          customJs: null,
          maintenanceMode: false,
          defaultLanguage: 'id',
          bannerImage: null,
          // Email Footer Settings for Branded Templates
          emailFooterText: 'Terima kasih telah bergabung dengan EksporYuk. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.',
          emailFooterCompany: 'PT. EksporYuk Indonesia', 
          emailFooterAddress: 'Jl. Sudirman No. 123, Jakarta Selatan, Indonesia',
          emailFooterPhone: '+62 21 1234 5678',
          emailFooterEmail: 'support@eksporyuk.com',
          // Existing settings
          paymentExpiryHours: 72,
          followUpEnabled: true,
          followUp1HourEnabled: true,
          followUp24HourEnabled: true,
          followUp48HourEnabled: true,
          followUpMessage1Hour: 'Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu. Segera selesaikan dalam {timeLeft}. Link: {paymentUrl}',
          followUpMessage24Hour: 'Reminder: Pembayaran Anda akan kadaluarsa dalam {timeLeft}. Segera bayar sebelum terlambat!',
          followUpMessage48Hour: 'Last chance! Pembayaran Anda akan dibatalkan otomatis jika tidak diselesaikan dalam {timeLeft}.'
        }
      })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[SETTINGS API] Received data:', JSON.stringify(body, null, 2))
    
    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (value === '' || value === undefined) return null
      return value
    }

    const {
      // Website General Settings
      siteTitle,
      siteDescription,
      siteLogo,
      siteFavicon,
      primaryColor,
      secondaryColor,
      // Button Colors
      buttonPrimaryBg,
      buttonPrimaryText,
      buttonSecondaryBg,
      buttonSecondaryText,
      buttonSuccessBg,
      buttonSuccessText,
      buttonDangerBg,
      buttonDangerText,
      buttonBorderRadius,
      headerText,
      footerText,
      contactEmail,
      contactPhone,
      whatsappNumber,
      instagramUrl,
      facebookUrl,
      linkedinUrl,
      customCss,
      customJs,
      maintenanceMode,
      defaultLanguage,
      bannerImage,
      // Email Footer Settings
      emailFooterText,
      emailFooterCompany,
      emailFooterAddress,
      emailFooterPhone,
      emailFooterEmail,
      emailFooterWebsiteUrl,
      emailFooterInstagramUrl,
      emailFooterFacebookUrl,
      emailFooterLinkedinUrl,
      emailFooterCopyrightText,
      // Existing settings
      paymentExpiryHours,
      followUpEnabled,
      followUp1HourEnabled,
      followUp24HourEnabled,
      followUp48HourEnabled,
      followUpMessage1Hour,
      followUpMessage24Hour,
      followUpMessage48Hour,
      // Affiliate settings
      affiliateAutoApprove,
      affiliateCommissionEnabled,
      defaultAffiliateCommission,
      minWithdrawalAmount,
    } = body

    // Validate paymentExpiryHours only if provided
    if (paymentExpiryHours !== undefined && paymentExpiryHours !== null && paymentExpiryHours !== '') {
      const hours = parseInt(paymentExpiryHours)
      if (isNaN(hours) || hours < 1 || hours > 168) {
        return NextResponse.json({ 
          success: false, 
          error: 'Payment expiry must be between 1 and 168 hours' 
        }, { status: 400 })
      }
    }

    // Prepare data with null conversion for empty strings
    const updateData: any = {}
    
    // Only include fields that are provided (not undefined)
    if (siteTitle !== undefined) updateData.siteTitle = toNullIfEmpty(siteTitle)
    if (siteDescription !== undefined) updateData.siteDescription = toNullIfEmpty(siteDescription)
    if (siteLogo !== undefined) updateData.siteLogo = toNullIfEmpty(siteLogo)
    if (siteFavicon !== undefined) updateData.siteFavicon = toNullIfEmpty(siteFavicon)
    if (primaryColor !== undefined) updateData.primaryColor = toNullIfEmpty(primaryColor)
    if (secondaryColor !== undefined) updateData.secondaryColor = toNullIfEmpty(secondaryColor)
    if (buttonPrimaryBg !== undefined) updateData.buttonPrimaryBg = toNullIfEmpty(buttonPrimaryBg)
    if (buttonPrimaryText !== undefined) updateData.buttonPrimaryText = toNullIfEmpty(buttonPrimaryText)
    if (buttonSecondaryBg !== undefined) updateData.buttonSecondaryBg = toNullIfEmpty(buttonSecondaryBg)
    if (buttonSecondaryText !== undefined) updateData.buttonSecondaryText = toNullIfEmpty(buttonSecondaryText)
    if (buttonSuccessBg !== undefined) updateData.buttonSuccessBg = toNullIfEmpty(buttonSuccessBg)
    if (buttonSuccessText !== undefined) updateData.buttonSuccessText = toNullIfEmpty(buttonSuccessText)
    if (buttonDangerBg !== undefined) updateData.buttonDangerBg = toNullIfEmpty(buttonDangerBg)
    if (buttonDangerText !== undefined) updateData.buttonDangerText = toNullIfEmpty(buttonDangerText)
    if (buttonBorderRadius !== undefined) updateData.buttonBorderRadius = toNullIfEmpty(buttonBorderRadius)
    if (headerText !== undefined) updateData.headerText = toNullIfEmpty(headerText)
    if (footerText !== undefined) updateData.footerText = toNullIfEmpty(footerText)
    if (contactEmail !== undefined) updateData.contactEmail = toNullIfEmpty(contactEmail)
    if (contactPhone !== undefined) updateData.contactPhone = toNullIfEmpty(contactPhone)
    if (whatsappNumber !== undefined) updateData.whatsappNumber = toNullIfEmpty(whatsappNumber)
    if (instagramUrl !== undefined) updateData.instagramUrl = toNullIfEmpty(instagramUrl)
    if (facebookUrl !== undefined) updateData.facebookUrl = toNullIfEmpty(facebookUrl)
    if (linkedinUrl !== undefined) updateData.linkedinUrl = toNullIfEmpty(linkedinUrl)
    if (customCss !== undefined) updateData.customCss = toNullIfEmpty(customCss)
    if (customJs !== undefined) updateData.customJs = toNullIfEmpty(customJs)
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode
    if (defaultLanguage !== undefined) updateData.defaultLanguage = toNullIfEmpty(defaultLanguage)
    if (bannerImage !== undefined) updateData.bannerImage = toNullIfEmpty(bannerImage)
    
    // Email Footer Settings - keep empty strings as empty strings, don't convert to null
    if (emailFooterText !== undefined) updateData.emailFooterText = emailFooterText || ''
    if (emailFooterCompany !== undefined) updateData.emailFooterCompany = emailFooterCompany || ''
    if (emailFooterAddress !== undefined) updateData.emailFooterAddress = emailFooterAddress || ''
    if (emailFooterPhone !== undefined) updateData.emailFooterPhone = emailFooterPhone || ''
    if (emailFooterEmail !== undefined) updateData.emailFooterEmail = emailFooterEmail || ''
    if (emailFooterWebsiteUrl !== undefined) updateData.emailFooterWebsiteUrl = emailFooterWebsiteUrl || ''
    if (emailFooterInstagramUrl !== undefined) updateData.emailFooterInstagramUrl = emailFooterInstagramUrl || ''
    if (emailFooterFacebookUrl !== undefined) updateData.emailFooterFacebookUrl = emailFooterFacebookUrl || ''
    if (emailFooterLinkedinUrl !== undefined) updateData.emailFooterLinkedinUrl = emailFooterLinkedinUrl || ''
    if (emailFooterCopyrightText !== undefined) updateData.emailFooterCopyrightText = emailFooterCopyrightText || ''
    
    if (paymentExpiryHours !== undefined && paymentExpiryHours !== '' && paymentExpiryHours !== null) {
      updateData.paymentExpiryHours = parseInt(paymentExpiryHours)
    }
    if (followUpEnabled !== undefined) updateData.followUpEnabled = followUpEnabled
    if (followUp1HourEnabled !== undefined) updateData.followUp1HourEnabled = followUp1HourEnabled
    if (followUp24HourEnabled !== undefined) updateData.followUp24HourEnabled = followUp24HourEnabled
    if (followUp48HourEnabled !== undefined) updateData.followUp48HourEnabled = followUp48HourEnabled
    if (followUpMessage1Hour !== undefined) updateData.followUpMessage1Hour = toNullIfEmpty(followUpMessage1Hour)
    if (followUpMessage24Hour !== undefined) updateData.followUpMessage24Hour = toNullIfEmpty(followUpMessage24Hour)
    if (followUpMessage48Hour !== undefined) updateData.followUpMessage48Hour = toNullIfEmpty(followUpMessage48Hour)
    // Affiliate settings
    if (affiliateAutoApprove !== undefined) updateData.affiliateAutoApprove = affiliateAutoApprove
    if (affiliateCommissionEnabled !== undefined) updateData.affiliateCommissionEnabled = affiliateCommissionEnabled
    if (defaultAffiliateCommission !== undefined && defaultAffiliateCommission !== null) {
      updateData.defaultAffiliateCommission = parseInt(defaultAffiliateCommission)
    }
    if (minWithdrawalAmount !== undefined && minWithdrawalAmount !== null) {
      updateData.minWithdrawalAmount = parseInt(minWithdrawalAmount)
    }

    console.log('[SETTINGS API] Update data:', JSON.stringify(updateData, null, 2))

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        siteTitle: toNullIfEmpty(siteTitle) || 'Eksporyuk',
        siteDescription: toNullIfEmpty(siteDescription) || 'Platform Ekspor Indonesia',
        siteLogo: toNullIfEmpty(siteLogo),
        siteFavicon: toNullIfEmpty(siteFavicon),
        primaryColor: toNullIfEmpty(primaryColor) || '#3B82F6',
        secondaryColor: toNullIfEmpty(secondaryColor) || '#1F2937',
        buttonPrimaryBg: toNullIfEmpty(buttonPrimaryBg) || '#3B82F6',
        buttonPrimaryText: toNullIfEmpty(buttonPrimaryText) || '#FFFFFF',
        buttonSecondaryBg: toNullIfEmpty(buttonSecondaryBg) || '#6B7280',
        buttonSecondaryText: toNullIfEmpty(buttonSecondaryText) || '#FFFFFF',
        buttonSuccessBg: toNullIfEmpty(buttonSuccessBg) || '#10B981',
        buttonSuccessText: toNullIfEmpty(buttonSuccessText) || '#FFFFFF',
        buttonDangerBg: toNullIfEmpty(buttonDangerBg) || '#EF4444',
        buttonDangerText: toNullIfEmpty(buttonDangerText) || '#FFFFFF',
        buttonBorderRadius: toNullIfEmpty(buttonBorderRadius) || '0.5rem',
        headerText: toNullIfEmpty(headerText),
        footerText: toNullIfEmpty(footerText),
        contactEmail: toNullIfEmpty(contactEmail),
        contactPhone: toNullIfEmpty(contactPhone),
        whatsappNumber: toNullIfEmpty(whatsappNumber),
        instagramUrl: toNullIfEmpty(instagramUrl),
        facebookUrl: toNullIfEmpty(facebookUrl),
        linkedinUrl: toNullIfEmpty(linkedinUrl),
        customCss: toNullIfEmpty(customCss),
        customJs: toNullIfEmpty(customJs),
        maintenanceMode: maintenanceMode ?? false,
        defaultLanguage: toNullIfEmpty(defaultLanguage) || 'id',
        bannerImage: toNullIfEmpty(bannerImage),
        paymentExpiryHours: paymentExpiryHours ? parseInt(paymentExpiryHours) : 72,
        followUpEnabled: followUpEnabled ?? true,
        followUp1HourEnabled: followUp1HourEnabled ?? true,
        followUp24HourEnabled: followUp24HourEnabled ?? true,
        followUp48HourEnabled: followUp48HourEnabled ?? true,
        followUpMessage1Hour: toNullIfEmpty(followUpMessage1Hour),
        followUpMessage24Hour: toNullIfEmpty(followUpMessage24Hour),
        followUpMessage48Hour: toNullIfEmpty(followUpMessage48Hour),
      }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
