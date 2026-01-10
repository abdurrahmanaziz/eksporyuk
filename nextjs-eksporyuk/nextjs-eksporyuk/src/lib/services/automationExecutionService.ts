import { prisma } from '@/lib/prisma';
import { mailketingService } from './mailketingService';

interface TriggerAutomationParams {
  leadId: string;
  affiliateId: string;
  triggerType: 'AFTER_OPTIN' | 'AFTER_ZOOM' | 'PENDING_PAYMENT' | 'WELCOME';
  triggerData?: Record<string, any>;
}

interface ScheduleJobParams {
  automationId: string;
  stepId: string;
  leadId: string;
  affiliateId: string;
  scheduledAt: Date;
  creditAmount?: number;
}

export class AutomationExecutionService {
  /**
   * Trigger automation sequence untuk lead tertentu
   */
  async triggerAutomation(params: TriggerAutomationParams) {
    const { leadId, affiliateId, triggerType, triggerData } = params;

    try {
      // Cari automation yang aktif dengan trigger type yang sesuai
      const automations = await prisma.affiliateAutomation.findMany({
        where: {
          affiliateId,
          triggerType,
          isActive: true,
        },
        include: {
          steps: {
            where: { isActive: true },
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (automations.length === 0) {
        console.log(`No active automation found for trigger ${triggerType}`);
        return { success: true, message: 'No automation to trigger' };
      }

      // Process setiap automation yang match
      for (const automation of automations) {
        // Check apakah sudah ada log untuk automation + lead ini
        const existingLog = await prisma.affiliateAutomationLog.findUnique({
          where: {
            automationId_leadId: {
              automationId: automation.id,
              leadId,
            },
          },
        });

        if (existingLog) {
          console.log(`Automation ${automation.id} already triggered for lead ${leadId}`);
          continue;
        }

        // Buat automation log
        await prisma.affiliateAutomationLog.create({
          data: {
            automationId: automation.id,
            leadId,
            affiliateId,
            triggerType,
            triggerData: triggerData ? JSON.stringify(triggerData) : null,
            status: 'active',
            totalSteps: automation.steps.length,
            currentStepOrder: 1,
            completedSteps: 0,
            failedSteps: 0,
          },
        });

        // Schedule jobs untuk semua steps
        const now = new Date();
        for (const step of automation.steps) {
          const scheduledAt = new Date(now.getTime() + step.delayHours * 60 * 60 * 1000);

          await this.scheduleJob({
            automationId: automation.id,
            stepId: step.id,
            leadId,
            affiliateId,
            scheduledAt,
            creditAmount: 1,
          });
        }

        console.log(`Triggered automation ${automation.id} for lead ${leadId} with ${automation.steps.length} steps`);
      }

      return { success: true, message: 'Automation triggered successfully' };
    } catch (error) {
      console.error('Error triggering automation:', error);
      throw error;
    }
  }

  /**
   * Schedule job untuk mengirim email automation
   */
  async scheduleJob(params: ScheduleJobParams) {
    const { automationId, stepId, leadId, affiliateId, scheduledAt, creditAmount = 1 } = params;

    try {
      // Check apakah job sudah ada
      const existingJob = await prisma.affiliateAutomationJob.findFirst({
        where: {
          automationId,
          stepId,
          leadId,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existingJob) {
        console.log(`Job already exists for automation ${automationId}, step ${stepId}, lead ${leadId}`);
        return existingJob;
      }

      // Buat job baru
      const job = await prisma.affiliateAutomationJob.create({
        data: {
          automationId,
          stepId,
          leadId,
          affiliateId,
          status: 'pending',
          scheduledAt,
          creditAmount,
          retryCount: 0,
          maxRetries: 3,
        },
      });

      console.log(`Scheduled job ${job.id} for ${scheduledAt.toISOString()}`);
      return job;
    } catch (error) {
      console.error('Error scheduling job:', error);
      throw error;
    }
  }

  /**
   * Execute pending jobs yang waktunya sudah tiba
   */
  async executePendingJobs() {
    const now = new Date();

    try {
      // Ambil semua pending jobs yang sudah waktunya
      const jobs = await prisma.affiliateAutomationJob.findMany({
        where: {
          status: 'pending',
          scheduledAt: { lte: now },
        },
        include: {
          automation: true,
          step: true,
          lead: true,
          affiliate: {
            include: {
              credit: true,
              user: true,
            },
          },
        },
        take: 50, // Process 50 jobs at a time
        orderBy: { scheduledAt: 'asc' },
      });

      console.log(`Found ${jobs.length} pending jobs to execute`);

      const results = [];
      for (const job of jobs) {
        try {
          const result = await this.executeJob(job);
          results.push(result);
        } catch (error) {
          console.error(`Error executing job ${job.id}:`, error);
          results.push({ jobId: job.id, success: false, error: String(error) });
        }
      }

      return {
        success: true,
        processedCount: results.length,
        successCount: results.filter((r) => r.success).length,
        failedCount: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Error executing pending jobs:', error);
      throw error;
    }
  }

  /**
   * Execute single job
   */
  private async executeJob(job: any) {
    const { id, automation, step, lead, affiliate } = job;

    try {
      // Update status menjadi processing
      await prisma.affiliateAutomationJob.update({
        where: { id },
        data: { status: 'processing' },
      });

      // Check kredit affiliate
      if (!affiliate.credit || affiliate.credit.balance < job.creditAmount) {
        throw new Error(`Insufficient credit. Required: ${job.creditAmount}, Available: ${affiliate.credit?.balance || 0}`);
      }

      // Replace shortcodes di email
      const emailSubject = this.replaceShortcodes(step.emailSubject, {
        nama: lead.name,
        email: lead.email || '',
        whatsapp: lead.whatsapp || lead.phone || '',
        affiliate: affiliate.user.name,
      });

      const emailBody = this.replaceShortcodes(step.emailBody, {
        nama: lead.name,
        email: lead.email || '',
        whatsapp: lead.whatsapp || lead.phone || '',
        affiliate: affiliate.user.name,
      });

      // Kirim email via Mailketing
      const emailResult = await mailketingService.sendEmail({
        to: lead.email || '',
        subject: emailSubject,
        html: emailBody,
        from: process.env.MAILKETING_FROM_EMAIL || 'noreply@eksporyuk.com',
        fromName: affiliate.user.name || 'Ekspor Yuk',
      });

      if (!emailResult.success) {
        throw new Error(`Email sending failed: ${emailResult.error}`);
      }

      // Deduct credit
      await prisma.affiliateCredit.update({
        where: { id: affiliate.credit.id },
        data: {
          balance: { decrement: job.creditAmount },
          totalUsed: { increment: job.creditAmount },
        },
      });

      // Create credit transaction record
      await prisma.affiliateCreditTransaction.create({
        data: {
          affiliateId: affiliate.id,
          type: 'deduct',
          amount: job.creditAmount,
          description: `Automation email: ${automation.name} - Step ${step.stepOrder}`,
          balanceBefore: affiliate.credit.balance,
          balanceAfter: affiliate.credit.balance - job.creditAmount,
        },
      });

      // Update job status
      await prisma.affiliateAutomationJob.update({
        where: { id },
        data: {
          status: 'completed',
          executedAt: new Date(),
          creditDeducted: true,
          emailSent: true,
          emailId: emailResult.emailId || null,
        },
      });

      // Update step sent count
      await prisma.affiliateAutomationStep.update({
        where: { id: step.id },
        data: { sentCount: { increment: 1 } },
      });

      // Update automation log
      await prisma.affiliateAutomationLog.updateMany({
        where: {
          automationId: automation.id,
          leadId: lead.id,
        },
        data: {
          completedSteps: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });

      console.log(`Job ${id} executed successfully`);
      return { jobId: id, success: true, emailId: emailResult.emailId };
    } catch (error) {
      console.error(`Job ${id} failed:`, error);

      // Update retry count
      const newRetryCount = job.retryCount + 1;
      const shouldRetry = newRetryCount < job.maxRetries;

      if (shouldRetry) {
        // Reschedule untuk retry
        const retryAt = new Date(Date.now() + 30 * 60 * 1000); // Retry after 30 minutes

        await prisma.affiliateAutomationJob.update({
          where: { id },
          data: {
            status: 'pending',
            retryCount: newRetryCount,
            scheduledAt: retryAt,
            errorMessage: String(error),
          },
        });

        console.log(`Job ${id} rescheduled for retry ${newRetryCount}/${job.maxRetries}`);
      } else {
        // Mark as failed
        await prisma.affiliateAutomationJob.update({
          where: { id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            errorMessage: String(error),
          },
        });

        // Update automation log
        await prisma.affiliateAutomationLog.updateMany({
          where: {
            automationId: automation.id,
            leadId: lead.id,
          },
          data: {
            failedSteps: { increment: 1 },
          },
        });

        console.log(`Job ${id} marked as failed after ${job.maxRetries} retries`);
      }

      return { jobId: id, success: false, error: String(error), retry: shouldRetry };
    }
  }

  /**
   * Replace shortcodes dalam text
   */
  private replaceShortcodes(text: string, data: Record<string, string>): string {
    let result = text;

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key] || '');
    });

    return result;
  }

  /**
   * Cancel automation untuk lead tertentu
   */
  async cancelAutomation(automationId: string, leadId: string) {
    try {
      // Cancel semua pending jobs
      await prisma.affiliateAutomationJob.updateMany({
        where: {
          automationId,
          leadId,
          status: { in: ['pending'] },
        },
        data: {
          status: 'cancelled',
        },
      });

      // Update automation log
      await prisma.affiliateAutomationLog.updateMany({
        where: {
          automationId,
          leadId,
          status: 'active',
        },
        data: {
          status: 'cancelled',
          pausedAt: new Date(),
        },
      });

      return { success: true, message: 'Automation cancelled' };
    } catch (error) {
      console.error('Error cancelling automation:', error);
      throw error;
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(affiliateId: string) {
    try {
      const [totalAutomations, activeAutomations, totalJobs, completedJobs, failedJobs, pendingJobs] = await Promise.all([
        prisma.affiliateAutomation.count({ where: { affiliateId } }),
        prisma.affiliateAutomation.count({ where: { affiliateId, isActive: true } }),
        prisma.affiliateAutomationJob.count({ where: { affiliateId } }),
        prisma.affiliateAutomationJob.count({ where: { affiliateId, status: 'completed' } }),
        prisma.affiliateAutomationJob.count({ where: { affiliateId, status: 'failed' } }),
        prisma.affiliateAutomationJob.count({ where: { affiliateId, status: 'pending' } }),
      ]);

      return {
        totalAutomations,
        activeAutomations,
        totalJobs,
        completedJobs,
        failedJobs,
        pendingJobs,
        successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : '0',
      };
    } catch (error) {
      console.error('Error getting automation stats:', error);
      throw error;
    }
  }
}

export const automationExecutionService = new AutomationExecutionService();
