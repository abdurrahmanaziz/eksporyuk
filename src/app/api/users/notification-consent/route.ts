import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Notification Consent Management API
 * POST /api/users/notification-consent - Record consent
 * GET /api/users/notification-consent - Get current consent
 * DELETE /api/users/notification-consent - Revoke consent
 * 
 * GDPR Compliance:
 * - Track consent history dengan IP dan user agent
 * - Consent valid untuk periode tertentu (default 1 tahun)
 * - Support untuk revocation
 * - Audit trail untuk compliance
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      consentGiven = true,
      channels = {
        email: true,
        push: true,
        sms: false,
        inapp: true
      },
      purpose = 'marketing'
    } = body

    // Validasi input
    if (typeof consentGiven !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid consentGiven value' },
        { status: 400 }
      )
    }

    // Ambil IP dan User Agent untuk audit trail
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-client-ip') ||
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Tentukan masa berlaku consent (default 1 tahun)
    const consentExpiry = new Date()
    consentExpiry.setFullYear(consentExpiry.getFullYear() + 1)

    // Cek apakah sudah ada consent sebelumnya
    const existingConsent = await prisma.notificationConsent.findUnique({
      where: { userId: session.user.id }
    })

    // Jika ada consent lama dan revoke baru, catat revocation time
    let revocationTimestamp = null
    if (existingConsent && !consentGiven) {
      revocationTimestamp = new Date()
    }

    // Upsert consent record
    const consent = await prisma.notificationConsent.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        consentGiven,
        channels,
        purpose,
        ipAddress: ip,
        userAgent,
        consentTimestamp: new Date(),
        consentExpiry,
        revocationTimestamp
      },
      update: {
        consentGiven,
        channels,
        purpose,
        ipAddress: ip,
        userAgent,
        consentTimestamp: new Date(),
        consentExpiry,
        revocationTimestamp
      }
    })

    // Update user notification preferences berdasarkan consent
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications: channels.email ?? true,
        whatsappNotifications: channels.sms ?? false
      }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'NOTIFICATION_CONSENT_UPDATED',
          entity: 'NotificationConsent',
          ipAddress: ip.split(',')[0],
          metadata: {
            consentGiven,
            channels,
            purpose,
            consentExpiry: consentExpiry.toISOString()
          }
        }
      })
    } catch (logError) {
      console.warn('[Consent] Activity log failed:', logError)
    }

    return NextResponse.json({
      success: true,
      consent: {
        consentGiven,
        channels,
        purpose,
        expiresAt: consentExpiry,
        recordedAt: new Date()
      }
    })
  } catch (error) {
    console.error('[Notification Consent] Error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const consent = await prisma.notificationConsent.findUnique({
      where: { userId: session.user.id }
    })

    if (!consent) {
      return NextResponse.json({
        consent: null,
        message: 'No consent record found'
      })
    }

    // Cek apakah consent masih valid
    const isExpired = new Date() > consent.consentExpiry
    const isRevoked = consent.revocationTimestamp !== null

    return NextResponse.json({
      consent: {
        consentGiven: consent.consentGiven && !isExpired && !isRevoked,
        channels: consent.channels,
        purpose: consent.purpose,
        consentedAt: consent.consentTimestamp,
        expiresAt: consent.consentExpiry,
        revokedAt: consent.revocationTimestamp,
        revocationReason: consent.revocationReason,
        isExpired,
        isRevoked
      }
    })
  } catch (error) {
    console.error('[Notification Consent GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/notification-consent
 * Revoke notification consent
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reason = 'User requested' } = body

    const consent = await prisma.notificationConsent.update({
      where: { userId: session.user.id },
      data: {
        consentGiven: false,
        revocationTimestamp: new Date(),
        revocationReason: reason
      }
    })

    // Disable all notification preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications: false,
        whatsappNotifications: false
      }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'NOTIFICATION_CONSENT_REVOKED',
          entity: 'NotificationConsent',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          metadata: {
            reason,
            revokedAt: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.warn('[Consent] Activity log failed:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Consent revoked successfully'
    })
  } catch (error) {
    console.error('[Notification Consent DELETE] Error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to revoke consent' },
      { status: 500 }
    )
  }
}
