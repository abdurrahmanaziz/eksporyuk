import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/admin/suppliers - List all suppliers (admin only)
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
        { products: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (country) {
      where.country = country
    }

    if (verified !== null && verified !== undefined && verified !== '') {
      where.verified = verified === 'true'
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
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
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/admin/suppliers - Create new supplier (admin only)
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
      products,
      capacity,
      certifications,
      moq,
      leadTime,
      contactPerson,
      phone,
      email,
      website,
      description,
      verified = false,
    } = body

    // Validate required fields
    if (!name || !country || !city || !products) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        country,
        city,
        products,
        capacity,
        certifications,
        moq,
        leadTime,
        contactPerson,
        phone,
        email,
        website,
        description,
        verified,
        addedById: session.user.id,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
