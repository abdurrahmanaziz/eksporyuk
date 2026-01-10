import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Fetch public events (Products with type EVENT)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'upcoming' // upcoming, ongoing, past, all
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    const now = new Date()
    let dateFilter: any = {}

    if (status === 'upcoming') {
      dateFilter = { eventDate: { gt: now } }
    } else if (status === 'ongoing') {
      dateFilter = {
        eventDate: { lte: now },
        OR: [
          { eventEndDate: { gte: now } },
          { eventEndDate: null }
        ]
      }
    } else if (status === 'past') {
      dateFilter = {
        OR: [
          { eventEndDate: { lt: now } },
          { AND: [{ eventDate: { lt: now } }, { eventEndDate: null }] }
        ]
      }
    }

    // Build where clause
    const where: any = {
      productType: 'EVENT',
      isActive: true,
      productStatus: 'PUBLISHED',
      eventVisibility: 'PUBLIC', // Only public events
      ...dateFilter
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (featured) {
      where.isFeatured = true
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get events
    const events = await prisma.product.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { eventDate: status === 'past' ? 'desc' : 'asc' }
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        shortDescription: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        category: true,
        eventDate: true,
        eventEndDate: true,
        eventUrl: true,
        maxParticipants: true,
        isActive: true,
        isFeatured: true,
        productStatus: true,
      }
    })

    // Calculate sold count and check availability
    const eventsWithStats = events.map(event => ({
      ...event,
      soldCount: 0,
      isAvailable: true
    }))

    // Get unique categories
    const categories = await prisma.product.findMany({
      where: {
        productType: 'EVENT',
        isActive: true,
        productStatus: 'PUBLISHED',
        eventVisibility: 'PUBLIC',
        category: { not: null }
      },
      select: { category: true },
      distinct: ['category']
    })

    return NextResponse.json({
      events: eventsWithStats,
      categories: categories.map(c => c.category).filter(Boolean),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
