import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/databases/forwarders - List all forwarders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const city = searchParams.get('city') || ''
    const verified = searchParams.get('verified')

    const where: any = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { services: { contains: search, mode: 'insensitive' } },
        { routes: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (country) {
      where.country = country
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (verified === 'true') {
      where.isVerified = true
    } else if (verified === 'false') {
      where.isVerified = false
    }

    const [forwarders, total] = await Promise.all([
      prisma.forwarder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.forwarder.count({ where })
    ])

    return NextResponse.json({
      forwarders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Get forwarders error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/databases/forwarders - Create new forwarder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.companyName || !body.city) {
      return NextResponse.json(
        { error: 'Company name and city are required' },
        { status: 400 }
      )
    }

    const forwarder = await prisma.forwarder.create({
      data: {
        companyName: body.companyName,
        country: body.country || 'Indonesia',
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
        addedBy: session.user.id
      }
    })

    return NextResponse.json({ forwarder }, { status: 201 })
  } catch (error: any) {
    console.error('Create forwarder error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
