import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { generateBrandedEmail } from '@/lib/reminder-templates'
import { mailketingService } from '@/lib/services/mailketingService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/affiliate/follow-ups/send
 * Send follow-up email to a lead
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      leadEmail, 
      leadName, 
      leadPhone,
      followUpId,
      emailSubject, 
      emailBody, 
      emailCTA,
      emailCTALink,
      channel = 'EMAIL',
      transactionId,
      notes
    } = body

    if (!leadEmail) {
      return NextResponse.json({ error: 'Email lead wajib diisi' }, { status: 400 })
    }

    if (channel === 'EMAIL') {
      if (!emailSubject || !emailBody) {
        return NextResponse.json({ error: 'Subject dan body email wajib diisi' }, { status: 400 })
      }

      // Generate branded HTML email
      const htmlBody = generateBrandedEmail({
        title: emailSubject,
        greeting: `Halo ${leadName || 'Pelanggan'}!`,
        body: emailBody,
        ctaText: emailCTA,
        ctaLink: emailCTALink,
      })

      // Send email via Mailketing
      try {
        await mailketingService.sendEmail({
          to: leadEmail,
          subject: emailSubject,
          html: htmlBody,
        })
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        return NextResponse.json({ error: 'Gagal mengirim email' }, { status: 500 })
      }
    }

    // Log the follow-up
    try {
      if (followUpId) {
        await (prisma as any).followUpLog.create({
          data: {
            followUpId,
            affiliateId: affiliate.id,
            leadEmail,
            leadName: leadName || null,
            leadPhone: leadPhone || null,
            channel: channel,
            status: 'SENT',
            transactionId: transactionId || null,
            notes: notes || null,
          }
        })

        // Increment usage count
        await (prisma as any).membershipFollowUp.update({
          where: { id: followUpId },
          data: { usageCount: { increment: 1 } }
        })
      }
    } catch (e) {
      // Log model doesn't exist yet, just continue
      console.log('FollowUpLog model not available')
    }

    return NextResponse.json({ 
      success: true, 
      message: channel === 'EMAIL' 
        ? 'Email follow-up berhasil dikirim' 
        : 'Follow-up tercatat'
    })

  } catch (error) {
    console.error('Error sending follow-up:', error)
    return NextResponse.json({ error: 'Failed to send follow-up' }, { status: 500 })
  }
}
