import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { automationExecutionService } from '@/lib/services/automationExecutionService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Trigger automation untuk lead tertentu
 * POST /api/affiliate/automation/trigger
 * 
 * Body:
 * {
 *   leadId: string
 *   triggerType: "AFTER_OPTIN" | "AFTER_ZOOM" | "PENDING_PAYMENT" | "WELCOME"
 *   triggerData?: object
 * }
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { leadId, triggerType, triggerData } = body;

    // Validate required fields
    if (!leadId || !triggerType) {
      return NextResponse.json(
        { error: 'leadId and triggerType are required' },
        { status: 400 }
      );
    }

    // Validate trigger type
    const validTriggers = ['AFTER_OPTIN', 'AFTER_ZOOM', 'PENDING_PAYMENT', 'WELCOME'];
    if (!validTriggers.includes(triggerType)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      );
    }

    // Verify lead belongs to affiliate
    const lead = await prisma.affiliateLead.findFirst({
      where: {
        id: leadId,
        affiliateId: affiliate.id,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Trigger automation
    const result = await automationExecutionService.triggerAutomation({
      leadId,
      affiliateId: affiliate.id,
      triggerType,
      triggerData,
    });

    return NextResponse.json({
      success: true,
      message: 'Automation triggered successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger automation',
      },
      { status: 500 }
    );
  }
}
