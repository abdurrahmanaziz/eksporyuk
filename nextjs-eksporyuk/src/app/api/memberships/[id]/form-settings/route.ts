import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { formLogo, formBanner, formDescription } = await request.json()

    const membership = await prisma.membership.update({
      where: { id },
      data: {
        formLogo,
        formBanner,
        formDescription,
      },
    })

    return NextResponse.json({
      success: true,
      membership,
    })
  } catch (error) {
    console.error('Error updating form settings:', error)
    return NextResponse.json(
      { error: 'Failed to update form settings' },
      { status: 500 }
    )
  }
}