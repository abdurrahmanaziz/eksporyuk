import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { mailketingService } from '@/lib/services/mailketingService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Send broadcast (deduct credits and create logs)
export async function POST(
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
      include: {
        credit: true,
      },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get broadcast
    const broadcast = await prisma.affiliateBroadcast.findUnique({
      where: {
        id: params.id,
        affiliateId: affiliate.id,
      },
    })

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Check if already sent
    if (broadcast.status === 'SENT') {
      return NextResponse.json({ error: 'Broadcast already sent' }, { status: 400 })
    }

    // Get recipients based on target segment
    const whereClause: any = { 
      affiliateId: affiliate.id,
      email: { not: null } // Only leads with email
    }
    
    if (broadcast.targetSegment) {
      const segment = broadcast.targetSegment as any
      if (segment.status) whereClause.status = segment.status
      if (segment.source) whereClause.source = segment.source
      if (segment.tags && segment.tags.length > 0) {
        whereClause.tags = {
          some: {
            tag: { in: segment.tags }
          }
        }
      }
    }

    const recipients = await prisma.affiliateLead.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found with valid email addresses' }, { status: 400 })
    }

    // Calculate credit cost (1 credit per email)
    const creditCost = recipients.length

    // Check credit balance
    let credit = affiliate.credit
    if (!credit) {
      credit = await prisma.affiliateCredit.create({
        data: {
          affiliateId: affiliate.id,
          balance: 0,
        },
      })
    }

    if (credit.balance < creditCost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: creditCost,
        available: credit.balance,
      }, { status: 400 })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits
      const balanceBefore = credit!.balance
      const balanceAfter = balanceBefore - creditCost

      await tx.affiliateCreditTransaction.create({
        data: {
          creditId: credit!.id,
          affiliateId: affiliate.id,
          type: 'DEDUCT',
          amount: creditCost,
          balanceBefore,
          balanceAfter,
          description: `Email broadcast: ${broadcast.name}`,
          referenceType: 'BROADCAST',
          referenceId: broadcast.id,
          status: 'COMPLETED',
        },
      })

      await tx.affiliateCredit.update({
        where: { id: credit!.id },
        data: {
          balance: balanceAfter,
          totalUsed: credit!.totalUsed + creditCost,
        },
      })

      // Create broadcast logs for each recipient
      await tx.affiliateBroadcastLog.createMany({
        data: recipients.map(recipient => ({
          broadcastId: broadcast.id,
          leadId: recipient.id,
          status: 'PENDING',
        })),
      })

      // Update broadcast status to SENDING
      const updatedBroadcast = await tx.affiliateBroadcast.update({
        where: { id: broadcast.id },
        data: {
          status: 'SENDING',
          creditUsed: creditCost,
          sentAt: new Date(),
        },
      })

      return {
        broadcast: updatedBroadcast,
        creditBalance: balanceAfter,
        recipientsCount: recipients.length,
      }
    })

    // Send emails asynchronously using mailketingService
    // In production, this should be a background job (Bull, BullMQ, etc.)
    setImmediate(async () => {
      try {
        console.log(`[BROADCAST] Starting email send for broadcast ${broadcast.id}`)
        
        const leadIds = recipients.map(r => r.id)
        const sendResult = await mailketingService.sendBroadcast({
          affiliateId: affiliate.id,
          broadcastId: broadcast.id,
          leadIds,
        })

        console.log(`[BROADCAST] Completed: ${sendResult.sent} sent, ${sendResult.failed} failed`)
      } catch (error) {
        console.error('[BROADCAST] Error sending emails:', error)
        
        // Update broadcast status to failed
        await prisma.affiliateBroadcast.update({
          where: { id: broadcast.id },
          data: {
            status: 'FAILED',
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      broadcast: result.broadcast,
      creditUsed: creditCost,
      creditBalance: result.creditBalance,
      recipients: result.recipientsCount,
      message: 'Broadcast is being sent in the background',
    })
  } catch (error) {
    console.error('Error sending broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
