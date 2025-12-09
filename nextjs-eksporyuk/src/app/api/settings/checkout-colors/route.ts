import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch checkout color settings (using existing settings fields)
export async function GET() {
  // Default colors - avoid database call if not needed
  const defaultColors = {
    primary: '#3b82f6', // blue-500
    secondary: '#1e40af', // blue-700
    accent: '#60a5fa', // blue-400
    success: '#22c55e', // green-500
    warning: '#eab308', // yellow-500
  }

  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        primaryColor: true,
        secondaryColor: true,
        buttonSuccessBg: true,
        buttonDangerBg: true,
      }
    })

    if (settings) {
      return NextResponse.json({ 
        colors: {
          primary: settings.primaryColor || defaultColors.primary,
          secondary: settings.secondaryColor || defaultColors.secondary,
          accent: defaultColors.accent,
          success: settings.buttonSuccessBg || defaultColors.success,
          warning: settings.buttonDangerBg || defaultColors.warning,
        }
      })
    }

    return NextResponse.json({ colors: defaultColors })
  } catch (error) {
    // If database error, return defaults silently
    return NextResponse.json({ colors: defaultColors })
  }
}

// POST - Update checkout color settings (using existing fields)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { primary, secondary, success, warning } = body

    // Update using existing settings fields
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        primaryColor: primary,
        secondaryColor: secondary,
        buttonSuccessBg: success,
        buttonDangerBg: warning,
      },
      create: {
        id: 1,
        primaryColor: primary,
        secondaryColor: secondary,
        buttonSuccessBg: success,
        buttonDangerBg: warning,
      }
    })

    return NextResponse.json({ 
      success: true,
      colors: {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        success: settings.buttonSuccessBg,
        warning: settings.buttonDangerBg,
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
