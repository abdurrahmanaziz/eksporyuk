import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Get single event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const event = await prisma.product.findFirst({
      where: {
        id,
        productType: 'EVENT'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        description: true,
        shortDescription: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        category: true,
        tags: true,
        productStatus: true,
        eventDate: true,
        eventEndDate: true,
        eventDuration: true,
        eventUrl: true,
        meetingId: true,
        meetingPassword: true,
        eventVisibility: true,
        eventPassword: true,
        maxParticipants: true,
        isActive: true,
        isFeatured: true,
        accessLevel: true,
        salesPageUrl: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        seoMetaTitle: true,
        seoMetaDescription: true,
        ctaButtonText: true,
        reminders: true,
        creatorId: true,
        upsaleTargetMemberships: true,
        commissionType: true,
        affiliateCommissionRate: true,
        upsaleDiscount: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get creator info
    const creator = await prisma.user.findUnique({
      where: { id: event.creatorId },
      select: { id: true, name: true, email: true }
    })

    // Get attendee count
    const attendeeCount = await prisma.userProduct.count({
      where: { productId: id }
    })

    // Map upsaleTargetMemberships to targetMembershipId for frontend
    const { creatorId, ...eventData } = event
    const eventWithAlias = {
      ...eventData,
      creator,
      targetMembershipId: event.upsaleTargetMemberships,
      _count: { UserProduct: attendeeCount }
    }

    return NextResponse.json({ event: eventWithAlias })
  } catch (error) {
    console.error('Error fetching event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to fetch event',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// PUT - Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

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
      commissionType,
      affiliateCommissionRate,
    } = body

    // Check if event exists
    const existingEvent = await prisma.product.findFirst({
      where: { id, productType: 'EVENT' }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingEvent.slug) {
      const slugExists = await prisma.product.findFirst({
        where: { slug, id: { not: id } }
      })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const event = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(checkoutSlug && { checkoutSlug }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(price !== undefined && { price }),
        ...(originalPrice !== undefined && { originalPrice }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(eventEndDate !== undefined && {
          eventEndDate: eventEndDate ? new Date(eventEndDate) : null
        }),
        ...(eventDuration !== undefined && { eventDuration }),
        ...(eventUrl !== undefined && { eventUrl }),
        ...(meetingId !== undefined && { meetingId }),
        ...(meetingPassword !== undefined && { meetingPassword }),
        ...(eventVisibility !== undefined && { eventVisibility }),
        ...(eventPassword !== undefined && { eventPassword }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(isActive !== undefined && {
          isActive,
          productStatus: isActive ? 'PUBLISHED' : 'DRAFT'
        }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(accessLevel !== undefined && { accessLevel }),
        ...(seoMetaTitle !== undefined && { seoMetaTitle }),
        ...(seoMetaDescription !== undefined && { seoMetaDescription }),
        ...(ctaButtonText !== undefined && { ctaButtonText }),
        ...(reminders !== undefined && { reminders }),
        ...(targetMembershipId !== undefined && { upsaleTargetMemberships: targetMembershipId || null }),
        ...(commissionType !== undefined && { commissionType }),
        ...(affiliateCommissionRate !== undefined && { affiliateCommissionRate }),
      },
    })

    // Update EventMembership relations
    if (eventVisibility === 'MEMBERSHIP') {
      // Delete existing relations
      await prisma.eventMembership.deleteMany({
        where: { productId: id }
      })

      // Create new relations
      if (membershipIds && membershipIds.length > 0) {
        await prisma.eventMembership.createMany({
          data: membershipIds.map((membershipId: string) => ({
            productId: id,
            membershipId
          })),
          skipDuplicates: true
        })
      }
    }

    // Update EventGroup relations
    if (eventVisibility === 'GROUP') {
      // Delete existing relations
      await prisma.eventGroup.deleteMany({
        where: { productId: id }
      })

      // Create new relations
      if (groupIds && groupIds.length > 0) {
        await prisma.eventGroup.createMany({
          data: groupIds.map((groupId: string) => ({
            productId: id,
            groupId
          })),
          skipDuplicates: true
        })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to update event',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const event = await prisma.product.findFirst({
      where: { id, productType: 'EVENT' },
      include: {
        _count: { select: { userProducts: true } }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if has attendees
    if (event._count.userProducts > 0) {
      return NextResponse.json({
        error: 'Cannot delete event with attendees. Deactivate it instead.'
      }, { status: 400 })
    }

    // Delete related records
    await prisma.eventMembership.deleteMany({
      where: { productId: id }
    })

    await prisma.eventGroup.deleteMany({
      where: { productId: id }
    })

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to delete event',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (form settings)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const {
      salesPageUrl,
      formLogo,
      formBanner,
      formDescription,
    } = body

    const event = await prisma.product.update({
      where: { id },
      data: {
        ...(salesPageUrl !== undefined && { salesPageUrl: salesPageUrl || null }),
        ...(formLogo !== undefined && { formLogo: formLogo || null }),
        ...(formBanner !== undefined && { formBanner: formBanner || null }),
        ...(formDescription !== undefined && { formDescription: formDescription || null }),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error patching event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to update event',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
