import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      hasProfile: !!supplierProfile,
      profile: supplierProfile,
    })
  } catch (error) {
    console.error('Error checking supplier profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
