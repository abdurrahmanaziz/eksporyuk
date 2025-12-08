import { NextResponse } from 'next/server';
import { automationExecutionService } from '@/lib/services/automationExecutionService';

/**
 * Cron endpoint untuk menjalankan automation jobs
 * 
 * Setup di Vercel Cron:
 * - URL: /api/cron/automation
 * - Schedule: every 15 minutes
 * 
 * Atau gunakan external cron service seperti:
 * - cron-job.org
 * - EasyCron
 * - UptimeRobot
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret untuk security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-me';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting automation execution...');
    const startTime = Date.now();

    // Execute pending jobs
    const result = await automationExecutionService.executePendingJobs();

    const executionTime = Date.now() - startTime;

    console.log('[CRON] Automation execution completed', {
      processedCount: result.processedCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      executionTime: `${executionTime}ms`,
    });

    return NextResponse.json({
      success: true,
      message: 'Automation jobs processed',
      data: {
        processedCount: result.processedCount,
        successCount: result.successCount,
        failedCount: result.failedCount,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Error executing automation:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative POST endpoint untuk manual trigger
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-me';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[MANUAL] Manual automation trigger started');
    const result = await automationExecutionService.executePendingJobs();

    return NextResponse.json({
      success: true,
      message: 'Manual automation execution completed',
      data: result,
    });
  } catch (error) {
    console.error('[MANUAL] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
