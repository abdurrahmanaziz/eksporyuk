import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch checkout color settings
export async function GET() {
  try {
    const settings = await prisma.setting.findFirst({
      select: {
        checkoutPrimaryColor: true,
        checkoutSecondaryColor: true,
        checkoutAccentColor: true,
        checkoutSuccessColor: true,
        checkoutWarningColor: true,
      }
    })

    // Default colors jika belum ada di database
    const colors = {
      primary: settings?.checkoutPrimaryColor || '#3b82f6', // blue-500
      secondary: settings?.checkoutSecondaryColor || '#1e40af', // blue-700
      accent: settings?.checkoutAccentColor || '#60a5fa', // blue-400
      success: settings?.checkoutSuccessColor || '#22c55e', // green-500
      warning: settings?.checkoutWarningColor || '#eab308', // yellow-500
    }

    return NextResponse.json({ colors })
  } catch (error) {
    console.error('Error fetching checkout colors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout colors' },
      { status: 500 }
    )
  }
}

// POST - Update checkout color settings
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { primary, secondary, accent, success, warning } = body

    // Update or create settings
    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        checkoutPrimaryColor: primary,
        checkoutSecondaryColor: secondary,
        checkoutAccentColor: accent,
        checkoutSuccessColor: success,
        checkoutWarningColor: warning,
      },
      create: {
        id: 1,
        checkoutPrimaryColor: primary,
        checkoutSecondaryColor: secondary,
        checkoutAccentColor: accent,
        checkoutSuccessColor: success,
        checkoutWarningColor: warning,
      }
    })

    return NextResponse.json({ 
      success: true,
      colors: {
        primary: settings.checkoutPrimaryColor,
        secondary: settings.checkoutSecondaryColor,
        accent: settings.checkoutAccentColor,
        success: settings.checkoutSuccessColor,
        warning: settings.checkoutWarningColor,
      }
    })
  } catch (error) {
    console.error('Error updating checkout colors:', error)
    return NextResponse.json(
      { error: 'Failed to update checkout colors' },
      { status: 500 }
    )
  }
}
