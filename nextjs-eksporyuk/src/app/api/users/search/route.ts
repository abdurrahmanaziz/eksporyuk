import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Search users by name or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ]
          },
          // Don't include current user
          { id: { not: session.user.id } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    })

  } catch (error: any) {
    console.error('User search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search users',
      users: []
    }, { status: 500 })
  }
}
