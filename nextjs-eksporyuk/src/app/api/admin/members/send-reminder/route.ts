import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const { type = 'all' } = await request.json()

    // Query users with incomplete profiles based on type
    let whereClause: any = {}

    if (type === 'no-location') {
      // Users without province or city
      whereClause = {
        OR: [
          { province: null },
          { province: '' },
          { city: null },
          { city: '' }
        ]
      }
    } else if (type === 'no-gps') {
      // Users with location but no GPS
      whereClause = {
        AND: [
          { province: { not: null } },
          { province: { not: '' } },
          { city: { not: null } },
          { city: { not: '' } },
          {
            OR: [
              { gpsLatitude: null },
              { gpsLongitude: null }
            ]
          }
        ]
      }
    } else {
      // All users with incomplete profiles
      whereClause = {
        OR: [
          { province: null },
          { province: '' },
          { city: null },
          { city: '' },
          { gpsLatitude: null },
          { gpsLongitude: null },
          { bio: null },
          { bio: '' },
          { phoneNumber: null },
          { phoneNumber: '' }
        ]
      }
    }

    const incompleteUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        province: true,
        city: true,
        gpsLatitude: true,
        gpsLongitude: true
      }
    })

    // Create notifications for each user
    const notifications = await Promise.all(
      incompleteUsers.map(user => 
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title: 'Lengkapi Profil Anda',
            message: 'Silakan lengkapi profil Anda dengan informasi lokasi, bio, dan nomor telepon untuk pengalaman yang lebih baik.',
            link: '/profile',
            metadata: JSON.stringify({
              reminderType: type,
              sentBy: session.user.id,
              sentAt: new Date().toISOString()
            })
          }
        })
      )
    )

    console.log(`[REMINDER] Sent ${notifications.length} notifications to users with ${type} profile issues`)

    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim ${notifications.length} reminder`,
      details: {
        type,
        totalIncomplete: incompleteUsers.length,
        notificationsSent: notifications.length,
        users: incompleteUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name
        }))
      }
    })
  } catch (error) {
    console.error('[REMINDER] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
