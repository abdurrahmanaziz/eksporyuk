import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/support/agents - list assignable support agents (currently ADMIN users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agents = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('[GET /api/support/agents] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat daftar agen support' },
      { status: 500 }
    )
  }
}
