import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/member/profile-status - Get profile completion status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        bio: true,
        avatar: true,
        province: true,
        city: true,
        profileCompleted: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define required fields
    const requiredFields = [
      { key: 'name', label: 'Nama' },
      { key: 'whatsapp', label: 'WhatsApp' },
    ]

    // Define optional but recommended fields
    const optionalFields = [
      { key: 'phone', label: 'Nomor Telepon' },
      { key: 'bio', label: 'Bio' },
      { key: 'avatar', label: 'Foto Profil' },
      { key: 'province', label: 'Provinsi' },
      { key: 'city', label: 'Kota' },
    ]

    // Check required fields
    const missingRequired: string[] = []
    let completedRequired = 0
    
    for (const field of requiredFields) {
      const value = user[field.key as keyof typeof user]
      if (!value || (typeof value === 'string' && !value.trim())) {
        missingRequired.push(field.label)
      } else {
        completedRequired++
      }
    }

    // Check optional fields
    const missingOptional: string[] = []
    let completedOptional = 0
    
    for (const field of optionalFields) {
      const value = user[field.key as keyof typeof user]
      if (!value || (typeof value === 'string' && !value.trim())) {
        missingOptional.push(field.label)
      } else {
        completedOptional++
      }
    }

    // Calculate progress
    const totalFields = requiredFields.length + optionalFields.length
    const completedFields = completedRequired + completedOptional
    const progress = Math.round((completedFields / totalFields) * 100)

    // Profile is complete if all required fields are filled
    const isComplete = missingRequired.length === 0

    // Update profileCompleted if just completed
    if (isComplete && !user.profileCompleted) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileCompleted: true },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        isComplete,
        profileCompleted: user.profileCompleted,
        missingFields: [...missingRequired, ...missingOptional],
        missingRequired,
        missingOptional,
        completedCount: completedFields,
        totalRequired: requiredFields.length,
        totalFields,
        progress,
        profile: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          bio: user.bio,
          avatar: user.avatar,
          province: user.province,
          city: user.city,
        },
      },
    })
  } catch (error) {
    console.error('Error getting profile status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
