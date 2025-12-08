import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'

    const now = new Date()
    let where: any = {}

    if (filter === 'active') {
      where = {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      }
    } else if (filter === 'inactive') {
      where = { isActive: false }
    } else if (filter === 'scheduled') {
      where = {
        isActive: true,
        startDate: { gt: now }
      }
    } else if (filter === 'expired') {
      where = {
        endDate: { lt: now }
      }
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        placement: data.placement,
        displayType: data.displayType,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        buttonColor: data.buttonColor,
        buttonTextColor: data.buttonTextColor,
        priority: data.priority || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        viewLimit: data.viewLimit,
        clickLimit: data.clickLimit,
        dailyBudget: data.dailyBudget,
        createdBy: session.user.id,
        isSponsored: data.isSponsored ?? false,
        sponsorName: data.sponsorName,
        sponsorLogo: data.sponsorLogo,
        targetRoles: data.targetRoles || [],
        targetMemberships: data.targetMemberships || [],
        targetProvinces: data.targetProvinces || [],
      },
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
