import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/databases/forwarders/[id] - Get single forwarder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const forwarder = await prisma.forwarder.findUnique({
      where: { id },
      include: {
        addedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!forwarder) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 })
    }

    return NextResponse.json({ forwarder })
  } catch (error: any) {
    console.error('Get forwarder error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/databases/forwarders/[id] - Update forwarder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const forwarder = await prisma.forwarder.update({
      where: { id },
      data: {
        companyName: body.companyName,
        country: body.country,
        city: body.city,
        address: body.address,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        website: body.website,
        serviceType: body.serviceType,
        routes: body.routes,
        services: body.services,
        priceRange: body.priceRange,
        minShipment: body.minShipment,
        tags: body.tags,
        notes: body.notes,
        isVerified: body.isVerified,
        rating: body.rating
      }
    })

    return NextResponse.json({ forwarder })
  } catch (error: any) {
    console.error('Update forwarder error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/databases/forwarders/[id] - Delete forwarder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.forwarder.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete forwarder error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/databases/forwarders/[id]/verify - Toggle verification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const forwarder = await prisma.forwarder.update({
      where: { id },
      data: {
        isVerified: body.isVerified,
        verifiedBy: body.isVerified ? session.user.id : null,
        verifiedAt: body.isVerified ? new Date() : null
      }
    })

    return NextResponse.json({ forwarder })
  } catch (error: any) {
    console.error('Verify forwarder error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
