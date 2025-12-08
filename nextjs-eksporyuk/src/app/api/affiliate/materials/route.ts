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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const category = searchParams.get('category') || 'all'

    // Build where clause
    const whereClause: any = {
      isActive: true,
    }

    if (type !== 'all') {
      whereClause.type = type
    }

    if (category !== 'all') {
      whereClause.category = category
    }

    // Get materials
    const materials = await prisma.affiliateMaterial.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get unique categories
    const allMaterials = await prisma.affiliateMaterial.findMany({
      where: { isActive: true },
      select: { category: true },
    })

    const categories = Array.from(
      new Set(allMaterials.map(m => m.category).filter(Boolean))
    ) as string[]

    return NextResponse.json({
      materials,
      categories,
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}
