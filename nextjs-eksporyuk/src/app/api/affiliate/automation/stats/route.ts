import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { automationExecutionService } from '@/lib/services/automationExecutionService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Get automation execution statistics
 * GET /api/affiliate/automation/stats
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

    // Get comprehensive stats
    const stats = await automationExecutionService.getAutomationStats(affiliate.id);

    // Get additional detailed stats
    const [recentJobs, activeLogs, topAutomations] = await Promise.all([
      // Recent 10 jobs
      prisma.affiliateAutomationJob.findMany({
        where: { affiliateId: affiliate.id },
        include: {
          automation: {
            select: { name: true },
          },
          lead: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Active automation logs
      prisma.affiliateAutomationLog.findMany({
        where: {
          affiliateId: affiliate.id,
          status: 'active',
        },
        include: {
          automation: {
            select: { name: true },
          },
          lead: {
            select: { name: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),

      // Top performing automations
      prisma.affiliateAutomation.findMany({
        where: {
          affiliateId: affiliate.id,
        },
        include: {
          _count: {
            select: {
              jobs: true,
            },
          },
          jobs: {
            where: { status: 'completed' },
            select: { id: true },
          },
        },
        orderBy: {
          jobs: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Calculate performance metrics for top automations
    const topAutomationsWithMetrics = topAutomations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      triggerType: automation.triggerType,
      totalJobs: automation._count.jobs,
      completedJobs: automation.jobs.length,
      successRate: automation._count.jobs > 0 
        ? ((automation.jobs.length / automation._count.jobs) * 100).toFixed(2)
        : '0',
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: stats,
        recentJobs: recentJobs.map((job) => ({
          id: job.id,
          automationName: job.automation.name,
          leadName: job.lead.name,
          leadEmail: job.lead.email,
          status: job.status,
          scheduledAt: job.scheduledAt,
          executedAt: job.executedAt,
          errorMessage: job.errorMessage,
        })),
        activeLogs: activeLogs.map((log) => ({
          id: log.id,
          automationName: log.automation.name,
          leadName: log.lead.name,
          triggerType: log.triggerType,
          progress: `${log.completedSteps}/${log.totalSteps}`,
          status: log.status,
          startedAt: log.startedAt,
          lastExecutedAt: log.lastExecutedAt,
        })),
        topAutomations: topAutomationsWithMetrics,
      },
    });
  } catch (error) {
    console.error('Error fetching automation stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500 }
    );
  }
}
