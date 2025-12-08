import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/branded-templates
 * Fetch active branded templates for all users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const roleTarget = searchParams.get('roleTarget') || ''
    const search = searchParams.get('search') || ''
    const defaultsOnly = searchParams.get('defaultsOnly') === 'true'

    const where: any = {
      isActive: true
    }
    
    if (category) where.category = category
    if (type) where.type = type
    if (defaultsOnly) where.isDefault = true
    
    // Role-based filtering
    if (roleTarget) {
      where.OR = [
        { roleTarget: roleTarget },
        { roleTarget: 'ALL' },
        { roleTarget: null }
      ]
    } else {
      // Filter by user's role
      where.OR = [
        { roleTarget: session.user.role },
        { roleTarget: 'ALL' },
        { roleTarget: null }
      ]
    }
    
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const templates = await prisma.brandedTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        type: true,
        roleTarget: true,
        subject: true,
        content: true,
        ctaText: true,
        ctaLink: true,
        priority: true,
        isDefault: true,
        tags: true,
        variables: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { priority: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('[Public Branded Templates API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}