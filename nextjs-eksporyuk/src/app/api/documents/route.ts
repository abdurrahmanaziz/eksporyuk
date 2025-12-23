import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const whereClause: any = { active: true }
    if (category) whereClause.category = category

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { uploadDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        visibility: true,
        uploadDate: true,
        views: true,
        downloads: true,
        active: true,
        fileType: true
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[DOCUMENTS LIST ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
