import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/lib/api-cache'

// Force this route to be dynamic - no caching at edge
export const dynamic = 'force-dynamic'
export const revalidate = 0


// GET /api/settings - Get current settings (public for website display)
export async function GET() {
  try {
    // Use shorter cache TTL for settings (10 seconds)
    const cached = apiCache.get(CACHE_KEYS.SETTINGS)
    if (cached) {
      const response = NextResponse.json(cached)
      // Add no-cache headers to prevent Vercel edge caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    // Get or create default settings
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        siteTitle: true,
        siteDescription: true,
        siteLogo: true,
        siteFavicon: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        buttonPrimaryBg: true,
        buttonPrimaryText: true,
        buttonSecondaryBg: true,
        buttonSecondaryText: true,
        buttonSuccessBg: true,
        buttonSuccessText: true,
        buttonDangerBg: true,
        buttonDangerText: true,
        buttonBorderRadius: true,
        headerText: true,
        footerText: true,
        contactEmail: true,
        contactPhone: true,
        whatsappNumber: true,
        instagramUrl: true,
        facebookUrl: true,
        linkedinUrl: true,
        maintenanceMode: true,
        defaultLanguage: true,
        bannerImage: true,
        // Dashboard Theme Colors
        dashboardSidebarBg: true,
        dashboardSidebarText: true,
        dashboardSidebarActiveText: true,
        dashboardSidebarActiveBg: true,
        dashboardSidebarHoverBg: true,
        dashboardHeaderBg: true,
        dashboardHeaderText: true,
        dashboardBodyBg: true,
        dashboardCardBg: true,
        dashboardCardBorder: true,
        dashboardCardHeaderBg: true,
        dashboardTextPrimary: true,
        dashboardTextSecondary: true,
        dashboardTextMuted: true,
        dashboardBorderColor: true,
        dashboardSuccessColor: true,
        dashboardWarningColor: true,
        dashboardDangerColor: true,
        dashboardInfoColor: true,
        // Email Footer Settings
        emailFooterText: true,
        emailFooterCompany: true,
        emailFooterAddress: true,
        emailFooterPhone: true,
        emailFooterEmail: true,
        emailFooterWebsiteUrl: true,
        emailFooterInstagramUrl: true,
        emailFooterFacebookUrl: true,
        emailFooterLinkedinUrl: true,
        emailFooterCopyrightText: true,
        revenueEnabled: true,
        affiliateCommissionEnabled: true,
        mentorCommissionEnabled: true,
      }
    })

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        siteTitle: 'Eksporyuk',
        siteDescription: 'Platform Ekspor Indonesia',
        siteLogo: null,
        siteFavicon: null,
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
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
        maintenanceMode: false,
        defaultLanguage: 'id',
        bannerImage: null,
        // Dashboard Theme Colors defaults
        dashboardSidebarBg: '#1e293b',
        dashboardSidebarText: '#e2e8f0',
        dashboardSidebarActiveText: '#ffffff',
        dashboardSidebarActiveBg: '#3b82f6',
        dashboardSidebarHoverBg: '#334155',
        dashboardHeaderBg: '#ffffff',
        dashboardHeaderText: '#1f2937',
        dashboardBodyBg: '#f1f5f9',
        dashboardCardBg: '#ffffff',
        dashboardCardBorder: '#e2e8f0',
        dashboardCardHeaderBg: '#f8fafc',
        dashboardTextPrimary: '#1f2937',
        dashboardTextSecondary: '#64748b',
        dashboardTextMuted: '#94a3b8',
        dashboardBorderColor: '#e2e8f0',
        dashboardSuccessColor: '#22c55e',
        dashboardWarningColor: '#f59e0b',
        dashboardDangerColor: '#ef4444',
        dashboardInfoColor: '#3b82f6',
        // Email Footer Settings defaults
        emailFooterText: null,
        emailFooterCompany: null,
        emailFooterAddress: null,
        emailFooterPhone: null,
        emailFooterEmail: null,
        emailFooterWebsiteUrl: null,
        emailFooterInstagramUrl: null,
        emailFooterFacebookUrl: null,
        emailFooterLinkedinUrl: null,
        emailFooterCopyrightText: null,
        revenueEnabled: true,
        affiliateCommissionEnabled: true,
        mentorCommissionEnabled: true,
      }
      apiCache.set(CACHE_KEYS.SETTINGS, defaultSettings, 10) // Short TTL: 10 seconds
      const response = NextResponse.json(defaultSettings)
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return response
    }

    // Cache settings for 10 seconds only
    apiCache.set(CACHE_KEYS.SETTINGS, settings, 10)
    const response = NextResponse.json(settings)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Update settings (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { revenueEnabled, affiliateCommissionEnabled, mentorCommissionEnabled } = body

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        revenueEnabled: revenueEnabled ?? true,
        affiliateCommissionEnabled: affiliateCommissionEnabled ?? true,
        mentorCommissionEnabled: mentorCommissionEnabled ?? true
      },
      create: {
        id: 1,
        revenueEnabled: revenueEnabled ?? true,
        affiliateCommissionEnabled: affiliateCommissionEnabled ?? true,
        mentorCommissionEnabled: mentorCommissionEnabled ?? true
      }
    })

    // Invalidate cache on update
    apiCache.delete(CACHE_KEYS.SETTINGS)

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
