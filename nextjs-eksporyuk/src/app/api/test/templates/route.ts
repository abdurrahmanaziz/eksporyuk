import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/test/templates
 * Test endpoint to check templates - Admin only
 */
export async function GET() {
  // Require admin authentication
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await prisma.brandedTemplate.count()
    const templates = await prisma.brandedTemplate.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        isActive: true,
        usageCount: true
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      count,
      templates
    })
  } catch (error) {
    console.error('Test templates error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}