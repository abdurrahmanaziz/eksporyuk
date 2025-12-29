import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Fetch user profile with location data
export async function GET(request: NextRequest) {
  try {
    console.log('[PROFILE_API] GET request received')
    const session = await getServerSession(authOptions)
    
    console.log('[PROFILE_API] Session:', !!session, 'User ID:', session?.user?.id)
    if (!session?.user?.id) {
      console.log('[PROFILE_API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[PROFILE_API] Fetching user from database...')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        phone: true,
        whatsapp: true,
        province: true,
        city: true,
        district: true,
        address: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        locationVerified: true,
        profileCompleted: true,
        role: true,
        createdAt: true,
      }
    })

    console.log('[PROFILE_API] User found:', !!user)
    if (!user) {
      console.log('[PROFILE_API] User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate profile completion percentage
    const requiredFields = ['name', 'email', 'phone', 'province', 'city']
    const completedFields = requiredFields.filter(field => user[field as keyof typeof user])
    const completionPercent = Math.round((completedFields.length / requiredFields.length) * 100)

    console.log('[PROFILE_API] Returning success response, completion:', completionPercent + '%')
    return NextResponse.json({
      user,
      completionPercent,
      isComplete: completionPercent === 100
    })

  } catch (error) {
    console.error('[PROFILE_API] Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      username,
      bio,
      phone,
      whatsapp,
      province,
      city,
      district,
      address,
      postalCode,
      latitude,
      longitude,
      oneSignalPlayerId,
    } = body

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: session.user.id }
        }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
      }
    }

    // Calculate if profile is complete
    const requiredFields = { name, phone, province, city }
    const isProfileComplete = Object.values(requiredFields).every(field => field && field.trim() !== '')

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || undefined,
        username: username?.trim() || undefined,
        bio: bio?.trim() || undefined,
        phone: phone?.trim() || undefined,
        whatsapp: whatsapp?.trim() || undefined,
        province: province?.trim() || undefined,
        city: city?.trim() || undefined,
        district: district?.trim() || undefined,
        address: address?.trim() || undefined,
        postalCode: postalCode?.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        locationVerified: !!(latitude && longitude),
        profileCompleted: isProfileComplete,
        oneSignalPlayerId: oneSignalPlayerId || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        phone: true,
        whatsapp: true,
        province: true,
        city: true,
        district: true,
        address: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        locationVerified: true,
        profileCompleted: true,
      }
    })

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      user: updatedUser,
      isComplete: isProfileComplete
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
