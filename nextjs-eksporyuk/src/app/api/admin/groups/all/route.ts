import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/groups/all - Get all groups with full details
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch groups without relations (schema doesn't have them)
    const groups = await prisma.group.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get owner info and counts for each group manually
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        // Get owner info
        const owner = await prisma.user.findUnique({
          where: { id: group.ownerId },
          select: {
            id: true,
            name: true,
            email: true
          }
        })

        // Get member count
        const membersCount = await prisma.groupMember.count({
          where: { groupId: group.id }
        })

        // Get posts count
        const postsCount = await prisma.post.count({
          where: { groupId: group.id }
        })

        // Note: courses and products relations don't exist in schema
        // Using 0 as default
        return {
          ...group,
          owner,
          _count: {
            members: membersCount,
            posts: postsCount,
            courses: 0,
            products: 0
          }
        }
      })
    )

    return NextResponse.json({ groups: groupsWithDetails })
    
  } catch (error) {
    console.error('Get all groups error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
