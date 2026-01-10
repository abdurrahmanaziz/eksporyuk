import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/forwarders - List all forwarders (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const verified = searchParams.get('verified')

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { services: { contains: search } },
        { routes: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (country) {
      where.country = country
    }

    if (verified !== null && verified !== undefined && verified !== '') {
      where.verified = verified === 'true'
    }

    const [forwarders, total] = await Promise.all([
      prisma.forwarder.findMany({
        where,
        skip,
        take: limit,
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.forwarder.count({ where }),
    ])

    return NextResponse.json({
      forwarders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching forwarders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forwarders' },
      { status: 500 }
    )
  }
}

// POST /api/admin/forwarders - Create new forwarder (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      country,
      city,
      services,
      routes,
      airFreight,
      seaFreight,
      landFreight,
      customsClearance,
      contactPerson,
      phone,
      email,
      website,
      description,
      verified = false,
    } = body

    // Validate required fields
    if (!name || !country || !city || !services) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const forwarder = await prisma.forwarder.create({
      data: {
        name,
        country,
        city,
        services,
        routes,
        airFreight,
        seaFreight,
        landFreight,
        customsClearance,
        contactPerson,
        phone,
        email,
        website,
        description,
        verified,
        addedById: session.user.id,
      },
    })

    return NextResponse.json(forwarder, { status: 201 })
  } catch (error) {
    console.error('Error creating forwarder:', error)
    return NextResponse.json(
      { error: 'Failed to create forwarder' },
      { status: 500 }
    )
  }
}
