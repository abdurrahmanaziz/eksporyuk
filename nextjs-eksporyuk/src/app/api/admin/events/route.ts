import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Fetch all events (Products with type EVENT)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // upcoming, ongoing, past, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit

    const now = new Date()
    let dateFilter: any = {}

    if (status === 'upcoming') {
      dateFilter = { eventDate: { gt: now } }
    } else if (status === 'ongoing') {
      dateFilter = {
        eventDate: { lte: now },
        eventEndDate: { gte: now }
      }
    } else if (status === 'past') {
      dateFilter = {
        OR: [
          { eventEndDate: { lt: now } },
          { AND: [{ eventDate: { lt: now } }, { eventEndDate: null }] }
        ]
      }
    }

    const whereCondition = {
      productType: 'EVENT',
      ...dateFilter,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    // Get total count for pagination
    const total = await prisma.product.count({
      where: whereCondition
    })

    const events = await prisma.product.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        shortDescription: true,
        eventDate: true,
        eventEndDate: true,
        eventDuration: true,
        eventUrl: true,
        meetingId: true,
        meetingPassword: true,
        maxParticipants: true,
        eventVisibility: true,
        isActive: true,
        isFeatured: true,
        productStatus: true,
        accessLevel: true,
        salesPageUrl: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { eventDate: 'desc' },
      skip,
      take: limit
    })

    // Get attendee counts and creators in parallel
    const eventIds = events.map(e => e.id)
    const creatorIds = [...new Set(events.map(e => e.creatorId))]

    const [attendeeCounts, creators] = await Promise.all([
      prisma.userProduct.groupBy({
        by: ['productId'],
        where: { productId: { in: eventIds } },
        _count: true
      }),
      prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true, email: true }
      })
    ])

    const attendeeMap = new Map(
      attendeeCounts.map(ac => [ac.productId, ac._count])
    )
    const creatorMap = new Map(
      creators.map(c => [c.id, c])
    )

    // Enrich events with attendee counts and creator info
    const enrichedEvents = events.map((event) => {
      const { creatorId, ...eventData } = event
      return {
        ...eventData,
        creator: creatorMap.get(creatorId) || null,
        _count: {
          UserProduct: attendeeMap.get(event.id) || 0
        }
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      events: enrichedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      checkoutSlug,
      description,
      shortDescription,
      price,
      originalPrice,
      thumbnail,
      category,
      tags,
      eventDate,
      eventEndDate,
      eventDuration,
      eventUrl,
      meetingId,
      meetingPassword,
      eventVisibility,
      eventPassword,
      maxParticipants,
      membershipIds,
      groupIds,
      targetMembershipId,
      isActive,
      isFeatured,
      accessLevel,
      seoMetaTitle,
      seoMetaDescription,
      ctaButtonText,
      reminders,
    } = body

    // Validation
    if (!name || !eventDate) {
      return NextResponse.json({
        error: 'Name and event date are required'
      }, { status: 400 })
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const finalCheckoutSlug = checkoutSlug || `event-${finalSlug}`

    // Check slug uniqueness
    const existingProduct = await prisma.product.findFirst({
      where: {
        AND: [
          {
            OR: [
              { slug: finalSlug },
              { checkoutSlug: finalCheckoutSlug }
            ]
          },
          { id: { not: undefined } } // Ensure we're checking existing products
        ]
      }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: `Slug "${finalSlug}" atau checkout slug "${finalCheckoutSlug}" sudah digunakan`
      }, { status: 400 })
    }

    const event = await prisma.product.create({
      data: {
        creatorId: session.user.id,
        name,
        slug: finalSlug,
        checkoutSlug: finalCheckoutSlug,
        description: description || '',
        shortDescription,
        price: price || 0,
        originalPrice,
        thumbnail,
        category: category || 'event',
        tags,
        productType: 'EVENT',
        productStatus: isActive ? 'PUBLISHED' : 'DRAFT',
        accessLevel: accessLevel || 'PUBLIC',
        eventDate: new Date(eventDate),
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        eventDuration,
        eventUrl,
        meetingId,
        meetingPassword,
        eventVisibility: eventVisibility || 'PUBLIC',
        eventPassword,
        maxParticipants,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        seoMetaTitle,
        seoMetaDescription,
        ctaButtonText: ctaButtonText || 'Daftar Sekarang',
        upsaleTargetMemberships: targetMembershipId || null,
        reminders,
      },
    })

    // Create EventMembership relations
    if (eventVisibility === 'MEMBERSHIP' && membershipIds && membershipIds.length > 0) {
      await prisma.eventMembership.createMany({
        data: membershipIds.map((membershipId: string) => ({
          productId: event.id,
          membershipId
        })),
        skipDuplicates: true
      })
    }

    // Create EventGroup relations
    if (eventVisibility === 'GROUP' && groupIds && groupIds.length > 0) {
      await prisma.eventGroup.createMany({
        data: groupIds.map((groupId: string) => ({
          productId: event.id,
          groupId
        })),
        skipDuplicates: true
      })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to create event',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
