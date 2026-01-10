import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { DEFAULT_FOLLOW_UP_TEMPLATES } from '@/lib/follow-up-templates'
import { AVAILABLE_SHORTCODES } from '../route'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/membership-plans/[id]/follow-ups/generate-defaults
 * Generate default follow-up templates for a membership
 */
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

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check existing follow-ups
    let existingCount = 0
    try {
      existingCount = await (prisma as any).membershipFollowUp.count({
        where: { membershipId: id }
      })
    } catch (e) {
      // Model doesn't exist
    }

    if (existingCount > 0) {
      return NextResponse.json({ 
        error: 'Membership sudah memiliki follow-up templates. Hapus dulu jika ingin generate ulang.',
        existingCount 
      }, { status: 400 })
    }

    // Create default templates
    const createdTemplates = []
    for (const template of DEFAULT_FOLLOW_UP_TEMPLATES) {
      try {
        const created = await (prisma as any).membershipFollowUp.create({
          data: {
            membershipId: id,
            title: template.title,
            description: template.description,
            emailSubject: template.emailSubject,
            emailBody: template.emailBody,
            emailCTA: template.emailCTA || null,
            emailCTALink: template.emailCTALink || null,
            whatsappMessage: template.whatsappMessage || null,
            shortcodes: AVAILABLE_SHORTCODES,
            sequenceOrder: template.sequenceOrder,
            isActive: true,
          }
        })
        createdTemplates.push(created)
      } catch (e) {
        console.error('Error creating template:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdTemplates.length} template berhasil dibuat`,
      templates: createdTemplates
    })

  } catch (error: any) {
    console.error('Error generating default templates:', error)
    return NextResponse.json({ error: 'Failed to generate templates' }, { status: 500 })
  }
}
