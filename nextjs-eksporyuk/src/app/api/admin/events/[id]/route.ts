import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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
      include: {
        userProducts: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        eventMemberships: {
          include: {
            membership: {
              select: { id: true, name: true }
            }
          }
        },
        eventGroups: {
          include: {
            group: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { userProducts: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Map upsaleTargetMemberships to targetMembershipId for frontend
    const eventWithAlias = {
      ...event,
      targetMembershipId: event.upsaleTargetMemberships
    }

    return NextResponse.json({ event: eventWithAlias })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
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
      targetMembershipId, // Target membership untuk upgrade affiliate
      isActive,
      isFeatured,
      accessLevel,
      seoMetaTitle,
      seoMetaDescription,
      ctaButtonText,
      reminders,
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
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
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

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
