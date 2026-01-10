/**
 * Email Credits Monitoring Service
 * Monitors Mailketing account credits and sends alerts when low
 */

import { mailketing } from '@/lib/integrations/mailketing'
import { prisma } from '@/lib/prisma'

interface CreditAlert {
  level: 'warning' | 'critical' | 'emergency'
  threshold: number
  message: string
}

const CREDIT_THRESHOLDS = {
  warning: 50000,     // 50k credits - send warning
  critical: 10000,    // 10k credits - send critical alert
  emergency: 1000     // 1k credits - send emergency alert
}

/**
 * Check email credits balance and send alerts if low
 */
export async function checkEmailCredits(): Promise<{
  balance: number
  status: 'healthy' | 'warning' | 'critical' | 'emergency'
  alert?: CreditAlert
}> {
  try {
    console.log('💰 [CREDITS] Checking Mailketing credits balance...')
    
    const response = await mailketing.getAccountBalance()
    
    if (!response.success || !response.data) {
      console.error('❌ [CREDITS] Failed to fetch balance:', response.error)
      return {
        balance: 0,
        status: 'critical',
        alert: {
          level: 'critical',
          threshold: 0,
          message: 'Cannot fetch email credits balance - API error'
        }
      }
    }
    
    const balance = response.data.balance || 0
    console.log(`💰 [CREDITS] Current balance: ${balance.toLocaleString()} credits`)
    
    // Determine status and alert level
    let status: 'healthy' | 'warning' | 'critical' | 'emergency' = 'healthy'
    let alert: CreditAlert | undefined
    
    if (balance <= CREDIT_THRESHOLDS.emergency) {
      status = 'emergency'
      alert = {
        level: 'emergency',
        threshold: CREDIT_THRESHOLDS.emergency,
        message: `🚨 URGENT: Email credits critically low! Only ${balance.toLocaleString()} credits remaining. Email services may stop soon!`
      }
      await sendCreditAlert(alert, balance)
    } else if (balance <= CREDIT_THRESHOLDS.critical) {
      status = 'critical'
      alert = {
        level: 'critical',
        threshold: CREDIT_THRESHOLDS.critical,
        message: `⚠️ CRITICAL: Email credits running low! Only ${balance.toLocaleString()} credits remaining.`
      }
      await sendCreditAlert(alert, balance)
    } else if (balance <= CREDIT_THRESHOLDS.warning) {
      status = 'warning'
      alert = {
        level: 'warning',
        threshold: CREDIT_THRESHOLDS.warning,
        message: `⚠️ Warning: Email credits below ${CREDIT_THRESHOLDS.warning.toLocaleString()}. Current: ${balance.toLocaleString()} credits.`
      }
      await sendCreditAlert(alert, balance)
    }
    
    // Log to database
    await logCreditCheck(balance, status)
    
    return { balance, status, alert }
    
  } catch (error) {
    console.error('❌ [CREDITS] Error checking credits:', error)
    return {
      balance: 0,
      status: 'critical',
      alert: {
        level: 'critical',
        threshold: 0,
        message: `Error checking email credits: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Send alert to admins about low credits
 */
async function sendCreditAlert(alert: CreditAlert, balance: number): Promise<void> {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })
    
    if (admins.length === 0) {
      console.warn('⚠️ [CREDITS] No admin users found to send alert')
      return
    }
    
    // Log alert to activity log
    await prisma.activityLog.create({
      data: {
        id: `credits-alert-${Date.now()}`,
        userId: admins[0].id, // Use first admin
        action: 'EMAIL_CREDITS_LOW',
        entity: 'EmailCredits',
        entityId: 'mailketing',
        metadata: {
          balance,
          level: alert.level,
          threshold: alert.threshold,
          message: alert.message,
          timestamp: new Date().toISOString()
        }
      }
    })
    
    console.log(`📢 [CREDITS] ${alert.level.toUpperCase()} alert logged for ${balance.toLocaleString()} credits`)
    
    // TODO: Send email/WhatsApp notification to admins
    // For now, just log the alert
    console.log(`📧 [CREDITS] Would send ${alert.level} alert to ${admins.length} admins:`)
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`)
    })
    
  } catch (error) {
    console.error('❌ [CREDITS] Error sending alert:', error)
  }
}

/**
 * Log credit check to database
 */
async function logCreditCheck(balance: number, status: string): Promise<void> {
  try {
    // Store in ActivityLog for now (can create dedicated CreditLog model later)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    
    if (admin) {
      await prisma.activityLog.create({
        data: {
          id: `credits-check-${Date.now()}`,
          userId: admin.id,
          action: 'EMAIL_CREDITS_CHECK',
          entity: 'EmailCredits',
          entityId: 'mailketing',
          metadata: {
            balance,
            status,
            timestamp: new Date().toISOString()
          }
        }
      })
    }
  } catch (error) {
    // Silent fail - don't break the main flow
    console.error('Error logging credit check:', error)
  }
}

/**
 * Get credits usage statistics
 */
export async function getCreditUsageStats(days: number = 30): Promise<{
  checksPerformed: number
  averageBalance: number
  lowestBalance: number
  alertsTriggered: number
}> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)
    
    const logs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ['EMAIL_CREDITS_CHECK', 'EMAIL_CREDITS_LOW']
        },
        createdAt: {
          gte: since
        }
      },
      select: {
        action: true,
        metadata: true
      }
    })
    
    const checks = logs.filter(l => l.action === 'EMAIL_CREDITS_CHECK')
    const alerts = logs.filter(l => l.action === 'EMAIL_CREDITS_LOW')
    
    const balances = checks
      .map(log => (log.metadata as any)?.balance)
      .filter((b): b is number => typeof b === 'number')
    
    return {
      checksPerformed: checks.length,
      averageBalance: balances.length > 0 
        ? Math.round(balances.reduce((a, b) => a + b, 0) / balances.length)
        : 0,
      lowestBalance: balances.length > 0 
        ? Math.min(...balances)
        : 0,
      alertsTriggered: alerts.length
    }
  } catch (error) {
    console.error('Error getting credit stats:', error)
    return {
      checksPerformed: 0,
      averageBalance: 0,
      lowestBalance: 0,
      alertsTriggered: 0
    }
  }
}

/**
 * Estimate credits needed for planned emails
 */
export function estimateCreditsNeeded(emailCount: number): {
  creditsNeeded: number
  recommendation: string
} {
  // Assume 1 credit per email (adjust based on actual Mailketing pricing)
  const creditsNeeded = emailCount
  
  let recommendation = ''
  
  if (creditsNeeded > 10000) {
    recommendation = 'Consider bulk purchase for better rates'
  } else if (creditsNeeded > 5000) {
    recommendation = 'Medium batch - check current balance'
  } else if (creditsNeeded > 1000) {
    recommendation = 'Small batch - should be safe to proceed'
  } else {
    recommendation = 'Very small batch - proceed normally'
  }
  
  return { creditsNeeded, recommendation }
}
