import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * SHORTCODES yang tersedia untuk Follow Up
 */
export const AVAILABLE_SHORTCODES = [
  { code: '{name}', description: 'Nama lead', example: 'Budi Santoso' },
  { code: '{first_name}', description: 'Nama depan lead', example: 'Budi' },
  { code: '{email}', description: 'Email lead', example: 'budi@email.com' },
  { code: '{phone}', description: 'No. HP lead', example: '08123456789' },
  { code: '{whatsapp}', description: 'No. WhatsApp lead', example: '08123456789' },
  { code: '{plan_name}', description: 'Nama membership', example: 'Premium Membership' },
  { code: '{plan_price}', description: 'Harga membership', example: 'Rp 500.000' },
  { code: '{affiliate_name}', description: 'Nama affiliate', example: 'John Doe' },
  { code: '{affiliate_whatsapp}', description: 'WhatsApp affiliate', example: '08199999999' },
  { code: '{payment_link}', description: 'Link pembayaran', example: 'https://...' },
  { code: '{order_date}', description: 'Tanggal order', example: '5 Desember 2025' },
  { code: '{days_since_order}', description: 'Hari sejak order', example: '3 hari' },
  { code: '{deadline}', description: 'Batas waktu pembayaran', example: '8 Desember 2025' },
]

// GET - Fetch follow-ups for membership
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch follow-ups from database
    const followUps = await (prisma as any).membershipFollowUp.findMany({
      where: { membershipId: id },
      orderBy: { sequenceOrder: 'asc' }
    })

    return NextResponse.json({
      followUps,
      shortcodes: AVAILABLE_SHORTCODES
    })
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 })
  }
}

// POST - Create new follow-up
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields - Fokus WhatsApp, email optional
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Judul follow-up wajib diisi' }, { status: 400 })
    }
    if (!body.whatsappMessage?.trim()) {
      return NextResponse.json({ error: 'Pesan WhatsApp wajib diisi' }, { status: 400 })
    }
    
    try {
      // Get current max sequence order
      const maxOrder = await (prisma as any).membershipFollowUp.aggregate({
        where: { membershipId: id },
        _max: { sequenceOrder: true }
      })
      
      const followUp = await (prisma as any).membershipFollowUp.create({
        data: {
          membershipId: id,
          title: body.title.trim(),
          description: body.description || null,
          // Email fields - use title/whatsapp as fallback for DB requirements
          emailSubject: body.emailSubject?.trim() || body.title.trim(),
          emailBody: body.emailBody?.trim() || body.whatsappMessage.trim(),
          emailCTA: body.emailCTA || null,
          emailCTALink: body.emailCTALink || null,
          whatsappMessage: body.whatsappMessage.trim(),
          shortcodes: AVAILABLE_SHORTCODES,
          sequenceOrder: body.sequenceOrder || (maxOrder._max?.sequenceOrder || 0) + 1,
          isActive: body.isActive ?? true,
        }
      })

      return NextResponse.json(followUp)
    } catch (e: any) {
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Judul follow-up sudah ada untuk membership ini' }, { status: 400 })
      }
      throw e
    }
  } catch (error: any) {
    console.error('Error creating follow-up:', error)
    return NextResponse.json({ error: 'Failed to create follow-up. Schema may need migration.' }, { status: 500 })
  }
}
