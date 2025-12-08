import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { whatsapp } = await request.json()

    if (!whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp tidak boleh kosong' },
        { status: 400 }
      )
    }

    // Update user's WhatsApp number
    await prisma.user.update({
      where: { email: session.user.email },
      data: { whatsapp },
    })

    return NextResponse.json({
      success: true,
      message: 'Nomor WhatsApp berhasil disimpan',
    })
  } catch (error) {
    console.error('Update WhatsApp error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan nomor WhatsApp' },
      { status: 500 }
    )
  }
}
