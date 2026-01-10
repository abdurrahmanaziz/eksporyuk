import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const brandingSettings = await prisma.branding.findFirst({
      select: {
        logoAffiliate: true,
        brandColor: true,
      },
    });

    // Return default values if no branding settings found
    if (!brandingSettings) {
      return NextResponse.json({
        logoAffiliate: null,
        brandColor: '#3B82F6',
      });
    }

    return NextResponse.json({
      logoAffiliate: brandingSettings.logoAffiliate,
      brandColor: brandingSettings.brandColor,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    // Return default values on error instead of 500
    return NextResponse.json({
      logoAffiliate: null,
      brandColor: '#3B82F6',
    });
  }
}
