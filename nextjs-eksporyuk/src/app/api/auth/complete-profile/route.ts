import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { whatsapp } = body

    if (!whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp wajib diisi' },
        { status: 400 }
      )
    }

    // Update user whatsapp
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { whatsapp },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        role: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil dilengkapi',
      user,
    })
  } catch (error: any) {
    console.error('Complete profile error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
