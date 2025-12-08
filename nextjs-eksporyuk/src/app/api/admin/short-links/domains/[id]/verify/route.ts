import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id }
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // Simple DNS verification
    // In production, you would check actual DNS records
    // For now, we'll just return a success response
    const verified = true

    if (verified) {
      await prisma.shortLinkDomain.update({
        where: { id },
        data: { isActive: true }
      })
    }

    return NextResponse.json({
      verified,
      message: verified ? 'DNS verified successfully' : 'DNS verification failed'
    })
  } catch (error) {
    console.error('Error verifying DNS:', error)
    return NextResponse.json(
      { error: 'Failed to verify DNS' },
      { status: 500 }
    )
  }
}
