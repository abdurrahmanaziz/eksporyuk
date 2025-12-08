import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'

/**
 * GET /api/admin/short-links/[id]/qrcode
 * Generate QR code for any short link (admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Get short link
    const shortLink = await prisma.affiliateShortLink.findUnique({
      where: { id },
      include: {
        domain: true,
        affiliate: {
          include: {
            user: true
          }
        }
      }
    })
    
    if (!shortLink) {
      return NextResponse.json(
        { error: 'Short link not found' },
        { status: 404 }
      )
    }
    
    // Build full URL
    const url = `https://${shortLink.domain.domain}/${shortLink.username}${shortLink.slug ? '/' + shortLink.slug : ''}`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return NextResponse.json({
      url,
      qrCode: qrCodeDataUrl,
      affiliate: {
        name: shortLink.affiliate.user.name,
        email: shortLink.affiliate.user.email
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
