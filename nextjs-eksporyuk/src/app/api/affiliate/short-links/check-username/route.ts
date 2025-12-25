import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/short-links/check-username
 * Check if username is available
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')
    const domainId = searchParams.get('domainId')
    const slug = searchParams.get('slug') || null
    
    if (!username || !domainId) {
      return NextResponse.json(
        { error: 'Username and domainId are required' },
        { status: 400 }
      )
    }
    
    // Validate username format
    if (!/^[a-z0-9-]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        reason: 'Username can only contain lowercase letters, numbers, and hyphens'
      })
    }
    
    // Check if already taken
    const existing = await prisma.affiliateShortLink.findFirst({
      where: {
        domainId,
        username,
        slug
      }
    })
    
    if (existing) {
      return NextResponse.json({
        available: false,
        reason: 'This short link is already taken'
      })
    }
    
    return NextResponse.json({
      available: true
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json(
      { error: 'Failed to check username' },
      { status: 500 }
    )
  }
}
