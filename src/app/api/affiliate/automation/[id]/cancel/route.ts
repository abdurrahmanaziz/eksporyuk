import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { automationExecutionService } from '@/lib/services/automationExecutionService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Cancel automation untuk lead tertentu
 * POST /api/affiliate/automation/[id]/cancel
 * 
 * Body:
 * {
 *   leadId: string
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
    }

    const automationId = params.id;
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Verify automation belongs to affiliate
    const automation = await prisma.affiliateAutomation.findFirst({
      where: {
        id: automationId,
        affiliateId: affiliate.id,
      },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Cancel automation
    const result = await automationExecutionService.cancelAutomation(automationId, leadId);

    return NextResponse.json({
      success: true,
      message: 'Automation cancelled successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error cancelling automation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel automation',
      },
      { status: 500 }
    );
  }
}
