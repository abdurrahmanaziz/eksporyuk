import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Allowed roles for member directory (premium members and above)
const ALLOWED_DIRECTORY_ROLES: Role[] = ['MEMBER_PREMIUM', 'MENTOR', 'ADMIN'] as Role[]

// GET - Fetch member directory with location filters
// Only MEMBER_PREMIUM and above can access and appear in directory
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to access member directory
    const userRole = session.user.role as Role
    if (!ALLOWED_DIRECTORY_ROLES.includes(userRole)) {
      return NextResponse.json({ 
        error: 'Akses ditolak. Member Directory hanya tersedia untuk Member Premium.',
        upgradeRequired: true 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const province = searchParams.get('province')
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const nearbyLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const nearbyLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 50 // km

    const skip = (page - 1) * limit

    // Build where clause - only show premium members and above
    const where: any = {
      isActive: true,
      profileCompleted: true,
      province: { not: null },
      city: { not: null },
      role: { in: ALLOWED_DIRECTORY_ROLES }, // Only premium members appear in directory
    }

    if (province) {
      where.province = { contains: province }
    }

    if (city) {
      where.city = { contains: city }
    }

    if (district) {
      where.district = { contains: district }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { city: { contains: search } },
        { province: { contains: search } },
      ]
    }

    // Get members (no _count for followers/following - doesn't exist in schema)
    let members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        province: true,
        city: true,
        district: true,
        latitude: true,
        longitude: true,
        locationVerified: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: [
        { locationVerified: 'desc' },
        { name: 'asc' }
      ],
      skip,
      take: limit,
    })

    // Add placeholder counts (followers/following not in schema)
    const membersWithCounts = members.map(m => ({
      ...m,
      _count: { followers: 0, following: 0 }
    }))

    // Calculate distance if nearby search is enabled
    let membersWithDistance: (typeof membersWithCounts[0] & { distance: number | null })[] = []
    if (nearbyLat && nearbyLng) {
      membersWithDistance = membersWithCounts.map(member => {
        let distance: number | null = null
        if (member.latitude && member.longitude) {
          distance = calculateDistance(
            nearbyLat,
            nearbyLng,
            member.latitude,
            member.longitude
          )
        }
        return { ...member, distance }
      })

      // Filter by radius and sort by distance
      membersWithDistance = membersWithDistance
        .filter(m => m.distance === null || m.distance <= radius)
        .sort((a, b) => {
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
    } else {
      membersWithDistance = membersWithCounts.map(m => ({ ...m, distance: null }))
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get location stats for filters - only count premium members
    const locationStats = await prisma.user.groupBy({
      by: ['province'],
      where: {
        isActive: true,
        profileCompleted: true,
        province: { not: null },
        role: { in: ALLOWED_DIRECTORY_ROLES },
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get cities for selected province - only count premium members
    let cityStats: any[] = []
    if (province) {
      cityStats = await prisma.user.groupBy({
        by: ['city'],
        where: {
          isActive: true,
          profileCompleted: true,
          province: { contains: province },
          city: { not: null },
          role: { in: ALLOWED_DIRECTORY_ROLES },
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })
    }

    return NextResponse.json({
      members: membersWithDistance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        provinces: locationStats.map(s => ({
          name: s.province,
          count: s._count.id
        })),
        cities: cityStats.map(s => ({
          name: s.city,
          count: s._count.id
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching member directory:', error)
    return NextResponse.json({ error: 'Failed to fetch member directory' }, { status: 500 })
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
