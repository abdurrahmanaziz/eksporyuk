import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all events (Products with type EVENT)
export async function GET(request: Request) {
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

    const events = await prisma.product.findMany({
      where: {
        productType: 'EVENT',
        ...dateFilter
      },
      orderBy: { eventDate: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { userProducts: true },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST - Create new event
export async function POST(request: Request) {
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
      // Event specific
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
      targetMembershipId, // Target membership untuk upgrade affiliate
      // Settings
      isActive,
      isFeatured,
      accessLevel,
      // Marketing
      seoMetaTitle,
      seoMetaDescription,
      ctaButtonText,
      // Reminder settings
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
        OR: [
          { slug: finalSlug },
          { checkoutSlug: finalCheckoutSlug }
        ]
      }
    })

    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Slug already exists' 
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
        // Event fields
        eventDate: new Date(eventDate),
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        eventDuration,
        eventUrl,
        meetingId,
        meetingPassword,
        eventVisibility: eventVisibility || 'PUBLIC',
        eventPassword,
        maxParticipants,
        // Settings
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        // Marketing
        seoMetaTitle,
        seoMetaDescription,
        ctaButtonText: ctaButtonText || 'Daftar Sekarang',
        // Target membership untuk upgrade affiliate
        upsaleTargetMemberships: targetMembershipId || null,
        // Reminders
        reminders,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
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
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
