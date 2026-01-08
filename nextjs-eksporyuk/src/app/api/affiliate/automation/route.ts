import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/services/starsenderService'
import { oneSignalService } from '@/lib/services/oneSignalService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all automations for affiliate
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const automations = await prisma.affiliateAutomation.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ automations })
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new automation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { name, triggerType } = await request.json()

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'Name and trigger type are required' },
        { status: 400 }
      )
    }

    const validTriggers = ['AFTER_OPTIN', 'AFTER_ZOOM', 'PENDING_PAYMENT', 'WELCOME']
    if (!validTriggers.includes(triggerType)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
    }

    const automation = await prisma.affiliateAutomation.create({
      data: {
        affiliateId: affiliate.id,
        name,
        triggerType,
        isActive: false, // Start as inactive until steps are added
      },
      include: {
        steps: true,
      },
    })

    // Send multi-channel notifications for automation creation
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, whatsapp: true }
      })
      
      if (user) {
        // Email notification
        await notificationService.sendEmail({
          to: user.email,
          template: 'automation-created',
          data: {
            userName: user.email,
            automationName: name,
            triggerType: triggerType.replace('_', ' ').toLowerCase(),
            automationUrl: `${process.env.NEXTAUTH_URL}/affiliate/automation`,
            nextSteps: [
              'Tambahkan email steps untuk sequence',
              'Atur delay time antar email',
              'Aktifkan automation untuk mulai bekerja'
            ]
          }
        })
        
        // WhatsApp notification
        if (user.whatsapp) {
          await starsenderService.sendMessage({
            to: user.whatsapp,
            message: `🤖 Automation Email Sequence Baru!\n\n` +
                     `🏷️ Nama: ${name}\n` +
                     `⚡ Trigger: ${triggerType.replace('_', ' ')}\n\n` +
                     `Selanjutnya:\n` +
                     `1. Tambah email steps\n` +
                     `2. Atur delay timing\n` +
                     `3. Aktifkan automation\n\n` +
                     `Kelola di: ${process.env.NEXTAUTH_URL}/affiliate/automation`
          })
        }
        
        // Push notification
        await oneSignalService.sendToUser(
          session.user.id,
          `🤖 Automation "${name}" Dibuat!`,
          `Trigger: ${triggerType.replace('_', ' ')}. Tambahkan email steps untuk mengaktifkan.`,
          { url: '/affiliate/automation' }
        )
        
        console.log('✅ Automation creation notifications sent')
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send automation notifications:', notifError)
      // Don't fail the main request for notification errors
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
