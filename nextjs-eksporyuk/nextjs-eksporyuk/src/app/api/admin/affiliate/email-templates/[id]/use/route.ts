import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Track template usage (increment useCount)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Increment useCount
    const template = await prisma.affiliateEmailTemplate.update({
      where: { id },
      data: {
        useCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ 
      success: true, 
      useCount: template.useCount 
    })
  } catch (error) {
    console.error('Error tracking template usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
