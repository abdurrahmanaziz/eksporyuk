import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const country = searchParams.get('country')
    const city = searchParams.get('city')
    const serviceType = searchParams.get('serviceType')
    const isVerified = searchParams.get('isVerified')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { routes: { contains: search } },
        { services: { contains: search } },
        { tags: { contains: search } }
      ]
    }

    if (country) where.country = country
    if (city) where.city = city
    if (serviceType) where.serviceType = serviceType
    if (isVerified) where.isVerified = isVerified === 'true'

    const [forwarders, total] = await Promise.all([
      prisma.forwarder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          addedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.forwarder.count({ where })
    ])

    return NextResponse.json({
      forwarders,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching forwarders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forwarders' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      companyName,
      contactPerson,
      email,
      phone,
      whatsapp,
      website,
      country,
      city,
      address,
      serviceType,
      routes,
      services,
      priceRange,
      minShipment,
      tags,
      notes,
      isVerified
    } = body

    if (!companyName || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, city' },
        { status: 400 }
      )
    }

    const forwarder = await prisma.forwarder.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        whatsapp,
        website,
        country: country || 'Indonesia',
        city,
        address,
        serviceType,
        routes,
        services,
        priceRange,
        minShipment,
        tags,
        notes,
        isVerified: isVerified || false,
        addedBy: session.user.id
      }
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
