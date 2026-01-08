import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/services/starsenderService'
import { oneSignalService } from '@/lib/services/oneSignalService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch single automation
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    const automation = await prisma.affiliateAutomation.findFirst({
      where: {
        id,
        affiliateId: affiliate.id,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Error fetching automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update automation
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const { name, isActive } = await request.json()

    // Verify ownership
    const existingAutomation = await prisma.affiliateAutomation.findFirst({
      where: {
        id,
        affiliateId: affiliate.id,
      },
    })

    if (!existingAutomation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const automation = await prisma.affiliateAutomation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    // Send notifications for automation status changes
    if (isActive !== undefined) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, whatsapp: true }
        })
        
        if (user) {
          const status = isActive ? 'diaktifkan' : 'dinonaktifkan'
          const statusEmoji = isActive ? '✅' : '⏸️'
          
          // Email notification
          await notificationService.sendEmail({
            to: user.email,
            template: 'automation-status-changed',
            data: {
              userName: user.email,
              automationName: automation.name,
              status,
              isActive,
              stepCount: automation.steps.length,
              triggerType: automation.triggerType.replace('_', ' ').toLowerCase(),
              automationUrl: `${process.env.NEXTAUTH_URL}/affiliate/automation`
            }
          })
          
          // WhatsApp notification
          if (user.whatsapp) {
            await starsenderService.sendMessage({
              to: user.whatsapp,
              message: `${statusEmoji} Automation Status Update\n\n` +
                       `🏷️ ${automation.name}\n` +
                       `🗘️ Status: ${status.toUpperCase()}\n` +
                       `📝 ${automation.steps.length} email steps\n\n` +
                       `${isActive ? '🚀 Automation siap bekerja otomatis!' : '⏸️ Automation dihentikan sementara.'}`
            })
          }
          
          // Push notification
          await oneSignalService.sendToUser(
            session.user.id,
            `${statusEmoji} Automation ${status}`,
            `"${automation.name}" ${isActive ? 'siap bekerja otomatis' : 'dihentikan sementara'}`,
            { url: '/affiliate/automation' }
          )
          
          console.log(`✅ Automation status change notifications sent: ${status}`)
        }
      } catch (notifError) {
        console.error('⚠️ Failed to send automation status notifications:', notifError)
      }
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete automation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verify ownership
    const existingAutomation = await prisma.affiliateAutomation.findFirst({
      where: {
        id,
        affiliateId: affiliate.id,
      },
    })

    if (!existingAutomation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    await prisma.affiliateAutomation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
