import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * Get automation execution logs
 * GET /api/affiliate/automation/logs?automationId=xxx
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automationId');
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      affiliateId: affiliate.id,
    };

    if (automationId) {
      where.automationId = automationId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (status) {
      where.status = status;
    }

    // Get logs
    const [logs, total] = await Promise.all([
      prisma.affiliateAutomationLog.findMany({
        where,
        include: {
          automation: {
            select: {
              id: true,
              name: true,
              triggerType: true,
            },
          },
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.affiliateAutomationLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
      },
      { status: 500 }
    );
  }
}
