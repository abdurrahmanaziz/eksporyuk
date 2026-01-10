/**
 * GET /api/mentors
 * Get list of mentors for chat
 * Public endpoint for logged-in users
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, online
    const search = searchParams.get('search') || ''
    
    // Build where clause
    const where: any = { 
      role: 'MENTOR',
      // Only show active mentors
      isActive: true
    }
    
    // Filter by online status
    if (filter === 'online') {
      where.isOnline = true
    }
    
    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    // Get mentors
    const mentors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        isOnline: true,
        lastSeenAt: true,
        bio: true,
        // Get unread message count from chat rooms with current user
        chatParticipants: {
          where: {
            room: {
              type: 'DIRECT',
              participants: {
                some: {
                  userId: session.user.id
                }
              }
            }
          },
          select: {
            unreadCount: true
          }
        }
      },
      orderBy: [
        { isOnline: 'desc' },
        { lastSeenAt: 'desc' },
        { name: 'asc' }
      ],
      take: 50
    })
    
    // Format response with unread count
    const formatted = mentors.map(mentor => ({
      id: mentor.id,
      name: mentor.name,
      username: mentor.username,
      avatar: mentor.avatar,
      isOnline: mentor.isOnline || false,
      lastSeenAt: mentor.lastSeenAt,
      bio: mentor.bio,
      // Sum unread messages from this mentor
      unreadCount: mentor.chatParticipants.reduce((sum, p) => sum + (p.unreadCount || 0), 0)
    }))
    
    // Count online mentors
    const onlineCount = mentors.filter(m => m.isOnline).length
    
    return NextResponse.json({
      success: true,
      mentors: formatted,
      total: formatted.length,
      onlineCount
    })
  } catch (error: any) {
    console.error('[API] Get mentors error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
