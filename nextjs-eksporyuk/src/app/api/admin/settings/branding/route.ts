import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force dynamic
export const dynamic = 'force-dynamic'

// GET /api/admin/settings/branding - Get branding settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create branding settings
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          siteLogo: '',
          logoAffiliate: '',
          siteFavicon: '',
          brandName: 'Ekspor Yuk',
          brandShortName: 'EY',
          tagline: 'Platform ekspor terpercaya Indonesia',
          primaryColor: '#2047FC',
          secondaryColor: '#ffc30d',
          accentColor: '#10b981',
          buttonPrimaryBg: '#2047FC',
          buttonPrimaryText: '#ffffff',
          buttonSecondaryBg: '#ffc30d',
          buttonSecondaryText: '#000000',
          buttonSuccessBg: '#10b981',
          buttonSuccessText: '#ffffff',
          buttonDangerBg: '#ef4444',
          buttonDangerText: '#ffffff',
          buttonBorderRadius: '8px',
          dashboardSidebarBg: '#1f2937',
          dashboardSidebarText: '#d1d5db',
          dashboardSidebarActiveText: '#ffffff',
          dashboardSidebarActiveBg: '#374151',
          cardBg: '#ffffff',
          cardBorder: '#e5e7eb',
          cardShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          typographyHeadingSize: '24px',
          typographyBodySize: '16px',
          typographyFontFamily: 'Inter, sans-serif',
          notificationPusherEnabled: true,
          notificationOneSignalEnabled: true,
          notificationMailketingEnabled: true,
          paymentExpiryHours: 72
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: settings
    })
    
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branding settings', details: error },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings/branding - Update branding settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.brandName || !data.primaryColor || !data.secondaryColor) {
      return NextResponse.json(
        { error: 'Brand name, primary color, and secondary color are required' },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: data.id || 1 },
      update: {
        siteLogo: data.siteLogo || '',
        logoAffiliate: data.logoAffiliate || '',
        siteFavicon: data.favicon || '',
        brandName: data.brandName,
        brandShortName: data.brandShortName || '',
        tagline: data.tagline || '',
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor || '#10b981',
        buttonPrimaryBg: data.buttonPrimaryBg || data.primaryColor,
        buttonPrimaryText: data.buttonPrimaryText || '#ffffff',
        buttonSecondaryBg: data.buttonSecondaryBg || data.secondaryColor,
        buttonSecondaryText: data.buttonSecondaryText || '#000000',
        buttonSuccessBg: data.buttonSuccessBg || '#10b981',
        buttonSuccessText: data.buttonSuccessText || '#ffffff',
        buttonDangerBg: data.buttonDangerBg || '#ef4444',
        buttonDangerText: data.buttonDangerText || '#ffffff',
        buttonBorderRadius: data.buttonBorderRadius || '8px',
        dashboardSidebarBg: data.dashboardSidebarBg || '#1f2937',
        dashboardSidebarText: data.dashboardSidebarText || '#d1d5db',
        dashboardSidebarActiveText: data.dashboardSidebarActiveText || '#ffffff',
        dashboardSidebarActiveBg: data.dashboardSidebarActiveItemBg || '#374151',
        cardBg: data.cardBg || '#ffffff',
        cardBorder: data.cardBorder || '#e5e7eb',
        cardShadow: data.cardShadow || '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        typographyHeadingSize: data.typographyHeadingSize || '24px',
        typographyBodySize: data.typographyBodySize || '16px',
        typographyFontFamily: data.typographyFontFamily || 'Inter, sans-serif',
        notificationPusherEnabled: data.notificationPusherEnabled ?? true,
        notificationOneSignalEnabled: data.notificationOneSignalEnabled ?? true,
        notificationMailketingEnabled: data.notificationMailketingEnabled ?? true,
        updatedAt: new Date()
      },
      create: {
        siteLogo: data.siteLogo || '',
        logoAffiliate: data.logoAffiliate || '',
        siteFavicon: data.favicon || '',
        brandName: data.brandName,
        brandShortName: data.brandShortName || '',
        tagline: data.tagline || '',
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor || '#10b981',
        buttonPrimaryBg: data.buttonPrimaryBg || data.primaryColor,
        buttonPrimaryText: data.buttonPrimaryText || '#ffffff',
        buttonSecondaryBg: data.buttonSecondaryBg || data.secondaryColor,
        buttonSecondaryText: data.buttonSecondaryText || '#000000',
        buttonSuccessBg: data.buttonSuccessBg || '#10b981',
        buttonSuccessText: data.buttonSuccessText || '#ffffff',
        buttonDangerBg: data.buttonDangerBg || '#ef4444',
        buttonDangerText: data.buttonDangerText || '#ffffff',
        buttonBorderRadius: data.buttonBorderRadius || '8px',
        dashboardSidebarBg: data.dashboardSidebarBg || '#1f2937',
        dashboardSidebarText: data.dashboardSidebarText || '#d1d5db',
        dashboardSidebarActiveText: data.dashboardSidebarActiveText || '#ffffff',
        dashboardSidebarActiveBg: data.dashboardSidebarActiveItemBg || '#374151',
        cardBg: data.cardBg || '#ffffff',
        cardBorder: data.cardBorder || '#e5e7eb',
        cardShadow: data.cardShadow || '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        typographyHeadingSize: data.typographyHeadingSize || '24px',
        typographyBodySize: data.typographyBodySize || '16px',
        typographyFontFamily: data.typographyFontFamily || 'Inter, sans-serif',
        notificationPusherEnabled: data.notificationPusherEnabled ?? true,
        notificationOneSignalEnabled: data.notificationOneSignalEnabled ?? true,
        notificationMailketingEnabled: data.notificationMailketingEnabled ?? true,
        paymentExpiryHours: 72 // default
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Branding settings updated successfully',
      settings: settings
    })
    
  } catch (error) {
    console.error('Error updating branding settings:', error)
    return NextResponse.json(
      { error: 'Failed to update branding settings', details: error },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/branding - Alias for PUT (to support both methods)
export async function POST(request: NextRequest) {
  return PUT(request)
}