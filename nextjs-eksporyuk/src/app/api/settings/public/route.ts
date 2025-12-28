import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brandingSettings = await prisma.branding.findFirst({
      select: {
        logoAffiliate: true,
        brandColor: true,
      },
    });

    if (!brandingSettings) {
      return NextResponse.json({ error: 'Branding settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      logoAffiliate: brandingSettings.logoAffiliate,
      brandColor: brandingSettings.brandColor,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
